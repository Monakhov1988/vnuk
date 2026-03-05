import cron from "node-cron";
import { InlineKeyboard } from "grammy";
import { storage } from "./storage";
import { bot } from "./telegram";
import { generateProactiveMessage } from "./ai";

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

      const keyboard = new InlineKeyboard()
        .text(`Принял(а) ✅`, `confirm_med_${reminder.id}`);

      await bot.api.sendMessage(
        parent.telegramChatId,
        `Время принять ${reminder.medicineName}! 💊\n\nНажмите кнопку, когда примете:`,
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

      const keyboard = new InlineKeyboard()
        .text(`Принял(а) ✅`, `confirm_med_${reminder.id}`);

      await bot.api.sendMessage(
        parent.telegramChatId,
        `Напоминаю: пора принять ${reminder.medicineName}! 💊\nВы ещё не подтвердили приём.`,
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

function hasProactiveToday(messages: any[], dateStr: string): boolean {
  return messages.some(m => {
    if (m.intent !== "proactive") return false;
    if (!m.createdAt) return false;
    const msgDate = new Date(m.createdAt.toLocaleString("en-US", { timeZone: "Europe/Moscow" })).toISOString().slice(0, 10);
    return msgDate === dateStr;
  });
}

async function checkProactiveMessages() {
  if (!isBotReady()) return;

  const { hour, dateStr } = getMoscowTime();

  if (hour < 9 || hour > 20) return;

  try {
    const parents = await storage.getAllActiveParents();

    for (const parent of parents) {
      if (proactiveLock.has(parent.id)) continue;

      try {
        const recentMessages = await storage.getChatMessages(parent.id, 20);
        if (hasProactiveToday(recentMessages, dateStr)) continue;

        const lastMsgTime = await storage.getLastMessageTime(parent.id);

        if (!lastMsgTime) continue;

        const hoursSinceLastMsg = (Date.now() - lastMsgTime.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastMsg < 4) continue;

        proactiveLock.add(parent.id);

        try {
          const message = await generateProactiveMessage(parent.id);
          if (!message) continue;

          const doubleCheck = await storage.getChatMessages(parent.id, 20);
          if (hasProactiveToday(doubleCheck, dateStr)) {
            console.log(`[scheduler] Proactive already sent to parent ${parent.id} (double-check), skipping`);
            continue;
          }

          await storage.createChatMessage({
            parentId: parent.id,
            role: "assistant",
            content: message,
            intent: "proactive",
            hasAlert: false,
          });

          await bot.api.sendMessage(parent.telegramChatId!, message);

          console.log(`[scheduler] Sent proactive message to parent ${parent.id}`);
        } finally {
          proactiveLock.delete(parent.id);
        }
      } catch (err) {
        proactiveLock.delete(parent.id);
        console.error(`[scheduler] Error sending proactive message to parent ${parent.id}:`, err);
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
    try {
      await checkProactiveMessages();
    } catch (err) {
      console.error("[scheduler] checkProactiveMessages error:", err);
    }
  }, { timezone: "Europe/Moscow" });

  console.log("[scheduler] Medication reminder + proactive message scheduler started (MSK timezone)");
}
