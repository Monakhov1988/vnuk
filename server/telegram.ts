import { Bot, InlineKeyboard, Keyboard, InputFile } from "grammy";
import crypto from "crypto";
import { storage } from "./storage";
import { chatWithGrandchild, recognizeMeter } from "./ai";
import { speechToText, textToSpeech } from "./voice";
import bcrypt from "bcrypt";

let bot: Bot | null = null;
const pendingRegistration = new Map<string, boolean>();
const pendingLink = new Map<string, boolean>();

function startTypingLoop(ctx: any, action: "typing" | "record_voice" = "typing") {
  let running = true;
  const loop = async () => {
    while (running) {
      try {
        await ctx.replyWithChatAction(action);
      } catch {}
      await new Promise(r => setTimeout(r, 4000));
    }
  };
  loop();
  return () => { running = false; };
}

const TOOL_STATUS_MESSAGES: Record<string, string> = {
  search_web: "Сейчас, ищу информацию... 🔍",
  search_recipe: "Минуточку, ищу рецепт... 🍳",
  generate_image: "Рисую, подожди немножко... 🎨",
  get_weather: "Смотрю погоду... ☀️",
};

const persistentKeyboard = new Keyboard()
  .text("🌤 Погода").text("🍳 Рецепт").row()
  .text("🧩 Загадка").text("❓ Помощь")
  .resized()
  .persistent();

function getHintsKeyboard() {
  return new InlineKeyboard()
    .text("🌤 Погода", "hint_weather").text("🍳 Рецепт", "hint_recipe").row()
    .text("📺 Что по ТВ", "hint_tv").text("🎬 Что в кино", "hint_cinema").row()
    .text("💊 Лекарства", "hint_pills").text("📋 Давление", "hint_bp").row()
    .text("🧩 Загадка", "hint_riddle").text("📖 Стихотворение", "hint_poem").row()
    .text("🎨 Открытка", "hint_card").text("🙏 Молитва", "hint_prayer").row()
    .text("📸 Фото счётчика", "hint_meter").text("🌱 Огород", "hint_garden").row()
    .text("❓ Что ты ещё умеешь?", "hint_help");
}

