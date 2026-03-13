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
      const existingForDeepLink = await storage.getUserByTelegramChatId(chatId);
      if (existingForDeepLink && existingForDeepLink.id !== tokenData.childId) {
        await storage.clearUserTelegramChatId(existingForDeepLink.id);
      }
      await storage.updateUserTelegramChatId(tokenData.childId, chatId);
      const childUser = await storage.getUser(tokenData.childId);
      const parent = await storage.getLinkedParent(tokenData.childId);
      const parentName = parent?.name || "вашего родителя";
      await ctx.reply(
        `Telegram подключён, ${childUser?.name || ""}! 🎉\n\n` +
        `Теперь вы будете получать уведомления о ${parentName}:\n` +
        `• Вечерняя сводка — каждый день в 21:00\n` +
        `• Оповещения о давлении — если показатели выходят за норму\n` +
        `• Алерты безопасности — мошенники, опасность\n` +
        `• Новые мемуары — когда родитель делится воспоминаниями\n\n` +
        `Что дальше?\n` +
        `Отправьте родителю ссылку на бот @vnuchok1_bot — это AI-помощник Внучок. Там родитель может общаться, искать рецепты, узнавать погоду, записывать мемуары и многое другое.\n\n` +
        `Управлять напоминаниями и видеть активность родителя можно в личном кабинете на сайте.`
      );
      console.log(`[child-bot] Child ${tokenData.childId} linked Telegram chat ${chatId}`);
      return;
    }

    const existing = await storage.getUserByTelegramChatId(chatId);
    if (existing && existing.role === "child") {
      const parent = await storage.getLinkedParent(existing.id);
      const parentName = parent?.name || "вашего родителя";
      await ctx.reply(
        `Привет, ${existing.name || ""}! Telegram уже подключён.\n\nЗдесь вы получаете уведомления о ${parentName}:\n• Вечерняя сводка (21:00)\n• Оповещения о давлении\n• Алерты безопасности\n• Новые мемуары\n\nРодитель общается с Внучком через бот @vnuchok1_bot — там AI-помощник, рецепты, погода и многое другое.`
      );
      return;
    }

    await ctx.reply(
      "Здравствуйте! Это бот уведомлений сервиса Внучок.\n\nВведите код привязки из личного кабинета (например: CHILDTG_A1B2C3D4).\n\nКод можно получить на сайте: кнопка «Подключить Telegram» в разделе уведомлений."
    );
  });

  childBot.callbackQuery(/^link_confirm_(.+)$/, async (ctx) => {
    const tokenStr = ctx.match[1];
    const chatId = ctx.chat!.id.toString();

    const alreadyLinked = await storage.getUserByTelegramChatId(chatId);
    if (alreadyLinked && alreadyLinked.role === "child") {
      await ctx.answerCallbackQuery({ text: "Уже подключено!" });
      await ctx.editMessageText(
        `Telegram уже подключён, ${alreadyLinked.name || ""}! 🎉\n\nВы получаете уведомления.`
      );
      return;
    }

    let tokenData = await storage.consumeChildTelegramToken(tokenStr);
    if (!tokenData) {
      const freshToken = await storage.findMostRecentPendingToken();
      if (freshToken) {
        tokenData = await storage.consumeChildTelegramToken(freshToken.token);
      }
    }
    if (!tokenData) {
      await ctx.answerCallbackQuery({ text: "Код истёк. Сгенерируйте новый в ЛК." });
      return;
    }
    try {
      if (alreadyLinked && alreadyLinked.id !== tokenData.childId) {
        await storage.clearUserTelegramChatId(alreadyLinked.id);
      }
      await storage.updateUserTelegramChatId(tokenData.childId, chatId);
      const childUser = await storage.getUser(tokenData.childId);
      const parent = await storage.getLinkedParent(tokenData.childId);
      const parentName = parent?.name || "вашего родителя";
      await ctx.answerCallbackQuery({ text: "Подключено!" });
      await ctx.editMessageText(
        `Telegram подключён, ${childUser?.name || ""}! 🎉\n\n` +
        `Уведомления о ${parentName}:\n` +
        `• Вечерняя сводка (21:00)\n` +
        `• Давление вне нормы\n` +
        `• Алерты безопасности\n` +
        `• Новые мемуары\n\n` +
        `Отправьте родителю ссылку на @vnuchok1_bot — AI-помощник для общения, рецептов, погоды и мемуаров.`
      );
      console.log(`[child-bot] Child ${tokenData.childId} linked via confirmation button, chat ${chatId}`);
    } catch (err: any) {
      console.error(`[child-bot] Link error:`, err.message);
      await ctx.answerCallbackQuery({ text: "Ошибка привязки. Попробуйте снова." });
    }
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
      try {
        const existingUser = await storage.getUserByTelegramChatId(chatId);
        if (existingUser && existingUser.id !== tokenData.childId) {
          await storage.clearUserTelegramChatId(existingUser.id);
          console.log(`[child-bot] Cleared telegram_chat_id from user ${existingUser.id} (${existingUser.role}) to reassign to child ${tokenData.childId}`);
        }
        await storage.updateUserTelegramChatId(tokenData.childId, chatId);
        const childUser = await storage.getUser(tokenData.childId);
        const parent = await storage.getLinkedParent(tokenData.childId);
        const parentName = parent?.name || "вашего родителя";
        await ctx.reply(
          `Telegram подключён, ${childUser?.name || ""}! 🎉\n\n` +
          `Теперь вы будете получать уведомления о ${parentName}:\n` +
          `• Вечерняя сводка — каждый день в 21:00\n` +
          `• Оповещения о давлении — если показатели выходят за норму\n` +
          `• Алерты безопасности — мошенники, опасность\n` +
          `• Новые мемуары — когда родитель делится воспоминаниями\n\n` +
          `Что дальше?\n` +
          `Отправьте родителю ссылку на бот @vnuchok1_bot — это AI-помощник Внучок. Там родитель может общаться, искать рецепты, узнавать погоду, записывать мемуары и многое другое.\n\n` +
          `Управлять напоминаниями и видеть активность родителя можно в личном кабинете на сайте.`
        );
        console.log(`[child-bot] Child ${tokenData.childId} linked via text code, chat ${chatId}`);
      } catch (err: any) {
        console.error(`[child-bot] Link error:`, err.message);
        await ctx.reply("Ошибка привязки. Попробуйте сгенерировать новый код.");
      }
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

    await childBot.init();
    console.log("[child-bot] Bot initialized, starting manual polling loop...");
    let offset = 0;
    const pollLoop = async () => {
      while (true) {
        try {
          const url = `https://api.telegram.org/bot${token}/getUpdates?timeout=30&offset=${offset}&allowed_updates=${encodeURIComponent(JSON.stringify(["message","callback_query"]))}`;
          const resp = await fetch(url);
          const data = await resp.json() as any;
          if (data.ok && data.result && data.result.length > 0) {
            console.log(`[child-bot] RAW POLL: got ${data.result.length} updates`);
            for (const upd of data.result) {
              console.log(`[child-bot] RAW UPDATE: ${JSON.stringify(upd).substring(0, 500)}`);
              offset = upd.update_id + 1;
              try {
                await childBot!.handleUpdate(upd);
              } catch (e: any) {
                console.error(`[child-bot] handleUpdate error:`, e.message);
              }
            }
          }
        } catch (e: any) {
          console.error(`[child-bot] Poll error: ${e.message}`);
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    };
    pollLoop();
    console.log("[child-bot] Child notification bot started successfully (manual polling)");
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
