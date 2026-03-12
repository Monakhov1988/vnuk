import cron from "node-cron";
import { InlineKeyboard } from "grammy";
import { storage } from "./storage";
import { bot } from "./telegram";
import { generateProactiveMessage } from "./ai";
import { gatherProactiveContext } from "./proactiveContext";

function getMoscowTime(): { hour: number; minute: number; dateStr: string } {
  const now = new Date();
  const msk = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
  return {
    hour: msk.getHours(),
    minute: msk.getMinutes(),
    dateStr: msk.toISOString().slice(0, 10),
  };
}

function isSameDay(date: Date | null, dateStr: string): boolean {
  if (!date) return false;
  const d = new Date(date.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
  return d.toISOString().slice(0, 10) === dateStr;
}

async function checkReminders() {
  if (!isBotReady()) return;

  const { hour, minute, dateStr } = getMoscowTime();
  const remindersNow = await storage.getActiveRemindersForTime(hour, minute);

  for (const reminder of remindersNow) {
    try {
      if (isSameDay(reminder.lastTriggered, dateStr)) {
        continue;
      }

      if (reminder.status === "confirmed" && isSameDay(reminder.lastConfirmed, dateStr)) {
        continue;
      }

      const parent = await storage.getUser(reminder.parentId);
      if (!parent?.telegramChatId) continue;

      const personality = await storage.getPersonalitySettings(reminder.parentId);
      const isVy = (personality?.formality || "ты") === "вы";

      const keyboard = new InlineKeyboard()
        .text(`Принял(а) ✅`, `confirm_med_${reminder.id}`);

      const nameOrDear = parent.name ? parent.name.split(" ")[0] : (isVy ? "дорогой" : "родненький");
      const medText = isVy
        ? `${nameOrDear}, не забудьте про ${reminder.medicineName} 💊\n\nПриняли — нажмите кнопочку, я буду спокоен:`
        : `${nameOrDear}, не забудь про ${reminder.medicineName} 💊\n\nПринял(а) — нажми кнопочку, я буду спокоен:`;

      await bot.api.sendMessage(
        parent.telegramChatId,
        medText,
        { reply_markup: keyboard }
      );

      await storage.updateReminderLastTriggered(reminder.id, new Date());

      const children = await storage.getChildrenByParentId(reminder.parentId);
      for (const child of children) {
        await storage.createEvent({
          userId: child.id,
          parentId: reminder.parentId,
          type: "medication",
          severity: "info",
          title: `Напоминание отправлено: ${reminder.medicineName}`,
          description: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} — уведомление доставлено в Telegram`,
        });
      }

      console.log(`[scheduler] Sent reminder: ${reminder.medicineName} to parent ${reminder.parentId}`);
    } catch (err) {
      console.error(`[scheduler] Error sending reminder ${reminder.id}:`, err);
    }
  }
}

async function checkMissedReminders() {
  if (!isBotReady()) return;

  const { hour, minute, dateStr } = getMoscowTime();

  let allMinusThirty = hour * 60 + minute - 30;
  if (allMinusThirty < 0) {
    allMinusThirty += 24 * 60;
  }

  const checkHour = Math.floor(allMinusThirty / 60);
  const checkMinute = allMinusThirty % 60;

  const checkDateStr = allMinusThirty > hour * 60 + minute
    ? (() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().slice(0, 10);
      })()
    : dateStr;

  const reminders = await storage.getActiveRemindersForTime(checkHour, checkMinute);

  for (const reminder of reminders) {
    try {
      if (!isSameDay(reminder.lastTriggered, checkDateStr)) continue;
      if (reminder.status === "confirmed" && isSameDay(reminder.lastConfirmed, checkDateStr)) continue;

      const parent = await storage.getUser(reminder.parentId);
      if (!parent?.telegramChatId) continue;

      const personality = await storage.getPersonalitySettings(reminder.parentId);
      const isVy = (personality?.formality || "ты") === "вы";

      const keyboard = new InlineKeyboard()
        .text(`Принял(а) ✅`, `confirm_med_${reminder.id}`);

      const nameOrDear = parent.name ? parent.name.split(" ")[0] : (isVy ? "дорогой" : "родненький");
      const missedText = isVy
        ? `${nameOrDear}, а Вы ${reminder.medicineName} сегодня принимали? Я просто волнуюсь 💊`
        : `${nameOrDear}, а ${reminder.medicineName} сегодня принял(а)? Я просто волнуюсь 💊`;

      await bot.api.sendMessage(
        parent.telegramChatId,
        missedText,
        { reply_markup: keyboard }
      );

      const children = await storage.getChildrenByParentId(reminder.parentId);
      for (const child of children) {
        await storage.createEvent({
          userId: child.id,
          parentId: reminder.parentId,
          type: "medication",
          severity: "warning",
          title: `${reminder.medicineName} — не подтверждено`,
          description: `Прошло 30 минут с напоминания, родитель не подтвердил приём`,
        });

        if (child.telegramChatId) {
          try {
            await bot.api.sendMessage(
              child.telegramChatId,
              `⚠️ ${parent.name} не подтвердил(а) приём лекарства "${reminder.medicineName}" (${String(checkHour).padStart(2, "0")}:${String(checkMinute).padStart(2, "0")}). Возможно, стоит позвонить.`
            );
          } catch {}
        }
      }

      console.log(`[scheduler] Sent missed reminder alert: ${reminder.medicineName} for parent ${reminder.parentId}`);
    } catch (err) {
      console.error(`[scheduler] Error checking missed reminder ${reminder.id}:`, err);
    }
  }
}

function isBotReady(): boolean {
  return bot && (bot as any).__ready === true;
}

const proactiveLock = new Set<number>();

function getProactiveCountToday(messages: any[], dateStr: string): number {
  return messages.filter(m => {
    if (!m.intent || !m.intent.startsWith("proactive")) return false;
    if (!m.createdAt) return false;
    const msgDate = new Date(m.createdAt.toLocaleString("en-US", { timeZone: "Europe/Moscow" })).toISOString().slice(0, 10);
    return msgDate === dateStr;
  }).length;
}

async function analyzeEngagement(parentId: number): Promise<"high" | "normal" | "opted_out"> {
  const parent = await storage.getUser(parentId);
  if (parent?.proactiveOptOut) return "opted_out";

  const responses = await storage.getRecentProactiveResponses(parentId, 5);
  if (responses.length === 0) return "normal";

  let engagedCount = 0;
  for (const r of responses) {
    const isLong = r.content.length > 50;
    const hasQuestion = r.content.includes("?");
    if (isLong || hasQuestion) engagedCount++;
  }

  return engagedCount >= 3 ? "high" : "normal";
}

async function getMaxProactivePerDay(parentId: number): Promise<number> {
  const engagement = await analyzeEngagement(parentId);
  if (engagement === "opted_out") return 0;
  if (engagement === "high") return 3;
  return 2;
}

async function checkProactiveMessages() {
  if (!isBotReady()) return;

  const { hour, dateStr } = getMoscowTime();

  if (hour < 9 || hour > 20) return;

  try {
    const parents = await storage.getAllActiveParents();

    for (const parent of parents) {
      if (proactiveLock.has(parent.id)) continue;
      proactiveLock.add(parent.id);

      try {
        if (parent.proactiveOptOut) continue;

        const recentMessages = await storage.getChatMessages(parent.id, 20);
        const todayCount = getProactiveCountToday(recentMessages, dateStr);
        const maxPerDay = await getMaxProactivePerDay(parent.id);
        if (maxPerDay === 0 || todayCount >= maxPerDay) continue;

        const lastProactiveTime = await storage.getLastProactiveTime(parent.id);
        if (lastProactiveTime) {
          const hoursSinceLastProactive = (Date.now() - lastProactiveTime.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastProactive < 2) continue;
        }

        const lastMsgTime = await storage.getLastMessageTime(parent.id);
        if (!lastMsgTime) continue;

        const hoursSinceLastMsg = (Date.now() - lastMsgTime.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastMsg < 2) continue;

        const todayCategories = await storage.getProactiveCategoriesToday(parent.id, dateStr);
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = new Date(yesterdayDate.toLocaleString("en-US", { timeZone: "Europe/Moscow" })).toISOString().slice(0, 10);
        const yesterdayCategories = await storage.getProactiveCategoriesToday(parent.id, yesterdayStr);

        const ctx = await gatherProactiveContext(parent.id);
        const result = await generateProactiveMessage(parent.id, undefined, ctx, todayCategories, yesterdayCategories);
        if (!result) continue;

        if (todayCategories.includes(result.category)) {
          console.log(`[scheduler] Category ${result.category} already used today for parent ${parent.id}, skipping`);
          continue;
        }

        const doubleCheck = await storage.getChatMessages(parent.id, 20);
        if (getProactiveCountToday(doubleCheck, dateStr) >= maxPerDay) {
          console.log(`[scheduler] Proactive limit reached for parent ${parent.id} (double-check), skipping`);
          continue;
        }

        await storage.createChatMessage({
          parentId: parent.id,
          role: "assistant",
          content: result.text,
          intent: `proactive:${result.category}`,
          hasAlert: false,
        });

        if (result.memoirPromptId) {
          try {
            await storage.createUserMemory({
              parentId: parent.id,
              category: "memoir_prompt_used",
              fact: result.memoirPromptId,
            });
          } catch (e) {
            console.error(`[scheduler] Failed to save memoir prompt tracking for parent ${parent.id}:`, e);
          }
        }

        if (result.featureId) {
          try {
            await storage.createUserMemory({
              parentId: parent.id,
              category: "feature_discovery",
              fact: result.featureId,
            });
          } catch (e) {
            console.error(`[scheduler] Failed to save feature discovery tracking for parent ${parent.id}:`, e);
          }
        }

        await bot.api.sendMessage(parent.telegramChatId!, result.text);

        console.log(`[scheduler] Sent proactive:${result.category} to parent ${parent.id} (today: ${todayCount + 1}/${maxPerDay})`);
      } catch (err) {
        console.error(`[scheduler] Error sending proactive message to parent ${parent.id}:`, err);
      } finally {
        proactiveLock.delete(parent.id);
      }
    }
  } catch (err) {
    console.error("[scheduler] Error in checkProactiveMessages:", err);
  }
}

async function resetDailyStatuses() {
  try {
    await storage.resetAllReminderStatuses();
    console.log("[scheduler] Midnight MSK — all reminder statuses reset to pending");
  } catch (err) {
    console.error("[scheduler] Error resetting daily statuses:", err);
  }
}

async function generateWeeklySafetyReport() {
  if (!isBotReady()) return;

  try {
    const parents = await storage.getAllActiveParents();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const parent of parents) {
      try {
        const children = await storage.getChildrenByParentId(parent.id);
        if (children.length === 0) continue;

        const weekEvents = await storage.getEventsForPeriod(parent.id, weekAgo, now);
        const alertsBySeverity = { info: 0, warning: 0, critical: 0 };
        for (const evt of weekEvents) {
          if (evt.severity in alertsBySeverity) {
            alertsBySeverity[evt.severity as keyof typeof alertsBySeverity]++;
          }
        }

        const medStats = await storage.getRemindersConfirmedCount(parent.id, weekAgo, now);

        const chatDays = await storage.getChatActivityDays(parent.id, weekAgo);

        const bpLogs = await storage.getHealthLogsForPeriod(parent.id, weekAgo, now);

        const weekMemoirs = await storage.getMemoirsForPeriod(parent.id, weekAgo, now);

        const lines: string[] = [];
        lines.push(`📋 Еженедельный отчёт о ${parent.name}`);
        lines.push(`Период: ${weekAgo.toLocaleDateString("ru-RU")} — ${now.toLocaleDateString("ru-RU")}`);
        lines.push("");

        lines.push(`💬 Активность в чате: ${chatDays} из 7 дней`);

        if (medStats.total > 0) {
          lines.push(`💊 Лекарства: ${medStats.confirmed} принято, ${medStats.missed} пропущено (из ${medStats.total})`);
        } else {
          lines.push(`💊 Лекарства: напоминания не настроены`);
        }

        if (bpLogs.length > 0) {
          lines.push(`🩺 Давление: ${bpLogs.length} измерений за неделю`);
        } else {
          lines.push(`🩺 Давление: записей нет`);
        }

        if (weekMemoirs.length > 0) {
          lines.push(`📖 Книга жизни: ${weekMemoirs.length} новых историй`);
        }

        if (alertsBySeverity.critical > 0) {
          lines.push(`🔴 Критических событий: ${alertsBySeverity.critical}`);
        }
        if (alertsBySeverity.warning > 0) {
          lines.push(`🟡 Предупреждений: ${alertsBySeverity.warning}`);
        }

        lines.push("");
        if (chatDays >= 5) {
          lines.push("✅ Отличная активность! Родитель регулярно общается с ботом.");
        } else if (chatDays >= 3) {
          lines.push("👍 Хорошая активность. Родитель пользуется ботом несколько раз в неделю.");
        } else if (chatDays >= 1) {
          lines.push("⚠️ Низкая активность. Возможно, стоит позвонить и узнать, всё ли в порядке.");
        } else {
          lines.push("❗ Родитель не общался с ботом на этой неделе. Рекомендуем связаться.");
        }

        const reportText = lines.join("\n");

        for (const child of children) {
          try {
            await storage.createEvent({
              userId: child.id,
              parentId: parent.id,
              type: "checkin",
              severity: "info",
              title: "Еженедельный отчёт",
              description: reportText,
            });

            if (child.telegramChatId) {
              try {
                await bot.api.sendMessage(child.telegramChatId, reportText);
              } catch (tgErr) {
                console.error(`[scheduler] Failed to send weekly report to child ${child.id} via Telegram:`, tgErr);
              }
            }
          } catch (childErr) {
            console.error(`[scheduler] Failed to create weekly report event for child ${child.id}:`, childErr);
          }
        }

        console.log(`[scheduler] Weekly safety report generated for parent ${parent.id}, sent to ${children.length} children`);
      } catch (parentErr) {
        console.error(`[scheduler] Error generating weekly report for parent ${parent.id}:`, parentErr);
      }
    }
  } catch (err) {
    console.error("[scheduler] Error in generateWeeklySafetyReport:", err);
  }
}

async function generateDailySummary() {
  if (!isBotReady()) return;

  try {
    const parents = await storage.getAllActiveParents();
    const { dateStr } = getMoscowTime();

    for (const parent of parents) {
      try {
        const children = await storage.getChildrenByParentId(parent.id);
        if (children.length === 0) continue;

        const msgCount = await storage.getChatMessageCountForDate(parent.id, dateStr);
        if (msgCount === 0) continue;

        const now = new Date();
        const mskNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
        const dayStart = new Date(mskNow);
        dayStart.setHours(0, 0, 0, 0);
        const dayStartUTC = new Date(dayStart.getTime() - 3 * 60 * 60 * 1000);

        const medStats = await storage.getRemindersConfirmedCount(parent.id, dayStartUTC, now);
        const bpLogs = await storage.getHealthLogsForPeriod(parent.id, dayStartUTC, now);
        const dayMemoirs = await storage.getMemoirsForPeriod(parent.id, dayStartUTC, now);

        const lines: string[] = [];
        lines.push(`🌙 Вечерняя сводка о ${parent.name}`);
        lines.push("");
        lines.push(`💬 Сегодня общался(ась) с Внучком — ${msgCount} сообщений`);

        if (medStats.total > 0) {
          if (medStats.missed > 0) {
            lines.push(`💊 Лекарства: ${medStats.confirmed} принято, ${medStats.missed} не подтверждено ⚠️`);
          } else {
            lines.push(`💊 Лекарства: все приняты ✅`);
          }
        }

        if (bpLogs.length > 0) {
          const latest = bpLogs[0];
          lines.push(`🩺 Давление: ${latest.systolic}/${latest.diastolic}`);
        }

        if (dayMemoirs.length > 0) {
          lines.push(`📖 Новых историй: ${dayMemoirs.length}`);
        }

        lines.push("");
        lines.push("Внучок был рядом весь день 💛");

        const summaryText = lines.join("\n");

        for (const child of children) {
          if (!child.telegramChatId) continue;
          try {
            await bot.api.sendMessage(child.telegramChatId, summaryText);
          } catch (err) {
            console.error(`[scheduler] Failed to send daily summary to child ${child.id}:`, err);
          }
        }

        console.log(`[scheduler] Daily summary sent for parent ${parent.id}`);
      } catch (parentErr) {
        console.error(`[scheduler] Error generating daily summary for parent ${parent.id}:`, parentErr);
      }
    }
  } catch (err) {
    console.error("[scheduler] Error in generateDailySummary:", err);
  }
}

async function generateMonthlyMilestones() {
  if (!isBotReady()) return;

  try {
    const parents = await storage.getAllActiveParents();

    for (const parent of parents) {
      try {
        const children = await storage.getChildrenByParentId(parent.id);
        if (children.length === 0) continue;

        const regDate = await storage.getRegistrationDate(parent.id);
        const totalDays = regDate ? Math.floor((Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        if (totalDays < 7) continue;

        const stats = await storage.getParentEngagementStats(parent.id);

        const lines: string[] = [];
        lines.push(`🎯 ${parent.name} общается с Внучком уже ${totalDays} дней!`);
        lines.push("");
        lines.push(`📖 Записано историй в Книгу жизни: ${stats.memoirsCount}`);
        lines.push(`📅 Активных дней за месяц: ${stats.daysActive30}`);
        lines.push("");
        lines.push("Спасибо что заботитесь о близких 💛");

        const milestoneText = lines.join("\n");

        for (const child of children) {
          if (!child.telegramChatId) continue;
          try {
            await bot.api.sendMessage(child.telegramChatId, milestoneText);
          } catch (err) {
            console.error(`[scheduler] Failed to send milestone to child ${child.id}:`, err);
          }
        }

        console.log(`[scheduler] Monthly milestone sent for parent ${parent.id}`);
      } catch (parentErr) {
        console.error(`[scheduler] Error generating milestone for parent ${parent.id}:`, parentErr);
      }
    }
  } catch (err) {
    console.error("[scheduler] Error in generateMonthlyMilestones:", err);
  }
}

let schedulerStarted = false;

export function startScheduler() {
  if (schedulerStarted) {
    console.warn("[scheduler] Already started, skipping duplicate init");
    return;
  }
  schedulerStarted = true;

  cron.schedule("* * * * *", async () => {
    try {
      await checkReminders();
    } catch (err) {
      console.error("[scheduler] checkReminders error:", err);
    }
  }, { timezone: "Europe/Moscow" });

  cron.schedule("* * * * *", async () => {
    try {
      await checkMissedReminders();
    } catch (err) {
      console.error("[scheduler] checkMissedReminders error:", err);
    }
  }, { timezone: "Europe/Moscow" });

  cron.schedule("0 0 * * *", resetDailyStatuses, { timezone: "Europe/Moscow" });

  cron.schedule("0 9,11,14,17,20 * * *", async () => {
    const jitterMs = Math.floor(Math.random() * 30 * 60 * 1000);
    console.log(`[scheduler] Proactive check scheduled with ${Math.round(jitterMs / 60000)}min jitter`);
    setTimeout(async () => {
      try {
        await checkProactiveMessages();
      } catch (err) {
        console.error("[scheduler] checkProactiveMessages error:", err);
      }
    }, jitterMs);
  }, { timezone: "Europe/Moscow" });

  cron.schedule("0 20 * * 0", async () => {
    try {
      await generateWeeklySafetyReport();
    } catch (err) {
      console.error("[scheduler] generateWeeklySafetyReport error:", err);
    }
  }, { timezone: "Europe/Moscow" });

  cron.schedule("0 21 * * *", async () => {
    try {
      await generateDailySummary();
    } catch (err) {
      console.error("[scheduler] generateDailySummary error:", err);
    }
  }, { timezone: "Europe/Moscow" });

  cron.schedule("0 12 1 * *", async () => {
    try {
      await generateMonthlyMilestones();
    } catch (err) {
      console.error("[scheduler] generateMonthlyMilestones error:", err);
    }
  }, { timezone: "Europe/Moscow" });

  console.log("[scheduler] Medication reminder + proactive message + weekly report + daily summary + monthly milestone scheduler started (MSK timezone)");
}