const HINT_QUESTIONS: Record<string, string> = {
  hint_weather: "🌤 Какой город интересует? Напишите название, например: Москва, Сочи, Казань",
  hint_recipe: "🍳 Что хотите приготовить? Напишите блюдо, например: борщ, шарлотка, блины",
  hint_tv: "📺 Какой канал интересует? Напишите, например: Первый канал, Россия 1, НТВ.\nИли просто напишите «что по ТВ» — покажу общую программу",
  hint_cinema: "🎬 Хотите узнать что сейчас в кино? Просто напишите «что в кино» или назовите город",
  hint_riddle: "🧩 Какую загадку хотите? Напишите: лёгкую, сложную, для детей, про природу — или просто «загадку»",
  hint_poem: "📖 Какое стихотворение прочитать? Напишите автора или тему, например: Пушкин, про осень, про любовь",
  hint_card: "🎨 Какую открытку нарисовать? Напишите повод и для кого, например: с днём рождения маме, с 8 марта, просто красивую с цветами",
  hint_prayer: "🙏 Какую молитву прочитать? Напишите, например: Отче наш, Богородице Дево, утреннюю молитву",
  hint_garden: "🌱 Что вас интересует в огороде? Напишите, например: что сажать сейчас, лунный календарь, борьба с вредителями",
};

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
    `Я умею многое: могу рассказать погоду, найти рецепт, нарисовать открытку, ` +
    `подсказать что в кино, помочь с телефоном и просто поговорить по душам.\n\n` +
    `Нажмите кнопку внизу или напишите что угодно!`
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
        `С возвращением, ${existing.name}!\n\n` +
        `Просто напишите мне — я всегда рад поболтать.\n` +
        `Или нажмите кнопку внизу:`,
        { reply_markup: persistentKeyboard }
      );
      await ctx.reply(
        `А вот ещё что я умею — нажмите любую кнопку:`,
        { reply_markup: getHintsKeyboard() }
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

  bot.command("help", async (ctx) => {
    const helpText =
`Вот что я умею! Просто напишите мне:

💬 ПОБОЛТАТЬ
«Как дела?», «Расскажи что-нибудь интересное», «Мне скучно»

🍳 РЕЦЕПТЫ
«Как приготовить борщ?», «Рецепт шарлотки», «Что приготовить на ужин?»

🌤 ПОГОДА
«Какая сегодня погода?», «Будет ли дождь?», «Какая погода в Сочи?»

🔍 НОВОСТИ И АФИША
«Что в кино?», «Какой сегодня праздник?», «Что нового?»

📺 ТЕЛЕВИЗОР
«Что сегодня по ТВ?», «Что по Первому каналу?»

💊 ЗДОРОВЬЕ
«Напомни выпить таблетки», «Какую зарядку сделать?»
/pills — мои лекарства
/bp 120 80 — записать давление

🏠 БЫТ И ЖКХ
«Как вывести пятно?», «Когда передавать показания?»
Отправьте фото счётчика — передам показания!

🌱 ОГОРОД И ДАЧА
«Что сажать в марте?», «Лунный календарь», «Как бороться с тлёй?»

🎨 ОТКРЫТКИ И КАРТИНКИ
«Нарисуй открытку на день рождения», «Нарисуй котика»

📖 КНИГИ И СТИХИ
«Почитай стихотворение», «Что почитать?», «Расскажи про Чехова»

✈️ ГОРОДА И ПУТЕШЕСТВИЯ
«Расскажи про Суздаль», «Что посмотреть в Казани?»

🙏 МОЛИТВЫ
«Прочитай Отче наш», «Какой сегодня пост?»

📝 ПОЗДРАВЛЕНИЯ
«Напиши поздравление маме на юбилей», «Поздравь с Новым годом»

🚕 ДОСТАВКА И ТАКСИ
«Как заказать такси?», «Как заказать продукты домой?»

📱 ПОМОЩЬ С ТЕЛЕФОНОМ
«Как отправить фото?», «Как позвонить по видео?»

🧶 РУКОДЕЛИЕ
«Как связать носки?», «Как зашить дырку?»

🌿 ТРАВЫ И НАРОДНЫЕ СРЕДСТВА
«Чай с ромашкой от чего помогает?», «Как заваривать шиповник?»

📜 ИСТОРИЯ ДНЯ
«Что было в этот день в истории?»

🧩 ЗАГАДКИ И ИГРЫ
«Загадай загадку», «Давай викторину», «Расскажи интересный факт»

📸 ВОСПОМИНАНИЯ
Расскажите мне историю из вашей жизни — я запомню!

🎙 ГОЛОСОВЫЕ СООБЩЕНИЯ
Можете просто наговорить голосом — я пойму и отвечу!

Просто напишите или наговорите — я всегда рад помочь! 😊`;

    await ctx.reply(helpText);
    await ctx.reply("Нажмите кнопку — попробуйте прямо сейчас:", { reply_markup: getHintsKeyboard() });
  });

  bot.callbackQuery("action_register", async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const existing = await storage.getUserByTelegramChatId(chatId);
    if (existing) {
      try { await ctx.answerCallbackQuery({ text: "Вы уже зарегистрированы!" }); } catch {}
      return;
    }
    pendingRegistration.set(chatId, true);
    try { await ctx.answerCallbackQuery(); } catch {}
    await ctx.reply(`Напишите ваше имя (например: Мария Ивановна):`);
  });

  bot.callbackQuery("action_link", async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const existing = await storage.getUserByTelegramChatId(chatId);
    if (existing) {
      try { await ctx.answerCallbackQuery({ text: "Вы уже привязаны!" }); } catch {}
      return;
    }
    pendingLink.set(chatId, true);
    try { await ctx.answerCallbackQuery(); } catch {}
    await ctx.reply(`Введите ваш код привязки (например: A1B2C3):`);
  });

  bot.callbackQuery("hint_help", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}
    const helpText =
