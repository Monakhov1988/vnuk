import { Bot, InlineKeyboard } from "grammy";
import crypto from "crypto";
import { storage } from "./storage";
import { chatWithGrandchild, recognizeMeter } from "./ai";
import bcrypt from "bcrypt";

let bot: Bot | null = null;
const pendingRegistration = new Map<string, boolean>();
const pendingLink = new Map<string, boolean>();

async function registerUserFromTelegram(chatId: string, name: string): Promise<string> {
  const email = `tg_${chatId}@vnuchok.bot`;
  const hashedPassword = await bcrypt.hash(crypto.randomUUID(), 10);

  const user = await storage.createUser({
    name,
    email,
    password: hashedPassword,
    role: "parent",
  });

  const linkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  await storage.updateUserLinkCode(user.id, linkCode);
  await storage.updateUserTelegramChatId(user.id, chatId);

  return (
    `Добро пожаловать, ${name}!\n\n` +
    `Ваш код привязки: ${linkCode}\n` +
    `Передайте этот код вашему ребёнку (родственнику), чтобы он мог видеть ваши данные в личном кабинете.\n\n` +
    `А теперь просто напишите мне — я всегда рад поболтать!\n\n` +
    `/pills — мои лекарства\n` +
    `/bp 120 80 — записать давление\n` +
    `Фото счётчика — передать показания`
  );
}

