import cron from "node-cron";
import { InlineKeyboard } from "grammy";
import { storage } from "./storage";
import { bot } from "./telegram";

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
  if (!bot) return;

  const { hour, minute, dateStr } = getMoscowTime();
  const remindersNow = await storage.getActiveRemindersForTime(hour, minute);

  for (const reminder of remindersNow) {
    try {
      if (isSameDay(reminder.lastTriggered, dateStr)) {
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
  if (!bot) return;

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

async function resetDailyStatuses() {
  const { hour, minute } = getMoscowTime();
  if (hour === 0 && minute === 0) {
    console.log("[scheduler] Midnight MSK — daily reminder statuses will reset naturally via lastConfirmed check");
  }
}

export function startScheduler() {
  cron.schedule("* * * * *", async () => {
    try {
      await checkReminders();
    } catch (err) {
      console.error("[scheduler] checkReminders error:", err);
    }
  });

  cron.schedule("* * * * *", async () => {
    try {
      await checkMissedReminders();
    } catch (err) {
      console.error("[scheduler] checkMissedReminders error:", err);
    }
  });

  cron.schedule("0 0 * * *", resetDailyStatuses);

  console.log("[scheduler] Medication reminder scheduler started (MSK timezone)");
}
