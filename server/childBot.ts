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

  childBot.use(async (ctx, next) => {
    console.log(`[child-bot] Update received: ${JSON.stringify(ctx.update).substring(0, 300)}`);
    await next();
  });

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

    const recentToken = await storage.findMostRecentPendingToken();
    if (recentToken) {
      const childUser = await storage.getUser(recentToken.childId);
      if (childUser) {
        const { InlineKeyboard } = await import("grammy");
        const kb = new InlineKeyboard()
          .text("Да, это я", `link_confirm_${recentToken.token}`)
          .text("Нет", "link_cancel");
        await ctx.reply(
          `Вы — ${childUser.name}?\n\nНажмите «Да, это я» для подключения уведомлений.`,
          { reply_markup: kb }
        );
        return;
      }
    }

    await ctx.reply(
      "Этот бот предназначен для уведомлений родственников.\n\nЧтобы подключиться, нажмите «Подключить Telegram» в личном кабинете на сайте."
    );
  });

  childBot.callbackQuery(/^link_confirm_(.+)$/, async (ctx) => {
    const token = ctx.match[1];
    const chatId = ctx.chat!.id.toString();
    const tokenData = await storage.consumeChildTelegramToken(token);
    if (!tokenData) {
      await ctx.answerCallbackQuery({ text: "Ссылка истекла. Сгенерируйте новую." });
      return;
    }
    await storage.updateUserTelegramChatId(tokenData.childId, chatId);
    const childUser = await storage.getUser(tokenData.childId);
    await ctx.answerCallbackQuery({ text: "Подключено!" });
    await ctx.editMessageText(
      `Telegram подключён, ${childUser?.name || ""}! 🎉\n\nТеперь вы будете получать:\n• Вечернюю сводку о родителе\n• Оповещения о давлении\n• Важные алерты безопасности\n• Уведомления о новых мемуарах`
    );
    console.log(`[child-bot] Child ${tokenData.childId} linked via confirmation button, chat ${chatId}`);
  });

  childBot.callbackQuery("link_cancel", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("Хорошо. Если нужно подключить уведомления — нажмите «Подключить Telegram» в личном кабинете.");
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
    console.log(`[child-bot] Bot id=${me.id}, username=@${childBotUsername}`);

    const webhookInfo = await childBot.api.getWebhookInfo();
    if (webhookInfo.url) {
      console.log(`[child-bot] Webhook was set to: ${webhookInfo.url}, deleting...`);
      await childBot.api.deleteWebhook({ drop_pending_updates: true });
    }
    console.log(`[child-bot] Webhook cleared, using long polling`);

    await childBot.api.setMyCommands([
      { command: "start", description: "Начать / Подключить уведомления" },
    ]);

    childBot.start({
      onStart: () => console.log("[child-bot] Child notification bot started successfully (polling)"),
      allowed_updates: ["message", "callback_query"],
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