export function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("[telegram] TELEGRAM_BOT_TOKEN not set, skipping bot startup");
    return;
  }

  bot = new Bot(token);

  bot.command("start", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const existing = await storage.getUserByTelegramChatId(chatId);

    if (existing) {
      await ctx.reply(
        `С возвращением, ${existing.name}!\n\nПросто напишите мне — я всегда рад поболтать.\n\n` +
        `/pills — мои лекарства\n` +
        `/bp 120 80 — записать давление\n` +
        `Фото счётчика — передать показания`
      );
      return;
    }

    const keyboard = new InlineKeyboard()
      .text("Зарегистрироваться", "action_register").row()
      .text("У меня есть код привязки", "action_link");

    await ctx.reply(
      `Здравствуйте! Я — Внучок, ваш заботливый помощник.\n\n` +
      `Нажмите кнопку ниже, чтобы начать:`,
      { reply_markup: keyboard }
    );
  });

  bot.callbackQuery("action_register", async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const existing = await storage.getUserByTelegramChatId(chatId);
    if (existing) {
      await ctx.answerCallbackQuery({ text: "Вы уже зарегистрированы!" });
      return;
    }
    pendingRegistration.set(chatId, true);
    await ctx.answerCallbackQuery();
    await ctx.reply(`Напишите ваше имя (например: Мария Ивановна):`);
  });

  bot.callbackQuery("action_link", async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const existing = await storage.getUserByTelegramChatId(chatId);
    if (existing) {
      await ctx.answerCallbackQuery({ text: "Вы уже привязаны!" });
      return;
    }
    pendingLink.set(chatId, true);
    await ctx.answerCallbackQuery();
    await ctx.reply(`Введите ваш код привязки (например: A1B2C3):`);
  });

  bot.command("link", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const existing = await storage.getUserByTelegramChatId(chatId);
    if (existing) {
      await ctx.reply(`Вы уже привязаны как ${existing.name}. Просто напишите мне!`);
      return;
    }

    const code = ctx.match?.trim().toUpperCase();
    if (!code || code.length < 4) {
      await ctx.reply(`Введите код привязки после команды.\nНапример: /link A1B2C3`);
      return;
    }

    const parent = await storage.getUserByLinkCode(code);
    if (!parent) {
      await ctx.reply(`Код не найден. Проверьте и попробуйте снова.\nКод можно посмотреть в личном кабинете на сайте.`);
      return;
    }

    if (parent.telegramChatId) {
      await ctx.reply(`Этот аккаунт уже привязан к другому Telegram.`);
      return;
    }

    await storage.updateUserTelegramChatId(parent.id, chatId);
    await ctx.reply(
      `Отлично, ${parent.name}! Я теперь ваш Внучок в Telegram.\n\n` +
      `Просто напишите мне — поболтаем, помогу с чем нужно.\n\n` +
      `/pills — мои лекарства\n` +
      `/bp 120 80 — записать давление\n` +
      `Фото счётчика — передать показания`
    );
  });

  bot.command("register", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const existing = await storage.getUserByTelegramChatId(chatId);
    if (existing) {
      await ctx.reply(`Вы уже зарегистрированы как ${existing.name}. Просто напишите мне!`);
      return;
    }

    const name = ctx.match?.trim();
    if (!name || name.length < 2) {
      pendingRegistration.set(chatId, true);
      await ctx.reply(`Напишите ваше имя (например: Мария Ивановна):`);
      return;
    }

    try {
      const reply = await registerUserFromTelegram(chatId, name);
      await ctx.reply(reply);
    } catch (err: any) {
      console.error("[telegram] Registration error:", err);
      await ctx.reply(`Произошла ошибка при регистрации. Попробуйте позже.`);
    }
  });

  bot.command("pills", async (ctx) => {
    try {
      const chatId = ctx.chat.id.toString();
      const user = await storage.getUserByTelegramChatId(chatId);
      if (!user) {
        await ctx.reply(`Сначала привяжите аккаунт: /link ВАШ_КОД или /register Ваше Имя`);
        return;
      }

      const reminders = await storage.getRemindersByParent(user.id);
      if (reminders.length === 0) {
        await ctx.reply(`У вас пока нет напоминаний о лекарствах.\nПопросите родственника добавить их в личном кабинете.`);
        return;
      }

      const keyboard = new InlineKeyboard();
      let text = `Ваши лекарства на сегодня:\n\n`;

      for (const r of reminders) {
        const time = `${String(r.timeHour).padStart(2, "0")}:${String(r.timeMinute).padStart(2, "0")}`;
        const statusIcon = r.status === "confirmed" ? "  Принято" : "  Ожидание";
        text += `${time} — ${r.medicineName} ${statusIcon}\n`;

        if (r.status !== "confirmed") {
          keyboard.text(`Принял(а): ${r.medicineName}`, `confirm_med_${r.id}`).row();
        }
      }

      await ctx.reply(text, { reply_markup: reminders.some(r => r.status !== "confirmed") ? keyboard : undefined });
    } catch (err) {
      console.error("[telegram] /pills error:", err);
      await ctx.reply("Произошла ошибка. Попробуйте позже.");
    }
  });

  bot.callbackQuery(/^confirm_med_(\d+)$/, async (ctx) => {
    try {
      const chatId = ctx.chat?.id.toString();
      if (!chatId) return;

      const user = await storage.getUserByTelegramChatId(chatId);
      if (!user) return;

      const reminderId = parseInt(ctx.match[1]);
      const reminder = await storage.getReminder(reminderId);
      if (!reminder || reminder.parentId !== user.id) {
        await ctx.answerCallbackQuery({ text: "Напоминание не найдено" });
        return;
      }

      await storage.updateReminderStatus(reminderId, "confirmed");
      await storage.createEvent({
        userId: user.id,
        parentId: user.id,
        type: "medication",
        severity: "info",
        title: `${reminder.medicineName} — принято`,
        description: `Подтверждено через Telegram`,
      });

      await ctx.answerCallbackQuery({ text: "Отлично! Записано." });
      const msgText = ctx.callbackQuery.message?.text || "Лекарства";
      await ctx.editMessageText(msgText + `\n\n${reminder.medicineName} — принято!`);
    } catch (err) {
      console.error("[telegram] confirm_med error:", err);
      await ctx.answerCallbackQuery({ text: "Ошибка, попробуйте снова" });
    }
  });

  bot.command("bp", async (ctx) => {
    try {
      const chatId = ctx.chat.id.toString();
      const user = await storage.getUserByTelegramChatId(chatId);
      if (!user) {
        await ctx.reply(`Сначала привяжите аккаунт: /link ВАШ_КОД или /register Ваше Имя`);
        return;
      }

      const args = ctx.match?.trim().split(/\s+/) || [];
      const systolic = parseInt(args[0]);
      const diastolic = parseInt(args[1]);
      const note = args.slice(2).join(" ") || null;

      if (!systolic || !diastolic || systolic < 60 || systolic > 260 || diastolic < 30 || diastolic > 180) {
        await ctx.reply(
          `Укажите давление после команды.\n` +
          `Например: /bp 120 80\n` +
          `Или с заметкой: /bp 135 85 после прогулки`
        );
        return;
      }

      await storage.createHealthLog({ parentId: user.id, systolic, diastolic, note });
      await storage.createEvent({
        userId: user.id,
        parentId: user.id,
        type: "checkin",
        severity: "info",
        title: "Давление записано",
        description: `${systolic}/${diastolic}${note ? ` — ${note}` : ""} (Telegram)`,
      });

      let response = `Записано: ${systolic}/${diastolic}`;
      if (note) response += ` (${note})`;

      if (systolic >= 180 || diastolic >= 110) {
        response += `\n\nВнимание! Давление повышенное. Если чувствуете себя плохо — позвоните в скорую (103).`;
      } else if (systolic >= 140 || diastolic >= 90) {
        response += `\n\nДавление немного повышено. Отдохните, попейте водички.`;
      }

      await ctx.reply(response);
    } catch (err) {
      console.error("[telegram] /bp error:", err);
      await ctx.reply("Произошла ошибка. Попробуйте позже.");
    }
  });

  bot.on("message:photo", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) {
      await ctx.reply(`Сначала привяжите аккаунт: /link ВАШ_КОД или /register Ваше Имя`);
      return;
    }

    await ctx.reply("Распознаю показания счётчика...");

    try {
      const photos = ctx.message.photo;
      const biggestPhoto = photos[photos.length - 1];
      const file = await ctx.api.getFile(biggestPhoto.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

      const response = await fetch(fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const base64 = buffer.toString("base64");

      const result = await recognizeMeter(base64, user.id);

      if (result.value) {
        const keyboard = new InlineKeyboard()
          .text(`Сохранить ХВС: ${result.value}`, `save_meter_hvs_${result.value}`)
          .row()
          .text(`Сохранить ГВС: ${result.value}`, `save_meter_gvs_${result.value}`)
          .row()
          .text(`Сохранить Электричество: ${result.value}`, `save_meter_elec_${result.value}`);

        await ctx.reply(
          `Распознано значение: ${result.value}\n\nВыберите тип счётчика:`,
          { reply_markup: keyboard }
        );
      } else {
        await ctx.reply(`Не удалось распознать показания. Попробуйте сфотографировать ближе и чётче.\n\nИли введите вручную, например:\n/meter ХВС 12345`);
      }
    } catch (err: any) {
      console.error("[telegram] Photo recognition error:", err);
      await ctx.reply(`Произошла ошибка при распознавании. Попробуйте ещё раз.`);
    }
  });

  bot.callbackQuery(/^save_meter_(hvs|gvs|elec)_(.+)$/, async (ctx) => {
    try {
      const chatId = ctx.chat?.id.toString();
      if (!chatId) return;

      const user = await storage.getUserByTelegramChatId(chatId);
      if (!user) return;

      const typeMap: Record<string, string> = { hvs: "ХВС", gvs: "ГВС", elec: "Электричество" };
      const meterType = typeMap[ctx.match[1]] || "ХВС";
      const value = ctx.match[2];

      await storage.createUtilityMetric({ userId: user.id, parentId: user.id, meterType, value });
      await storage.createEvent({
        userId: user.id,
        parentId: user.id,
        type: "utility",
        severity: "info",
        title: `Показания ${meterType} переданы`,
        description: `Значение: ${value} (Telegram)`,
      });

      await ctx.answerCallbackQuery({ text: "Сохранено!" });
      await ctx.editMessageText(`Показания ${meterType}: ${value} — сохранено!`);
    } catch (err) {
      console.error("[telegram] save_meter error:", err);
      await ctx.answerCallbackQuery({ text: "Ошибка, попробуйте снова" });
    }
  });

  bot.command("meter", async (ctx) => {
    try {
      const chatId = ctx.chat.id.toString();
      const user = await storage.getUserByTelegramChatId(chatId);
      if (!user) {
        await ctx.reply(`Сначала привяжите аккаунт: /link ВАШ_КОД или /register Ваше Имя`);
        return;
      }

      const args = ctx.match?.trim().split(/\s+/) || [];
      if (args.length < 2) {
        await ctx.reply(`Укажите тип счётчика и значение.\nНапример: /meter ХВС 12345\n\nТипы: ХВС, ГВС, Электричество`);
        return;
      }

      const meterType = args[0];
      const value = args[1];

      if (!["ХВС", "ГВС", "Электричество"].includes(meterType)) {
        await ctx.reply(`Неизвестный тип счётчика: ${meterType}\n\nДоступные: ХВС, ГВС, Электричество`);
        return;
      }

      await storage.createUtilityMetric({ userId: user.id, parentId: user.id, meterType, value });
      await storage.createEvent({
        userId: user.id,
        parentId: user.id,
        type: "utility",
        severity: "info",
        title: `Показания ${meterType} переданы`,
        description: `Значение: ${value} (Telegram)`,
      });

      await ctx.reply(`Показания ${meterType}: ${value} — сохранено!`);
    } catch (err) {
      console.error("[telegram] /meter error:", err);
      await ctx.reply("Произошла ошибка. Попробуйте позже.");
    }
  });

  bot.on("message:text", async (ctx) => {
    const userText = ctx.message.text;
    if (userText.startsWith("/")) return;

    const chatId = ctx.chat.id.toString();

    if (pendingRegistration.has(chatId)) {
      pendingRegistration.delete(chatId);
      const name = userText.trim();
      if (!name || name.length < 2) {
        await ctx.reply(`Имя слишком короткое. Попробуйте ещё раз: /register`);
        return;
      }
      try {
        const reply = await registerUserFromTelegram(chatId, name);
        await ctx.reply(reply);
      } catch (err: any) {
        console.error("[telegram] Registration error:", err);
        await ctx.reply(`Произошла ошибка при регистрации. Попробуйте позже.`);
      }
      return;
    }

    if (pendingLink.has(chatId)) {
      pendingLink.delete(chatId);
      const code = userText.trim().toUpperCase();
      if (!code || code.length < 4) {
        await ctx.reply(`Код слишком короткий. Попробуйте ещё раз — нажмите /start`);
        return;
      }
      try {
        const parent = await storage.getUserByLinkCode(code);
        if (!parent) {
          await ctx.reply(`Код не найден. Проверьте и попробуйте снова — нажмите /start`);
          return;
        }
        if (parent.telegramChatId) {
          await ctx.reply(`Этот аккаунт уже привязан к другому Telegram.`);
          return;
        }
        await storage.updateUserTelegramChatId(parent.id, chatId);
        await ctx.reply(
          `Отлично, ${parent.name}! Я теперь ваш Внучок в Telegram.\n\n` +
          `Просто напишите мне — поболтаем, помогу с чем нужно.\n\n` +
          `/pills — мои лекарства\n` +
          `/bp 120 80 — записать давление\n` +
          `Фото счётчика — передать показания`
        );
      } catch (err: any) {
        console.error("[telegram] Link error:", err);
        await ctx.reply(`Произошла ошибка. Попробуйте позже.`);
      }
      return;
    }

    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) {
      const keyboard = new InlineKeyboard()
        .text("Зарегистрироваться", "action_register").row()
        .text("У меня есть код привязки", "action_link");

      await ctx.reply(
        `Здравствуйте! Я — Внучок.\n\n` +
        `Нажмите кнопку ниже, чтобы начать:`,
        { reply_markup: keyboard }
      );
      return;
    }

    try {
      const chatHistory = await storage.getChatMessages(user.id, 20);
      const messages: Array<{ role: "user" | "assistant"; content: string }> = chatHistory
        .reverse()
        .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

      messages.push({ role: "user", content: userText });

      await storage.createChatMessage({
        parentId: user.id,
        role: "user",
        content: userText,
        intent: null,
        hasAlert: false,
      });

      const result = await chatWithGrandchild(messages, user.name, user.id);

      await storage.createChatMessage({
        parentId: user.id,
        role: "assistant",
        content: result.reply,
        intent: result.intent,
        hasAlert: result.hasAlert,
      });

      if (result.hasAlert) {
        const alertTitle = result.intent === "scam"
          ? "Возможная попытка мошенничества!"
          : "Родитель сообщил о проблеме со здоровьем!";

        await storage.createEvent({
          userId: user.id,
          parentId: user.id,
          type: "alert",
          severity: "critical",
          title: alertTitle,
          description: userText,
        });

        const children = await storage.getChildrenByParentId(user.id);
        for (const child of children) {
          if (child.telegramChatId) {
            try {
              await bot!.api.sendMessage(
                child.telegramChatId,
                `Внимание! ${alertTitle}\n\n${user.name} написал(а): "${userText}"\n\nПроверьте ситуацию.`
              );
            } catch (err) {
              console.error("[telegram] Failed to notify child:", err);
            }
          }
        }
      }

      await ctx.reply(result.reply);
    } catch (err: any) {
      console.error("[telegram] Chat error:", err);
      await ctx.reply("Ой, что-то я задумался. Напишите ещё раз через минутку.");
    }
  });

  bot.catch((err) => {
    console.error("[telegram] Bot error:", err);
  });

  bot.start({
    onStart: () => {
      console.log("[telegram] Bot started successfully");
    },
  });

  return bot;
}

export function stopTelegramBot() {
  if (bot) {
    bot.stop();
    console.log("[telegram] Bot stopped");
  }
}
