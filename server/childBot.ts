import { Bot } from "grammy";
import { storage } from "./storage";

export let childBot: Bot | null = null;
export let childBotUsername: string | null = null;

export async function startChildBot() {
  const token = process.env.TELEGRAM_CHILD_BOT_TOKEN;
  if (!token) {
    console.log("[child-bot] TELEGRAM_CHILD_BOT_TOKEN not set, skipping child bot startup");
    return;
  }

  childBot = new Bot(token);

  childBot.command("start", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const deepLinkCode = ctx.match?.trim().toUpperCase() || "";
    console.log(`[child-bot] /start from chat ${chatId}${deepLinkCode ? ` with code: ${deepLinkCode}` : ""}`);

    if (deepLinkCode.startsWith("CHILDTG_")) {
      const tokenData = await storage.consumeChildTelegramToken(deepLinkCode);
      if (!tokenData) {
        await ctx.reply("Ссылка истекла или уже использована. Сгенерируйте новую в личном кабинете.");
        return;
      }
      await storage.updateUserTelegramChatId(tokenData.childId, chatId);
      const childUser = await storage.getUser(tokenData.childId);
      await ctx.reply(
        `Telegram подключён, ${childUser?.name || ""}! 🎉\n\nТеперь вы будете получать:\n• Вечернюю сводку о родителе\n• Оповещения о давлении\n• Важные алерты безопасности\n• Уведомления о новых мемуарах`
      );
      console.log(`[child-bot] Child ${tokenData.childId} linked Telegram chat ${chatId}`);
      return;
    }

    const existing = await storage.getUserByTelegramChatId(chatId);
    if (existing && existing.role === "child") {
      await ctx.reply(
        `Привет, ${existing.name || ""}! Это бот уведомлений Внучка.\n\nЗдесь вы будете получать:\n• Вечернюю сводку о родителе\n• Оповещения о давлении\n• Важные алерты безопасности\n• Уведомления о мемуарах`
      );
      return;
    }

    await ctx.reply(
      "Этот бот предназначен для уведомлений родственников.\n\nЧтобы подключиться, нажмите «Подключить Telegram» в личном кабинете на сайте."
    );
  });

  childBot.on("message:text", async (ctx) => {
    const userText = ctx.message.text.trim();

    if (userText.startsWith("CHILDTG_")) {
      const chatId = ctx.chat.id.toString();
      const tokenData = await storage.consumeChildTelegramToken(userText);
      if (!tokenData) {
        await ctx.reply("Код не найден, истёк или уже использован. Сгенерируйте новый в личном кабинете.");
        return;
      }
      await storage.updateUserTelegramChatId(tokenData.childId, chatId);
      const childUser = await storage.getUser(tokenData.childId);
      await ctx.reply(
        `Telegram подключён, ${childUser?.name || ""}! 🎉\n\nТеперь вы будете получать:\n• Вечернюю сводку о родителе\n• Оповещения о давлении\n• Важные алерты безопасности\n• Уведомления о новых мемуарах`
      );
      console.log(`[child-bot] Child ${tokenData.childId} linked via text code, chat ${chatId}`);
      return;
    }

    await ctx.reply(
      "Этот бот предназначен только для уведомлений. Все настройки — в личном кабинете на сайте."
    );
  });

  childBot.catch((err) => {
    console.error("[child-bot] Bot error:", err.message || err);
  });

  try {
    const me = await childBot.api.getMe();
    childBotUsername = me.username || null;
    console.log(`[child-bot] Bot username: @${childBotUsername}`);

    await childBot.api.setMyCommands([
      { command: "start", description: "Начать / Подключить уведомления" },
    ]);

    childBot.start({
      onStart: () => console.log("[child-bot] Child notification bot started successfully"),
    });
  } catch (err) {
    console.error("[child-bot] Failed to start child bot:", err);
    childBot = null;
  }
}

export async function sendChildNotification(chatId: string, text: string, parseMode?: "Markdown" | "HTML"): Promise<boolean> {
  if (!childBot) return false;
  try {
    await childBot.api.sendMessage(chatId, text, parseMode ? { parse_mode: parseMode } : undefined);
    return true;
  } catch (err) {
    console.error(`[child-bot] Failed to send notification to ${chatId}:`, err);
    return false;
  }
}