`Вот что я умею! Просто напишите мне:

💬 Поболтать — «Как дела?», «Мне скучно»
🍳 Рецепты — «Как приготовить борщ?»
🌤 Погода — «Какая погода?»
🔍 Новости — «Что в кино?», «Какой праздник?»
📺 ТВ — «Что по телевизору?»
💊 Здоровье — /pills, /bp
🏠 ЖКХ — фото счётчика
🌱 Огород — «Что сажать?»
🎨 Открытки — «Нарисуй открытку»
📖 Стихи и книги — «Почитай стихотворение»
✈️ Путешествия — «Расскажи про Суздаль»
🙏 Молитвы — «Прочитай Отче наш»
📝 Поздравления — «Напиши поздравление»
🚕 Такси — «Как вызвать такси?»
📱 Техника — «Как отправить фото?»
🧶 Рукоделие — «Как связать носки?»
🌿 Травы — «Чай с ромашкой от чего?»
🧩 Загадки — «Загадай загадку»
📸 Воспоминания — расскажите историю
🎙 Голосовые — просто наговорите!`;
    await ctx.reply(helpText, { reply_markup: getHintsKeyboard() });
  });

  bot.callbackQuery("hint_pills", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) { await ctx.reply("Сначала зарегистрируйтесь — /start"); return; }
    const reminders = await storage.getRemindersByUserId(user.id);
    if (reminders.length === 0) {
      await ctx.reply("У вас пока нет лекарств в списке. Попросите ребёнка добавить их в личном кабинете.");
      return;
    }
    let text = "💊 Ваши лекарства:\n\n";
    for (const r of reminders) {
      text += `• ${r.medicineName} — ${r.time}\n`;
    }
    await ctx.reply(text);
  });

  bot.callbackQuery("hint_bp", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}
    await ctx.reply("Чтобы записать давление, напишите:\n/bp 120 80\n\nГде 120 — верхнее, 80 — нижнее.\nМожно добавить заметку: /bp 130 85 после прогулки");
  });

  bot.callbackQuery("hint_meter", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}
    await ctx.reply("Сфотографируйте счётчик и отправьте мне фото — я распознаю показания и помогу сохранить!");
  });

  bot.callbackQuery(/^hint_/, async (ctx) => {
    const action = ctx.callbackQuery.data;
    const question = HINT_QUESTIONS[action];
    if (!question) {
      try { await ctx.answerCallbackQuery(); } catch {}
      return;
    }
    try { await ctx.answerCallbackQuery(); } catch {}
    await ctx.reply(question);
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
      await ctx.reply(reply, { reply_markup: persistentKeyboard });
      await ctx.reply("Нажмите любую кнопку — попробуйте прямо сейчас:", { reply_markup: getHintsKeyboard() });
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
        try { await ctx.answerCallbackQuery({ text: "Напоминание не найдено" }); } catch {}
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

      try { await ctx.answerCallbackQuery({ text: "Отлично! Записано." }); } catch {}
      const msgText = ctx.callbackQuery.message?.text || "Лекарства";
      await ctx.editMessageText(msgText + `\n\n${reminder.medicineName} — принято!`);
    } catch (err) {
      console.error("[telegram] confirm_med error:", err);
      try { await ctx.answerCallbackQuery({ text: "Ошибка, попробуйте снова" }); } catch {}
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

      try { await ctx.answerCallbackQuery({ text: "Сохранено!" }); } catch {}
      await ctx.editMessageText(`Показания ${meterType}: ${value} — сохранено!`);
    } catch (err) {
      console.error("[telegram] save_meter error:", err);
      try { await ctx.answerCallbackQuery({ text: "Ошибка, попробуйте снова" }); } catch {}
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

  bot.on("message:voice", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) {
      await ctx.reply("Сначала зарегистрируйтесь — нажмите /start");
      return;
    }

    try {
      await ctx.replyWithChatAction("typing");

      const voice = ctx.message.voice;
      if (voice.duration > 120) {
        await ctx.reply("Голосовое сообщение слишком длинное. Попробуйте записать покороче — до 2 минут.");
        return;
      }
      const file = await ctx.api.getFile(voice.file_id);
      if (!file.file_path) {
        await ctx.reply("Не удалось загрузить голосовое сообщение. Попробуйте ещё раз.");
        return;
      }
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      const response = await fetch(fileUrl);
      if (!response.ok) {
        await ctx.reply("Не удалось загрузить голосовое сообщение. Попробуйте ещё раз.");
        return;
      }
      const audioBuffer = Buffer.from(await response.arrayBuffer());

      const userText = await speechToText(audioBuffer);
      if (!userText || userText.length < 1) {
        await ctx.reply("Не удалось разобрать, что вы сказали. Попробуйте ещё раз, говорите чётко.");
        return;
      }

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

      const stopTyping = startTypingLoop(ctx, "record_voice");

      let result;
      try {
        result = await chatWithGrandchild(messages, user.name, user.id);
      } finally {
        stopTyping();
      }

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
          : result.intent === "home_danger"
          ? "Опасная ситуация дома!"
          : result.intent === "lost"
          ? "Родитель потерялся на улице!"
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
                `⚠️ ${alertTitle}\n\n${user.name} сказал(а): "${userText}"\n\nПроверьте ситуацию!`
              );
            } catch (err) {
              console.error("[telegram] Failed to notify child:", err);
            }
          }
        }
      }

      if (result.imageUrl) {
        try {
          if (result.reply.length > 1024) {
            await ctx.reply(result.reply);
            await ctx.replyWithPhoto(result.imageUrl);
          } else {
            await ctx.replyWithPhoto(result.imageUrl, {
              caption: result.reply,
            });
          }
        } catch (imgErr) {
          console.error("[telegram] Failed to send image:", imgErr);
          await ctx.reply(result.reply);
        }
      }

      try {
        const voiceBuffer = await textToSpeech(result.reply);
        await ctx.replyWithVoice(new InputFile(voiceBuffer, "response.ogg"));
      } catch (ttsErr) {
        console.error("[telegram] TTS failed, sending text:", ttsErr);
        if (!result.imageUrl) {
          await ctx.reply(result.reply);
        }
      }
    } catch (err: any) {
      console.error("[telegram] Voice message error:", err);
      await ctx.reply("Ой, не получилось обработать голосовое сообщение. Попробуйте ещё раз или напишите текстом.");
    }
  });

  bot.on("message:text", async (ctx) => {
    let userText = ctx.message.text;
    if (userText.startsWith("/")) return;

    const KEYBOARD_QUESTIONS: Record<string, string> = {
      "🌤 Погода": "🌤 Какой город интересует? Напишите название, например: Москва, Сочи, Казань",
      "🍳 Рецепт": "🍳 Что хотите приготовить? Напишите блюдо, например: борщ, шарлотка, блины",
      "🧩 Загадка": "🧩 Какую загадку хотите? Напишите: лёгкую, сложную, для детей, про природу — или просто «загадку»",
      "❓ Помощь": "__help__",
    };
    if (KEYBOARD_QUESTIONS[userText]) {
      if (KEYBOARD_QUESTIONS[userText] === "__help__") {
        const chatId = ctx.chat.id.toString();
        const user = await storage.getUserByTelegramChatId(chatId);
        if (!user) {
          await ctx.reply("Сначала зарегистрируйтесь — /start");
          return;
        }
        await ctx.reply("Вот что я умею — нажмите любую кнопку:", { reply_markup: getHintsKeyboard() });
        return;
      }
      await ctx.reply(KEYBOARD_QUESTIONS[userText]);
      return;
    }

    const RECIPE_CLARIFICATIONS: Record<string, string> = {
      "борщ": "А какой борщ хочешь? Классический, украинский, с курицей или вегетарианский? 🍲",
      "суп": "А какой суп? Куриный, грибной, гороховый, щи, харчо? 🍲",
      "пирог": "А какой пирог? С яблоками, с мясом, с ягодами, с капустой, с творогом? 🥧",
      "салат": "А какой салат? Оливье, цезарь, винегрет, овощной, с курицей? 🥗",
      "каша": "А какая каша? Овсяная, гречневая, рисовая, манная, пшённая? 🥣",
      "блины": "А какие блины? Тонкие на молоке, дрожжевые, с начинкой, на кефире? 🥞",
      "пельмени": "А какие пельмени? Классические с мясом, с курицей, домашние, ленивые? 🥟",
      "вареники": "А какие вареники? С картошкой, с вишней, с творогом, ленивые? 🥟",
      "котлеты": "А какие котлеты? Из фарша классические, куриные, рыбные, по-киевски? 🍖",
      "запеканка": "А какая запеканка? Творожная, картофельная, с мясом, макаронная? 🍽",
      "пирожки": "А какие пирожки? С мясом, с капустой, с картошкой, с яблоками? 🥧",
      "торт": "А какой торт? Наполеон, медовик, шоколадный, бисквитный, птичье молоко? 🎂",
      "печенье": "А какое печенье? Овсяное, песочное, шоколадное, с изюмом? 🍪",
      "оладьи": "А какие оладьи? На кефире, с яблоками, банановые, пышные? 🥞",
      "плов": "А какой плов? Узбекский классический, с курицей, со свининой, овощной? 🍚",
    };

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
        await ctx.reply(reply, { reply_markup: persistentKeyboard });
        await ctx.reply("Нажмите любую кнопку — попробуйте прямо сейчас:", { reply_markup: getHintsKeyboard() });
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

    const lowerText = userText.toLowerCase().trim().replace(/[?.!,]$/g, "");
    const dishBase = lowerText.replace(/^рецепт\s+/, "").trim();
    const DISH_FORMS: Record<string, string> = {
      "борща": "борщ", "борщу": "борщ", "борщом": "борщ",
      "супа": "суп", "супу": "суп", "супом": "суп", "супчик": "суп", "супчика": "суп",
      "пирога": "пирог", "пирогу": "пирог", "пирогом": "пирог",
      "салата": "салат", "салату": "салат", "салатик": "салат", "салатика": "салат",
      "каши": "каша", "кашу": "каша", "кашей": "каша", "кашку": "каша",
      "блинов": "блины", "блинчики": "блины", "блинчиков": "блины",
      "пельменей": "пельмени", "пельмешки": "пельмени", "пельмешек": "пельмени",
      "вареников": "вареники", "варениками": "вареники",
      "котлет": "котлеты", "котлетки": "котлеты", "котлеток": "котлеты",
      "запеканки": "запеканка", "запеканку": "запеканка",
      "пирожков": "пирожки", "пирожками": "пирожки",
      "торта": "торт", "тортик": "торт", "тортика": "торт",
      "печенья": "печенье", "печеньки": "печенье",
      "оладий": "оладьи", "оладушки": "оладьи", "оладушек": "оладьи",
      "плова": "плов", "пловом": "плов",
    };
    const normalizedDish = DISH_FORMS[dishBase] || dishBase;
    const clarification = RECIPE_CLARIFICATIONS[normalizedDish];

    if (clarification) {
      await storage.createChatMessage({
        parentId: user.id,
        role: "user",
        content: userText,
        intent: null,
        hasAlert: false,
      });
      await storage.createChatMessage({
        parentId: user.id,
        role: "assistant",
        content: clarification,
        intent: "recipe",
        hasAlert: false,
      });
      await ctx.reply(clarification);
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

      const stopTyping = startTypingLoop(ctx);
      let statusMsgId: number | null = null;

      const onToolCall = async (toolName: string) => {
        const statusText = TOOL_STATUS_MESSAGES[toolName];
        if (statusText && !statusMsgId) {
          try {
            const sent = await ctx.reply(statusText);
            statusMsgId = sent.message_id;
          } catch {}
        }
      };

      let result;
      try {
        result = await chatWithGrandchild(messages, user.name, user.id, onToolCall);
      } finally {
        stopTyping();
        if (statusMsgId) {
          try { await ctx.api.deleteMessage(ctx.chat.id, statusMsgId); } catch {}
        }
      }

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
          : result.intent === "home_danger"
          ? "Опасная ситуация дома!"
          : result.intent === "lost"
          ? "Родитель потерялся на улице!"
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
                `⚠️ ${alertTitle}\n\n${user.name} написал(а): "${userText}"\n\nПроверьте ситуацию!`
              );
            } catch (err) {
              console.error("[telegram] Failed to notify child:", err);
            }
          }
        }
      }

      if (result.imageUrl) {
        try {
          if (result.reply.length > 1024) {
            await ctx.reply(result.reply);
            await ctx.replyWithPhoto(result.imageUrl);
          } else {
            await ctx.replyWithPhoto(result.imageUrl, {
              caption: result.reply,
            });
          }
        } catch (imgErr) {
          console.error("[telegram] Failed to send image:", imgErr);
          await ctx.reply(result.reply);
        }
      } else {
        await ctx.reply(result.reply);
      }
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
