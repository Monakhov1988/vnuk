import { Bot, InlineKeyboard, Keyboard, InputFile } from "grammy";
import crypto from "crypto";
import { storage } from "./storage";
import { chatWithGrandchild, recognizeMeter, detectIntentLocal } from "./ai";
import { speechToText, textToSpeech } from "./voice";
import { extractDishFromText, RECIPE_CLARIFICATIONS } from "./recipeUtils";
import { TOPIC_CATEGORIES, TOPIC_CATALOG } from "./topicCatalog";
import bcrypt from "bcrypt";

function getPhotoSource(result: { imageUrl?: string; imageBuffer?: Buffer }): string | InputFile | null {
  if (result.imageBuffer) return new InputFile(result.imageBuffer, "card.jpg");
  if (result.imageUrl) return result.imageUrl;
  return null;
}

function detectPersonalitySettingsIntent(text: string): { changes: Record<string, any>; confirmation: string } | null {
  const lower = text.toLowerCase().trim();
  if (lower.length > 40) return null;

  const patterns: Array<{ test: RegExp[]; changes: Record<string, any>; confirmation: string }> = [
    { test: [/^на\s*«?вы»?$/, /обращайс[яь]\s.*на\s*вы/, /говори\s.*на\s*вы/, /перейди\s.*на\s*вы/], changes: { formality: "вы" }, confirmation: "Хорошо, теперь буду обращаться к вам на «вы» 🙂" },
    { test: [/^на\s*«?ты»?$/, /обращайс[яь]\s.*на\s*ты/, /говори\s.*на\s*ты/, /перейди\s.*на\s*ты/, /давай\s+на\s*ты/], changes: { formality: "ты" }, confirmation: "Отлично, переходим на «ты»! 😊" },
    { test: [/побольше\s+шуток/, /больше\s+юмор/, /шути\s+чаще/, /добавь\s+юмор/, /будь\s+смешнее/], changes: { humor: 5 }, confirmation: "Понял, буду шутить побольше! 😄" },
    { test: [/поменьше\s+шуток/, /меньше\s+юмор/, /не\s+шути/, /без\s+шуток/, /будь\s+серь[её]зн/], changes: { humor: 1 }, confirmation: "Хорошо, буду посерьёзнее 🙂" },
    { test: [/^помягче$/, /будь\s+мягче/, /^нежнее$/, /^ласковее$/, /будь\s+деликатн/], changes: { softness: 5 }, confirmation: "Хорошо, буду помягче и деликатнее 🤗" },
    { test: [/говори\s+прямо/, /будь\s+прям/, /без\s+сентимент/], changes: { softness: 1 }, confirmation: "Понял, буду говорить прямо и по делу 👍" },
    { test: [/говори\s+короче/, /^покороче$/, /будь\s+кратк/, /^лаконичн/, /не\s+болтай/, /отвечай\s+кратко/, /пиши\s+короче/], changes: { verbosity: 1 }, confirmation: "Буду краток! 👌" },
    { test: [/говори\s+подробн/, /отвечай\s+подробн/, /пиши\s+подробн/, /будь\s+подробн/, /^поподробн/, /объясняй\s+больше/, /болтай\s+больше/, /будь\s+разговорчив/], changes: { verbosity: 5 }, confirmation: "Хорошо, буду рассказывать подробнее! 📖" },
    { test: [/без\s+эмодзи/, /без\s+смайл/, /убери\s+эмодзи/, /убери\s+смайл/], changes: { useEmoji: false }, confirmation: "Хорошо, убираю эмодзи." },
    { test: [/добавь\s+эмодзи/, /добавь\s+смайл/, /побольше\s+смайл/, /побольше\s+эмодзи/, /используй\s+эмодзи/], changes: { useEmoji: true }, confirmation: "Ок, буду использовать эмодзи! 😊🎉" },
    { test: [/хвали\s+чаще/, /побольше\s+похвал/, /подбадривай/, /хвали\s+больше/], changes: { encouragement: 5 }, confirmation: "Буду хвалить и подбадривать чаще! 🌟" },
    { test: [/не\s+хвали/, /меньше\s+похвал/, /без\s+похвал/], changes: { encouragement: 1 }, confirmation: "Хорошо, буду скромнее с похвалой 🙂" },
  ];
  for (const p of patterns) {
    for (const re of p.test) {
      if (re.test(lower)) {
        return { changes: p.changes, confirmation: p.confirmation };
      }
    }
  }
  return null;
}

function isEmergencyMessage(text: string): boolean {
  const intent = detectIntentLocal(text, false);
  return ["home_danger", "lost", "emergency", "scam", "financial_risk"].includes(intent);
}

const DAILY_MESSAGE_LIMITS: Record<string, number> = {
  none: 10,
  basic: 30,
  standard: 100,
  premium: 500,
};

const RATE_LIMIT_MESSAGE = "Мы сегодня хорошо поговорили! 😊 Завтра утром я снова буду рядом. А если что-то срочное — звоните 112.";

async function getEffectivePlan(userId: number): Promise<string> {
  const checkSub = async (uid: number): Promise<string | null> => {
    const sub = await storage.getSubscription(uid);
    if (!sub || sub.status !== "active") return null;
    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) return null;
    return sub.plan;
  };

  const directPlan = await checkSub(userId);
  if (directPlan) return directPlan;

  const user = await storage.getUser(userId);
  if (!user) return "none";

  if (user.role === "child" && user.linkedParentId) {
    const parentPlan = await checkSub(user.linkedParentId);
    if (parentPlan) return parentPlan;
  }

  if (user.role === "parent") {
    const children = await storage.getChildrenByParentId(userId);
    for (const child of children) {
      const childPlan = await checkSub(child.id);
      if (childPlan) return childPlan;
    }
  }

  return "none";
}

async function checkTelegramDailyLimit(userId: number): Promise<boolean> {
  const plan = await getEffectivePlan(userId);
  const limit = DAILY_MESSAGE_LIMITS[plan] ?? DAILY_MESSAGE_LIMITS.none;
  if (limit === Infinity) return true;
  const todayCount = await storage.countChatMessagesToday(userId);
  return todayCount < limit;
}

const paywallNotifiedToday = new Map<string, string>();

const linkAttempts = new Map<string, { count: number; blockedUntil: number }>();
const LINK_MAX_ATTEMPTS = 5;
const LINK_BLOCK_MS = 5 * 60 * 1000;

function checkLinkRateLimit(chatId: string): boolean {
  const now = Date.now();
  const entry = linkAttempts.get(chatId);
  if (entry && entry.blockedUntil > now) return false;
  if (entry && entry.blockedUntil <= now && entry.count >= LINK_MAX_ATTEMPTS) {
    linkAttempts.delete(chatId);
  }
  return true;
}

function recordLinkFailure(chatId: string): void {
  const entry = linkAttempts.get(chatId) || { count: 0, blockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= LINK_MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + LINK_BLOCK_MS;
  }
  linkAttempts.set(chatId, entry);
}

function clearLinkAttempts(chatId: string): void {
  linkAttempts.delete(chatId);
}

const BURST_LIMIT = 3;
const BURST_WINDOW_MS = 15_000;
const BURST_CLEANUP_INTERVAL_MS = 60_000;
const BURST_LIMIT_MESSAGE = "Подожди немножко, я ещё думаю! 😊";
const burstTimestamps = new Map<string, number[]>();

let lastBurstCleanup = Date.now();

function checkBurstLimit(chatId: string): boolean {
  const now = Date.now();
  if (now - lastBurstCleanup > BURST_CLEANUP_INTERVAL_MS) {
    lastBurstCleanup = now;
    burstTimestamps.forEach((timestamps, key) => {
      const recent = timestamps.filter((t: number) => now - t < BURST_WINDOW_MS);
      if (recent.length === 0) {
        burstTimestamps.delete(key);
      } else {
        burstTimestamps.set(key, recent);
      }
    });
  }

  const timestamps = burstTimestamps.get(chatId) || [];
  const recent = timestamps.filter((t: number) => now - t < BURST_WINDOW_MS);

  if (recent.length >= BURST_LIMIT) {
    burstTimestamps.set(chatId, recent);
    return false;
  }

  recent.push(now);
  burstTimestamps.set(chatId, recent);
  return true;
}

async function maybeSendPaywallHint(userId: number, chatId: string, ctx: any): Promise<void> {
  try {
    const plan = await getEffectivePlan(userId);
    if (plan === "standard" || plan === "premium") return;

    const limit = DAILY_MESSAGE_LIMITS[plan] ?? DAILY_MESSAGE_LIMITS.none;
    if (limit === Infinity) return;

    const todayCount = await storage.countChatMessagesToday(userId);
    const threshold = Math.floor(limit * 0.8);
    if (todayCount < threshold) return;

    const today = new Date().toISOString().slice(0, 10);
    if (paywallNotifiedToday.get(chatId) === today) return;
    paywallNotifiedToday.set(chatId, today);

    await ctx.reply(
      `📊 Сегодня вы задали ${todayCount} из ${limit} вопросов.\n\n` +
      `Хотите безлимит + напоминания о лекарствах?\n` +
      `Расскажите сыну или дочке, что вам нравится Внучок — они смогут оформить подписку для вас.`
    );
  } catch {}
}

function parseBpInput(input: string): { systolic: number; diastolic: number; note: string | null } | null {
  if (!input) return null;

  const bpPattern = /^(\d{2,3})\s*[\/\-]\s*(\d{2,3})(.*)/;
  const bpSpacePattern = /^(\d{2,3})\s+(?:на\s+)?(\d{2,3})(.*)/i;

  let systolic: number | undefined;
  let diastolic: number | undefined;
  let rest = "";

  let match = input.match(bpPattern);
  if (match) {
    systolic = parseInt(match[1]);
    diastolic = parseInt(match[2]);
    rest = match[3];
  } else {
    match = input.match(bpSpacePattern);
    if (match) {
      systolic = parseInt(match[1]);
      diastolic = parseInt(match[2]);
      rest = match[3];
    }
  }

  if (!systolic || !diastolic) return null;
  if (systolic < 60 || systolic > 260 || diastolic < 30 || diastolic > 180) return null;

  const note = rest.trim() || null;
  return { systolic, diastolic, note };
}

export let bot: Bot | null = null;
const pendingRegistration = new Map<string, { timestamp: number }>();
const pendingLink = new Map<string, { timestamp: number }>();
const pendingVoiceConfirm = new Map<string, { transcript: string; timestamp: number }>();

interface OnboardingState {
  step: "city" | "age" | "interests";
  userId: number;
  name: string;
  city?: string;
  timestamp: number;
}
const onboardingState = new Map<string, OnboardingState>();

const PENDING_STATE_TTL = 5 * 60 * 1000;

function cleanupPendingStates() {
  const now = Date.now();
  Array.from(pendingRegistration.entries()).forEach(([chatId, state]) => {
    if (now - state.timestamp > PENDING_STATE_TTL) {
      pendingRegistration.delete(chatId);
    }
  });
  Array.from(pendingLink.entries()).forEach(([chatId, state]) => {
    if (now - state.timestamp > PENDING_STATE_TTL) {
      pendingLink.delete(chatId);
    }
  });
  Array.from(onboardingState.entries()).forEach(([chatId, state]) => {
    if (now - state.timestamp > PENDING_STATE_TTL) {
      onboardingState.delete(chatId);
    }
  });
  Array.from(pendingVoiceConfirm.entries()).forEach(([chatId, state]) => {
    if (now - state.timestamp > PENDING_STATE_TTL) {
      pendingVoiceConfirm.delete(chatId);
    }
  });
}

function setPendingRegistration(chatId: string) {
  cleanupPendingStates();
  pendingRegistration.set(chatId, { timestamp: Date.now() });
}

function setPendingLink(chatId: string) {
  cleanupPendingStates();
  pendingLink.set(chatId, { timestamp: Date.now() });
}

function isPendingRegistration(chatId: string): boolean {
  cleanupPendingStates();
  return pendingRegistration.has(chatId);
}

function isPendingLink(chatId: string): boolean {
  cleanupPendingStates();
  return pendingLink.has(chatId);
}

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
  search_legal: "Ищу юридическую информацию... ⚖️",
  search_travel: "Подбираю варианты... ✈️",
};

const persistentKeyboard = new Keyboard()
  .text("💊 Здоровье").text("🏠 Помощь").row()
  .text("🎭 Досуг").text("📋 Ещё").row()
  .resized()
  .persistent();

function getHealthKeyboard() {
  return new InlineKeyboard()
    .text("💊 Мои лекарства", "hint_pills").text("📋 Записать давление", "hint_bp").row()
    .text("🏥 Найти врача", "hint_doctor").text("💊 Про лекарство", "hint_medicine_info").row()
    .text("🏃 Зарядка", "hint_exercise").row()
    .text("❓ Что ты ещё умеешь?", "hint_help");
}

function getHelpKeyboard() {
  return new InlineKeyboard()
    .text("🌤 Погода", "hint_weather").text("🍳 Рецепт", "hint_recipe").row()
    .text("📸 Фото счётчика", "hint_meter").text("🌱 Огород", "hint_garden").row()
    .text("🚆 Транспорт", "hint_transport").text("🛒 Товары", "hint_product").row()
    .text("🔧 Как починить", "hint_repair").row()
    .text("❓ Что ты ещё умеешь?", "hint_help");
}

function getLeisureKeyboard() {
  return new InlineKeyboard()
    .text("📺 Что по ТВ", "hint_tv").text("🎬 Что в кино", "hint_cinema").row()
    .text("🧩 Загадка", "hint_riddle").text("📖 Стихотворение", "hint_poem").row()
    .text("🎨 Открытка", "hint_card").text("✈️ Путешествия", "hint_travel").row()
    .text("❓ Что ты ещё умеешь?", "hint_help");
}

function getMoreKeyboard() {
  return new InlineKeyboard()
    .text("⚖️ Льготы и пенсия", "hint_benefits").text("📜 Юридический вопрос", "hint_legal").row()
    .text("💊 Про лекарство", "hint_medicine_info").row()
    .text("⚙️ Настройки бота", "action_settings").text("❓ Помощь", "hint_help").row()
    .text("📩 Рассказать другу", "action_share").row();
}

const HINT_QUESTIONS: Record<string, string> = {
  hint_weather: "🌤 Какой город интересует? Напишите название, например: Москва, Сочи, Казань",
  hint_recipe: "🍳 Что хотите приготовить? Напишите блюдо, например: борщ, шарлотка, блины",
  hint_tv: "📺 Какой канал интересует? Напишите, например: Первый канал, Россия 1, НТВ.\nИли просто напишите «что по ТВ» — покажу общую программу",
  hint_cinema: "🎬 Хочешь узнать что идёт в кино? Напиши «что в кино» — покажу актуальные фильмы с рейтингами",
  hint_riddle: "🧩 Какую загадку хотите? Напишите: лёгкую, сложную, для детей, про природу — или просто «загадку»",
  hint_poem: "📖 Какое стихотворение прочитать? Напишите автора или тему, например: Пушкин, про осень, про любовь",
  hint_card: "🎨 Какую открытку нарисовать? Напишите повод и для кого, например: с днём рождения маме, с 8 марта, просто красивую с цветами",
  hint_doctor: "🏥 К какому врачу нужно записаться? Напишите специальность или жалобу, например: терапевт, болит спина, окулист",
  hint_repair: "🔧 Что сломалось? Напишите, например: течёт кран, скрипит дверь, не работает розетка",
  hint_garden: "🌱 Что вас интересует в огороде? Напишите, например: что сажать сейчас, лунный календарь, борьба с вредителями",
  hint_transport: "🚆 Куда нужно доехать? Напишите, например: электричка до Ревды, поезд Москва — Казань, автобус до Суздаля",
  hint_product: "🛒 Что ищете? Напишите, например: тонометр, увлажнитель воздуха, очки для чтения",
  hint_travel: "✈️ Куда хотите поехать? Напишите, например: санатории Краснодарского края, отдых на Алтае, экскурсии в Суздаль",
  hint_benefits: "⚖️ Что хотите узнать? Напишите, например: какие льготы у предпенсионеров, как увеличить пенсию, субсидия на ЖКХ",
  hint_legal: "📜 Какой юридический вопрос? Напишите, например: как оформить наследство, права при увольнении, как написать завещание",
  hint_medicine_info: "💊 О каком лекарстве хотите узнать? Напишите название, например: аторвастатин, лизиноприл, метформин",
  hint_exercise: "🏃 Какую зарядку хотите? Напишите, например: утренняя зарядка, зарядка для спины, для суставов, для шеи",
};

async function registerUserFromTelegram(chatId: string, name: string): Promise<{ message: string; userId: number }> {
  const email = `tg_${chatId}@vnuchok.bot`;
  const hashedPassword = await bcrypt.hash(crypto.randomUUID(), 10);

  const user = await storage.createUser({
    name,
    email,
    password: hashedPassword,
    role: "parent",
  });

  const linkCode = crypto.randomBytes(3).toString("hex").toUpperCase();
  await storage.updateUserLinkCode(user.id, linkCode);
  await storage.updateUserTelegramChatId(user.id, chatId);

  try {
    const { getAllTopicIds } = await import("./topicCatalog");
    await storage.bulkInitTopicSettings(user.id, getAllTopicIds(), "detailed");
  } catch (err: any) {
    console.error("[telegram] Failed to initialize default topics:", err?.message);
  }

  onboardingState.set(chatId, {
    step: "city",
    userId: user.id,
    name,
    timestamp: Date.now(),
  });

  return {
    message:
      `Добро пожаловать, ${name}! 😊\n\n` +
      `Ваш код привязки: ${linkCode}\n` +
      `Передайте этот код вашему ребёнку (родственнику), чтобы он мог видеть ваши данные в личном кабинете.\n\n` +
      `Давайте познакомимся поближе, чтобы я мог быть полезнее!\n\n` +
      `🏙 В каком городе вы живёте?`,
    userId: user.id,
  };
}

async function handleOnboardingStep(chatId: string, userText: string, ctx: any): Promise<boolean> {
  const state = onboardingState.get(chatId);
  if (!state) return false;

  if (state.step === "city") {
    const city = userText.trim();
    if (city.length < 2) {
      await ctx.reply("Название города слишком короткое. Напишите ещё раз, например: Москва, Казань, Сочи");
      return true;
    }

    await storage.createUserMemory({
      parentId: state.userId,
      category: "home",
      fact: `Живёт в городе: ${city}`,
      source: "onboarding",
    });

    onboardingState.set(chatId, {
      ...state,
      step: "age",
      city,
      timestamp: Date.now(),
    });

    const ageKeyboard = new InlineKeyboard()
      .text("55–60", "onb_age_55").text("60–70", "onb_age_60").text("Старше 70", "onb_age_70").row()
      .text("Пропустить", "onb_age_skip");

    await ctx.reply(
      `Отлично, ${city}! Буду подсказывать погоду и новости для вашего города. ☀️\n\n` +
      `Чтобы я лучше вас понимал — сколько вам лет?`,
      { reply_markup: ageKeyboard }
    );
    return true;
  }

  if (state.step === "age") {
    const text = userText.trim().toLowerCase();
    let ageLabel: string | null = null;
    const num = parseInt(text);
    if (!isNaN(num)) {
      if (num >= 55 && num <= 60) ageLabel = "55–60";
      else if (num > 60 && num <= 70) ageLabel = "60–70";
      else if (num > 70) ageLabel = "старше 70";
      else if (num < 55) ageLabel = "55–60";
    } else if (/пропуст|skip|не хочу|не скажу/i.test(text)) {
      ageLabel = null;
    } else {
      await ctx.reply("Нажмите кнопку с возрастом или напишите число (например: 63):");
      return true;
    }

    if (ageLabel) {
      await storage.createUserMemory({
        parentId: state.userId,
        category: "preferences",
        fact: `Возрастная группа: ${ageLabel}`,
        source: "onboarding",
      });
    }

    onboardingState.set(chatId, {
      ...state,
      step: "interests",
      timestamp: Date.now(),
    });

    await ctx.reply(
      `🎯 Расскажите, что вам интересно?\n\nНапример: готовка, огород, путешествия, стихи, здоровье, кино\n\nМожно написать несколько через запятую:`
    );
    return true;
  }

  if (state.step === "interests") {
    const interests = userText.trim();
    if (interests.length < 2) {
      await ctx.reply("Напишите хотя бы одно увлечение, например: готовка, огород, стихи, путешествия");
      return true;
    }

    await storage.createUserMemory({
      parentId: state.userId,
      category: "preferences",
      fact: `Интересы и увлечения: ${interests}`,
      source: "onboarding",
    });

    onboardingState.delete(chatId);

    await ctx.reply(
      `Отлично, я запомнил! 📝\n\n` +
      `Я готов помогать вам каждый день — от погоды до льгот и рецептов.\n` +
      `Просто напишите мне что угодно, или нажмите кнопку внизу.`,
      { reply_markup: persistentKeyboard }
    );

    let weatherInfo = "";
    if (state.city) {
      try {
        const { getWeather } = await import("./tools");
        const weather = await getWeather(state.city);
        if (weather && !weather.includes("не удалось") && !weather.includes("Не нашёл")) {
          weatherInfo = `\n🌤 Кстати, сейчас в ${state.city}:\n${weather.split("\n").slice(0, 2).join("\n")}`;
        }
      } catch {}
    }

    const tryKeyboard = new InlineKeyboard()
      .text("🍳 Найди рецепт", "hint_recipe").text("📖 Стихотворение", "hint_poem").row()
      .text("🧩 Загадай загадку", "hint_riddle").row();

    await ctx.reply(
      (weatherInfo ? weatherInfo + "\n\n" : "") +
      `Попробуйте — нажмите любую кнопку:`,
      { reply_markup: tryKeyboard }
    );

    await ctx.reply("🎤 Кстати, вы можете не печатать — просто нажмите микрофон и скажите голосом. Я всё пойму!");

    await ctx.reply(
      "📚 Я настроен отвечать подробно по всем темам — от рецептов до здоровья и льгот.\n\n" +
      "Если захотите изменить глубину ответов (кратко / подробно / экспертно) — нажмите 📋 Ещё → ⚙️ Настройки → 📚 Темы и экспертиза"
    );

    return true;
  }

  return false;
}

export async function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("[telegram] TELEGRAM_BOT_TOKEN not set, skipping bot startup");
    return;
  }

  bot = new Bot(token);

  const processedUpdateIds = new Set<number>();
  const MAX_PROCESSED_IDS = 500;

  bot.use(async (ctx, next) => {
    const updateId = ctx.update.update_id;
    if (processedUpdateIds.has(updateId)) {
      console.log(`[telegram] Duplicate update ${updateId} skipped`);
      return;
    }
    processedUpdateIds.add(updateId);
    if (processedUpdateIds.size > MAX_PROCESSED_IDS) {
      const oldest = processedUpdateIds.values().next().value;
      if (oldest !== undefined) processedUpdateIds.delete(oldest);
    }
    await next();
  });

  bot.command("start", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    console.log("[telegram] /start command received from chat:", chatId);
    const existing = await storage.getUserByTelegramChatId(chatId);
    console.log("[telegram] /start lookup result:", existing ? `found user id=${existing.id} name=${existing.name}` : "NOT FOUND");

    if (existing) {
      await ctx.reply(
        `С возвращением, ${existing.name}! Чем помочь сегодня?\n\n` +
        `Нажмите кнопку внизу или просто напишите мне:`,
        { reply_markup: persistentKeyboard }
      );
      return;
    }

    const keyboard = new InlineKeyboard()
      .text("👋 Давайте знакомиться!", "action_register").row()
      .text("🔗 Меня подключил(а) родственник(ца)", "action_link");

    await ctx.reply(
      `Здравствуйте! Меня зовут Внучок — я ваш помощник на каждый день.\n\n` +
      `Я могу:\n` +
      `🌤 Подсказать погоду\n` +
      `🍳 Найти рецепт любого блюда\n` +
      `💊 Напомнить про лекарства\n` +
      `🚆 Найти расписание электричек\n` +
      `⚖️ Рассказать про льготы и пенсию\n` +
      `📖 Почитать стихотворение\n` +
      `...и многое другое!\n\n` +
      `Можете писать мне или говорить голосом 🎤 — я всё пойму.\n\n` +
      `Нажмите кнопку ниже, чтобы начать:`,
      { reply_markup: keyboard }
    );
  });

  bot.command("help", async (ctx) => {
    console.log("[telegram] /help command received from chat:", ctx.chat.id);

    const helpKeyboard = new InlineKeyboard()
      .text("🌤 Погода", "hint_weather").text("🍳 Рецепт", "hint_recipe").row()
      .text("💊 Про лекарство", "hint_medicine_info").text("🚆 Электрички", "hint_transport").row()
      .text("⚖️ Льготы", "hint_benefits").text("🎨 Открытка", "hint_card").row();

    await ctx.reply(
      `Я умею многое! Вот самое полезное:\n\n` +
      `🌤 Погода и прогноз\n` +
      `🍳 Рецепты с пошаговой инструкцией\n` +
      `💊 Напоминания о лекарствах и информация о препаратах\n` +
      `🚆 Расписание электричек и поездов\n` +
      `⚖️ Льготы, пенсия, субсидии\n` +
      `📜 Юридические вопросы (наследство, права)\n` +
      `📺 Телепрограмма, кино, новости\n` +
      `🎨 Открытки, стихи, загадки\n` +
      `✈️ Путешествия и санатории\n` +
      `📸 Показания счётчиков по фото\n\n` +
      `Попробуйте — нажмите любую кнопку:`,
      { reply_markup: helpKeyboard }
    );
    await ctx.reply("А ещё можете просто написать или наговорить голосом 🎤 — любой вопрос!");
  });

  bot.callbackQuery("action_register", async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const existing = await storage.getUserByTelegramChatId(chatId);
    if (existing) {
      try { await ctx.answerCallbackQuery({ text: "Вы уже зарегистрированы!" }); } catch {}
      return;
    }
    setPendingRegistration(chatId);
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
    setPendingLink(chatId);
    try { await ctx.answerCallbackQuery(); } catch {}
    await ctx.reply(`Введите ваш код привязки (например: A1B2C3):`);
  });

  for (const ageCallback of ["onb_age_55", "onb_age_60", "onb_age_70", "onb_age_skip"]) {
    bot.callbackQuery(ageCallback, async (ctx) => {
      const chatId = ctx.chat?.id.toString();
      if (!chatId) return;
      try { await ctx.answerCallbackQuery(); } catch {}

      const state = onboardingState.get(chatId);
      if (!state || state.step !== "age") {
        await ctx.reply("Извините, потеряли контекст. Нажмите /start чтобы начать заново.");
        return;
      }

      if (ageCallback !== "onb_age_skip") {
        const ageLabel = ageCallback === "onb_age_55" ? "55–60" : ageCallback === "onb_age_60" ? "60–70" : "старше 70";
        await storage.createUserMemory({
          parentId: state.userId,
          category: "preferences",
          fact: `Возрастная группа: ${ageLabel}`,
          source: "onboarding",
        });
      }

      onboardingState.set(chatId, {
        ...state,
        step: "interests",
        timestamp: Date.now(),
      });

      await ctx.reply(
        `🎯 Расскажите, что вам интересно?\n\nНапример: готовка, огород, путешествия, стихи, здоровье, кино\n\nМожно написать несколько через запятую:`
      );
    });
  }

  bot.callbackQuery("action_settings", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}
    await showSettingsMenu(ctx);
  });

  bot.callbackQuery("action_share", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}
    try {
      const me = await bot!.api.getMe();
      const botLink = `t.me/${me.username}`;
      await ctx.reply(
        `📩 Перешлите это сообщение другу или подруге:\n\n` +
        `Привет! Попробуй Внучка — это бесплатный помощник в Telegram.\n` +
        `Погода, рецепты, лекарства, электрички, льготы, стихи — на каждый день.\n` +
        `Можно писать или говорить голосом 🎤\n\n` +
        `👉 ${botLink}`
      );
    } catch {
      await ctx.reply("Не удалось получить ссылку. Попробуйте позже.");
    }
  });

  bot.callbackQuery("hint_help", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}
    const helpKeyboard = new InlineKeyboard()
      .text("🌤 Погода", "hint_weather").text("🍳 Рецепт", "hint_recipe").row()
      .text("💊 Про лекарство", "hint_medicine_info").text("🚆 Электрички", "hint_transport").row()
      .text("⚖️ Льготы", "hint_benefits").text("🎨 Открытка", "hint_card").row();

    await ctx.reply(
      `Я умею многое! Вот самое полезное:\n\n` +
      `🌤 Погода  🍳 Рецепты  💊 Лекарства\n` +
      `🚆 Электрички  ⚖️ Льготы  📜 Юридическое\n` +
      `📺 ТВ  🎬 Кино  🎨 Открытки  📖 Стихи\n` +
      `✈️ Путешествия  🌱 Огород  🏥 Врачи\n` +
      `📸 Счётчики по фото  🎙 Голосовые\n\n` +
      `Попробуйте — нажмите кнопку:`,
      { reply_markup: helpKeyboard }
    );
  });

  bot.callbackQuery("hint_pills", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) { await ctx.reply("Сначала зарегистрируйтесь — /start"); return; }
    const reminders = await storage.getRemindersByParent(user.id);
    if (reminders.length === 0) {
      await ctx.reply("У вас пока нет лекарств в списке. Попросите ребёнка добавить их в личном кабинете.");
      return;
    }
    let text = "💊 Ваши лекарства:\n\n";
    for (const r of reminders) {
      const time = `${String(r.timeHour).padStart(2, '0')}:${String(r.timeMinute).padStart(2, '0')}`;
      text += `• ${r.medicineName} — ${time}\n`;
    }
    await ctx.reply(text);
  });

  bot.callbackQuery("hint_bp", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}
    await ctx.reply("Чтобы записать давление, напишите в любом формате:\n/bp 120/80\n/bp 120 80\n/давление 130 на 85\n/bp 135-85 после прогулки\n\nГде первое число — верхнее, второе — нижнее.");
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

    try {
      const chatId = ctx.chat?.id?.toString();
      const user = chatId ? await storage.getUserByTelegramChatId(chatId) : null;

      const autoProcessActions: Record<string, string> = {
        hint_tv: "что сейчас по ТВ",
        hint_riddle: "загадай загадку",
      };

      if (user && autoProcessActions[action]) {
        const syntheticMessage = autoProcessActions[action];

        const allowed = await checkTelegramDailyLimit(user.id);
        if (!allowed) {
          await ctx.reply(RATE_LIMIT_MESSAGE);
          return;
        }

        await storage.createChatMessage({
          parentId: user.id,
          role: "user",
          content: syntheticMessage,
          intent: null,
          hasAlert: false,
        });

        const chatHistory = await storage.getChatMessages(user.id, 20);
        const messages: Array<{ role: "user" | "assistant"; content: string }> = chatHistory
          .reverse()
          .filter(m => m.intent !== "voice_confirm")
          .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

        const stopTyping = startTypingLoop(ctx);
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

        let feedbackKeyboard: InlineKeyboard | undefined;
        if (result.searchLogIds && result.searchLogIds.length > 0) {
          const logId = result.searchLogIds[result.searchLogIds.length - 1];
          feedbackKeyboard = new InlineKeyboard()
            .text("👍 Полезно", `sqfb:positive:${logId}`)
            .text("👎 Неточно", `sqfb:negative:${logId}`);
        }

        const photoSrc = getPhotoSource(result);
        if (photoSrc) {
          try {
            await ctx.replyWithPhoto(photoSrc, { caption: result.reply.slice(0, 1024) });
          } catch {
            await ctx.reply(result.reply);
          }
        } else {
          await ctx.reply(result.reply, feedbackKeyboard ? { reply_markup: feedbackKeyboard } : undefined);
        }
        return;
      }

      await ctx.reply(question);

      if (user) {
        await storage.createChatMessage({
          parentId: user.id,
          role: "assistant",
          content: question,
          intent: null,
          hasAlert: false,
        });
      }
    } catch (err: any) {
      console.error("[telegram] Hint callback error:", err?.message || err);
      try {
        await ctx.reply("Произошла ошибка, попробуйте ещё раз через минутку.");
      } catch {}
    }
  });

  bot.command("link", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const existing = await storage.getUserByTelegramChatId(chatId);
    if (existing) {
      await ctx.reply(`Вы уже привязаны как ${existing.name}. Просто напишите мне!`);
      return;
    }

    if (!checkLinkRateLimit(chatId)) {
      await ctx.reply(`Слишком много попыток. Подождите 5 минут и попробуйте снова.`);
      return;
    }

    const code = ctx.match?.trim().toUpperCase();
    if (!code || code.length < 4) {
      await ctx.reply(`Введите код привязки после команды.\nНапример: /link A1B2C3`);
      return;
    }

    const parent = await storage.consumeLinkCode(code);
    if (!parent) {
      recordLinkFailure(chatId);
      await ctx.reply(`Код не найден или истёк. Проверьте и попробуйте снова.\nКод можно посмотреть в личном кабинете на сайте.`);
      return;
    }

    if (parent.telegramChatId) {
      recordLinkFailure(chatId);
      await ctx.reply(`Этот аккаунт уже привязан к другому Telegram.`);
      return;
    }

    clearLinkAttempts(chatId);
    await storage.updateUserTelegramChatId(parent.id, chatId);
    await ctx.reply(
      `Отлично, ${parent.name}! Я теперь ваш Внучок в Telegram.\n\n` +
      `Просто напишите мне — поболтаем, помогу с чем нужно.\n\n` +
      `/pills — мои лекарства\n` +
      `/bp 120/80 — записать давление\n` +
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
      setPendingRegistration(chatId);
      await ctx.reply(`Напишите ваше имя (например: Мария Ивановна):`);
      return;
    }

    try {
      const result = await registerUserFromTelegram(chatId, name);
      await ctx.reply(result.message);
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

  async function handleBpCommand(ctx: any) {
    try {
      const chatId = ctx.chat.id.toString();
      const user = await storage.getUserByTelegramChatId(chatId);
      if (!user) {
        await ctx.reply(`Сначала привяжите аккаунт: /link ВАШ_КОД или /register Ваше Имя`);
        return;
      }

      const input = ctx.match?.trim() || "";
      const parsed = parseBpInput(input);

      if (!parsed) {
        await ctx.reply(
          `Укажите давление после команды.\n` +
          `Можно в любом формате:\n` +
          `/bp 120/80\n` +
          `/bp 120 80\n` +
          `/давление 130 на 85\n` +
          `/bp 135-85 после прогулки`
        );
        return;
      }

      const { systolic, diastolic, note } = parsed;

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
  }

  bot.command("bp", handleBpCommand);
  bot.hears(/^\/давление\b(.*)$/i, async (ctx) => {
    ctx.match = ctx.match[1]?.trim() || "";
    await handleBpCommand(ctx);
  });

  function getSettingsMenuKeyboard() {
    return new InlineKeyboard()
      .text("📚 Темы и экспертиза", "settings_topics").row()
      .text("🎭 Личность бота", "settings_personality").row();
  }

  async function showSettingsMenu(ctx: any, edit = false) {
    const text = "⚙️ Настройки\n\nВыберите, что хотите настроить:";
    const keyboard = getSettingsMenuKeyboard();
    if (edit) {
      try { await ctx.editMessageText(text, { reply_markup: keyboard }); return; } catch {}
    }
    await ctx.reply(text, { reply_markup: keyboard });
  }

  bot.callbackQuery("settings_menu", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}
    await showSettingsMenu(ctx, true);
  });

  bot.callbackQuery("settings_topics", async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) { try { await ctx.answerCallbackQuery({ text: "Сначала /start" }); } catch {} return; }
    const keyboard = new InlineKeyboard();
    for (const cat of TOPIC_CATEGORIES) {
      keyboard.text(`${cat.icon} ${cat.name}`, `tcat_${cat.id}`).row();
    }
    keyboard.text("⬅️ Назад к настройкам", "settings_menu").row();
    try { await ctx.answerCallbackQuery(); } catch {}
    try {
      await ctx.editMessageText("📚 Выберите категорию тем:", { reply_markup: keyboard });
    } catch {
      await ctx.reply("📚 Выберите категорию тем:", { reply_markup: keyboard });
    }
  });

  bot.callbackQuery("settings_personality", async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) { try { await ctx.answerCallbackQuery({ text: "Сначала /start" }); } catch {} return; }
    try { await ctx.answerCallbackQuery(); } catch {}
    await refreshSettingsMessage(ctx, user.id);
  });

  bot.command("topics", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) {
      await ctx.reply("Сначала зарегистрируйтесь — /start");
      return;
    }
    const keyboard = new InlineKeyboard();
    for (const cat of TOPIC_CATEGORIES) {
      keyboard.text(`${cat.icon} ${cat.name}`, `tcat_${cat.id}`).row();
    }
    keyboard.text("⬅️ Назад к настройкам", "settings_menu").row();
    await ctx.reply("📚 Выберите категорию тем:", { reply_markup: keyboard });
  });

  bot.callbackQuery(/^tcat_(.+)$/, async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) { try { await ctx.answerCallbackQuery({ text: "Сначала /start" }); } catch {} return; }
    const categoryId = ctx.match[1];
    const category = TOPIC_CATEGORIES.find(c => c.id === categoryId);
    if (!category) { try { await ctx.answerCallbackQuery(); } catch {} return; }
    const topics = TOPIC_CATALOG.filter(t => t.category === categoryId);
    const settings = await storage.getTopicSettings(user.id);
    const settingsMap = new Map(settings.map(s => [s.topicId, s]));
    const keyboard = new InlineKeyboard();
    for (const topic of topics) {
      const s = settingsMap.get(topic.id);
      const depthLabel = s ? (s.enabled ? ({ basic: "Базовый", detailed: "Подробный", expert: "Экспертный" } as Record<string, string>)[s.depth] || s.depth : "Выкл") : "Базовый";
      const icon = s ? (s.enabled ? "✅" : "❌") : "✅";
      keyboard.text(`${icon} ${topic.name} [${depthLabel}]`, `ttopic_${topic.id}`).row();
    }
    keyboard.text("⬅️ Назад к категориям", "tback_cats").row();
    try { await ctx.answerCallbackQuery(); } catch {}
    try {
      await ctx.editMessageText(`${category.icon} ${category.name}\n\nВыберите тему для настройки:`, { reply_markup: keyboard });
    } catch {
      await ctx.reply(`${category.icon} ${category.name}\n\nВыберите тему для настройки:`, { reply_markup: keyboard });
    }
  });

  bot.callbackQuery("tback_cats", async (ctx) => {
    const keyboard = new InlineKeyboard();
    for (const cat of TOPIC_CATEGORIES) {
      keyboard.text(`${cat.icon} ${cat.name}`, `tcat_${cat.id}`).row();
    }
    keyboard.text("⬅️ Назад к настройкам", "settings_menu").row();
    try { await ctx.answerCallbackQuery(); } catch {}
    try {
      await ctx.editMessageText("📚 Выберите категорию тем:", { reply_markup: keyboard });
    } catch {
      await ctx.reply("📚 Выберите категорию тем:", { reply_markup: keyboard });
    }
  });

  bot.callbackQuery(/^ttopic_(.+)$/, async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) { try { await ctx.answerCallbackQuery({ text: "Сначала /start" }); } catch {} return; }
    const topicId = ctx.match[1];
    const topic = TOPIC_CATALOG.find(t => t.id === topicId);
    if (!topic) { try { await ctx.answerCallbackQuery(); } catch {} return; }
    const settings = await storage.getTopicSettings(user.id);
    const s = settings.find(x => x.topicId === topicId);
    const currentDepth = s ? (s.enabled ? s.depth : "off") : "basic";
    const depthLabels: Record<string, string> = { basic: "Базовый", detailed: "Подробный", expert: "Экспертный", off: "Выключена" };
    const keyboard = new InlineKeyboard();
    for (const [key, label] of Object.entries(depthLabels)) {
      const marker = currentDepth === key ? "● " : "○ ";
      keyboard.text(`${marker}${label}`, `tdepth_${topicId}_${key}`).row();
    }
    keyboard.text("⬅️ Назад к категории", `tcat_${topic.category}`).row();
    try { await ctx.answerCallbackQuery(); } catch {}
    try {
      await ctx.editMessageText(`📌 ${topic.name}\n${topic.description}\n\nТекущий уровень: ${depthLabels[currentDepth]}`, { reply_markup: keyboard });
    } catch {
      await ctx.reply(`📌 ${topic.name}\n${topic.description}\n\nТекущий уровень: ${depthLabels[currentDepth]}`, { reply_markup: keyboard });
    }
  });

  bot.callbackQuery(/^tdepth_(.+)_(basic|detailed|expert|off)$/, async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) { try { await ctx.answerCallbackQuery({ text: "Сначала /start" }); } catch {} return; }
    const topicId = ctx.match[1];
    const depth = ctx.match[2];
    const topic = TOPIC_CATALOG.find(t => t.id === topicId);
    if (!topic) { try { await ctx.answerCallbackQuery(); } catch {} return; }
    if (depth === "off") {
      await storage.upsertTopicSetting(user.id, topicId, "basic", false);
    } else {
      await storage.upsertTopicSetting(user.id, topicId, depth as "basic" | "detailed" | "expert", true);
    }
    const depthLabels: Record<string, string> = { basic: "Базовый", detailed: "Подробный", expert: "Экспертный", off: "Выключена" };
    try { await ctx.answerCallbackQuery({ text: `${topic.name}: ${depthLabels[depth]}` }); } catch {}
    const keyboard = new InlineKeyboard();
    for (const [key, label] of Object.entries(depthLabels)) {
      const marker = depth === key ? "● " : "○ ";
      keyboard.text(`${marker}${label}`, `tdepth_${topicId}_${key}`).row();
    }
    keyboard.text("⬅️ Назад к категории", `tcat_${topic.category}`).row();
    try {
      await ctx.editMessageText(`📌 ${topic.name}\n${topic.description}\n\nТекущий уровень: ${depthLabels[depth]}`, { reply_markup: keyboard });
    } catch {}
  });

  bot.callbackQuery(/^sqfb:(positive|negative):(\d+)$/, async (ctx) => {
    const feedback = ctx.match[1];
    const logId = parseInt(ctx.match[2], 10);
    try {
      await storage.updateSearchQualityFeedback(logId, feedback);
      const emoji = feedback === "positive" ? "👍" : "👎";
      await ctx.answerCallbackQuery({ text: feedback === "positive" ? "Спасибо! Рад, что помог 😊" : "Спасибо за отзыв, буду стараться лучше!" });
      const originalText = ctx.callbackQuery.message?.text || "";
      if (originalText) {
        try {
          await ctx.editMessageText(originalText + `\n\n${emoji}`, { reply_markup: undefined });
        } catch {}
      }
    } catch (err) {
      console.error("[telegram] sqfb error:", err);
      try { await ctx.answerCallbackQuery({ text: "Не удалось сохранить" }); } catch {}
    }
  });

  bot.command("settings", async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) {
      await ctx.reply("Сначала зарегистрируйтесь — /start");
      return;
    }
    await showSettingsMenu(ctx);
  });

  bot.callbackQuery("ps_formality", async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) return;
    const ps = await storage.getPersonalitySettings(user.id);
    const newFormality = (ps?.formality === "вы") ? "ты" : "вы";
    await storage.upsertPersonalitySettings(user.id, { formality: newFormality });
    try { await ctx.answerCallbackQuery({ text: `Теперь обращаюсь на «${newFormality}»` }); } catch {}
    await refreshSettingsMessage(ctx, user.id);
  });

  bot.callbackQuery("ps_emoji", async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) return;
    const ps = await storage.getPersonalitySettings(user.id);
    const newEmoji = !(ps?.useEmoji ?? true);
    await storage.upsertPersonalitySettings(user.id, { useEmoji: newEmoji });
    try { await ctx.answerCallbackQuery({ text: `Эмодзи ${newEmoji ? "включены" : "выключены"}` }); } catch {}
    await refreshSettingsMessage(ctx, user.id);
  });

  bot.callbackQuery(/^ps_(humor|soft|verb|enc)_(up|down)$/, async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) return;
    const user = await storage.getUserByTelegramChatId(chatId);
    if (!user) return;
    const field = ctx.match[1];
    const dir = ctx.match[2];
    const ps = await storage.getPersonalitySettings(user.id);
    const fieldMap: Record<string, keyof NonNullable<typeof ps>> = {
      humor: "humor", soft: "softness", verb: "verbosity", enc: "encouragement"
    };
    const dbField = fieldMap[field];
    if (!dbField) return;
    const current = (ps?.[dbField] as number) ?? 3;
    const newVal = dir === "up" ? Math.min(5, current + 1) : Math.max(0, current - 1);
    await storage.upsertPersonalitySettings(user.id, { [dbField]: newVal });
    const nameMap: Record<string, string> = { humor: "Юмор", soft: "Мягкость", verb: "Болтливость", enc: "Похвала" };
    try { await ctx.answerCallbackQuery({ text: `${nameMap[field]}: ${newVal}/5` }); } catch {}
    await refreshSettingsMessage(ctx, user.id);
  });

  async function refreshSettingsMessage(ctx: any, userId: number) {
    const ps = await storage.getPersonalitySettings(userId);
    const formality = ps?.formality || "ты";
    const humor = ps?.humor ?? 3;
    const softness = ps?.softness ?? 4;
    const verbosity = ps?.verbosity ?? 3;
    const useEmoji = ps?.useEmoji ?? true;
    const encouragement = ps?.encouragement ?? 4;
    const formalityLabel = formality === "вы" ? "на «вы»" : "на «ты»";
    const text =
      `⚙️ Настройки личности бота\n\n` +
      `👤 Обращение: ${formalityLabel}\n` +
      `😄 Юмор: ${humor}/5\n` +
      `🤗 Мягкость: ${softness}/5\n` +
      `💬 Разговорчивость: ${verbosity}/5\n` +
      `😊 Эмодзи: ${useEmoji ? "вкл" : "выкл"}\n` +
      `👏 Подбадривание: ${encouragement}/5\n\n` +
      `Нажмите кнопку, чтобы изменить:`;
    const keyboard = new InlineKeyboard()
      .text(`👤 ${formalityLabel}`, "ps_formality").row()
      .text(`😄 Юмор ${humor}/5 ➖`, "ps_humor_down").text(`😄 Юмор ${humor}/5 ➕`, "ps_humor_up").row()
      .text(`🤗 Мягкость ${softness}/5 ➖`, "ps_soft_down").text(`🤗 Мягкость ${softness}/5 ➕`, "ps_soft_up").row()
      .text(`💬 Болтливость ${verbosity}/5 ➖`, "ps_verb_down").text(`💬 Болтливость ${verbosity}/5 ➕`, "ps_verb_up").row()
      .text(`😊 Эмодзи: ${useEmoji ? "вкл" : "выкл"}`, "ps_emoji").row()
      .text(`👏 Похвала ${encouragement}/5 ➖`, "ps_enc_down").text(`👏 Похвала ${encouragement}/5 ➕`, "ps_enc_up").row()
      .text("⬅️ Назад к настройкам", "settings_menu").row();
    try {
      await ctx.editMessageText(text, { reply_markup: keyboard });
    } catch {}
  }

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
        const hintText = result.hint || "Не удалось распознать показания. Попробуйте сфотографировать ближе и чётче.";
        await ctx.reply(`${hintText}\n\nИли введите вручную, например:\n/meter ХВС 12345`);
      }
    } catch (err: any) {
      console.error("[telegram] Photo recognition error:", err);
      const errMsg = (err.message || "").toLowerCase();
      let errorText: string;
      if (errMsg.includes("timeout") || errMsg.includes("timed out")) {
        errorText = "Распознавание заняло слишком много времени. Попробуйте отправить фото ещё раз.";
      } else if (errMsg.includes("too large") || errMsg.includes("file_too_big")) {
        errorText = "Фото слишком большое. Попробуйте сфотографировать в обычном режиме (без HD).";
      } else {
        errorText = "Не получилось распознать фото. Попробуйте отправить ещё раз или введите показания вручную:\n/meter ХВС 12345";
      }
      await ctx.reply(errorText);
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

      const sttResult = await speechToText(audioBuffer);
      const userText = sttResult.text;

      if (sttResult.confidence === "low" || !userText || userText.length < 1) {
        console.log(`[telegram] Voice rejected: conf=${sttResult.confidence}, noSpeech=${sttResult.noSpeechProb.toFixed(2)}, text="${userText?.slice(0, 30)}"`);
        await ctx.reply("Прости, не разобрал что ты сказал(а). Попробуй ещё раз, говори чуть громче и чётче 🙏");
        return;
      }

      if (sttResult.confidence === "medium") {
        console.log(`[telegram] Voice medium confidence: "${userText.slice(0, 50)}", noSpeech=${sttResult.noSpeechProb.toFixed(2)}`);
        pendingVoiceConfirm.set(chatId, { transcript: userText, timestamp: Date.now() });
        await ctx.reply(`Я услышал: «${userText}»\n\nПравильно? Если да — напиши «да» или повтори голосовое чётче.`);
        return;
      }

      const extractedDish = extractDishFromText(userText);
      const voiceClarification = extractedDish ? RECIPE_CLARIFICATIONS[extractedDish] : null;
      if (voiceClarification) {
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
          content: voiceClarification,
          intent: "recipe_clarification",
          hasAlert: false,
        });
        await ctx.reply(`Я услышал: "${userText}"\n\n${voiceClarification}`);
        return;
      }

      if (!isEmergencyMessage(userText)) {
        if (!checkBurstLimit(chatId)) {
          await ctx.reply(BURST_LIMIT_MESSAGE);
          return;
        }
        const allowed = await checkTelegramDailyLimit(user.id);
        if (!allowed) {
          await ctx.reply(RATE_LIMIT_MESSAGE);
          return;
        }
      }

      const chatHistory = await storage.getChatMessages(user.id, 20);
      const messages: Array<{ role: "user" | "assistant"; content: string }> = chatHistory
        .reverse()
        .filter(m => m.intent !== "voice_confirm")
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
          : result.intent === "financial_risk"
          ? "Подозрительное финансовое решение!"
          : result.intent === "home_danger"
          ? "Опасная ситуация дома!"
          : result.intent === "lost"
          ? "Родитель потерялся на улице!"
          : "Родитель сообщил о проблеме со здоровьем!";

        const children = await storage.getChildrenByParentId(user.id);
        for (const child of children) {
          await storage.createEvent({
            userId: child.id,
            parentId: user.id,
            type: "alert",
            severity: "critical",
            title: alertTitle,
            description: userText,
          });

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

        if (children.length === 0) {
          await storage.createEvent({
            userId: user.id,
            parentId: user.id,
            type: "alert",
            severity: "critical",
            title: alertTitle,
            description: userText,
          });
        }
      }

      const voicePhotoSrc = getPhotoSource(result);
      if (voicePhotoSrc) {
        try {
          if (result.reply.length > 1024) {
            await ctx.reply(result.reply);
            await ctx.replyWithPhoto(voicePhotoSrc);
          } else {
            await ctx.replyWithPhoto(voicePhotoSrc, {
              caption: result.reply,
            });
          }
        } catch (imgErr) {
          console.error("[telegram] Failed to send image:", imgErr);
          await ctx.reply(result.reply);
        }
      }

      try {
        const ttsResult = await textToSpeech(result.reply);
        await ctx.replyWithVoice(new InputFile(ttsResult.buffer, `response.ogg`));
      } catch (ttsErr) {
        console.error("[telegram] TTS failed, sending text:", ttsErr);
        if (!voicePhotoSrc) {
          await ctx.reply(result.reply);
        }
      }

      await maybeSendPaywallHint(user.id, chatId, ctx);
    } catch (err: any) {
      console.error("[telegram] Voice message error:", err);
      await ctx.reply("Ой, не получилось обработать голосовое сообщение. Попробуйте ещё раз или напишите текстом.");
    }
  });

  bot.on("message:text", async (ctx) => {
    let userText = ctx.message.text;

    if (userText === "/настройки") {
      const chatId = ctx.chat.id.toString();
      const user = await storage.getUserByTelegramChatId(chatId);
      if (!user) { await ctx.reply("Сначала зарегистрируйтесь — /start"); return; }
      await showSettingsMenu(ctx);
      return;
    }

    if (userText === "/темы") {
      const chatId = ctx.chat.id.toString();
      const user = await storage.getUserByTelegramChatId(chatId);
      if (!user) { await ctx.reply("Сначала зарегистрируйтесь — /start"); return; }
      const keyboard = new InlineKeyboard();
      for (const cat of TOPIC_CATEGORIES) {
        keyboard.text(`${cat.icon} ${cat.name}`, `tcat_${cat.id}`).row();
      }
      keyboard.text("⬅️ Назад к настройкам", "settings_menu").row();
      await ctx.reply("📚 Выберите категорию тем:", { reply_markup: keyboard });
      return;
    }

    if (userText.startsWith("/")) return;

    if (userText === "⚙️ Настройки") {
      const chatId = ctx.chat.id.toString();
      const user = await storage.getUserByTelegramChatId(chatId);
      if (!user) { await ctx.reply("Сначала зарегистрируйтесь — /start"); return; }
      await showSettingsMenu(ctx);
      return;
    }

    if (userText === "💊 Здоровье") {
      await ctx.reply("💊 Здоровье — выберите:", { reply_markup: getHealthKeyboard() });
      return;
    }

    if (userText === "🏠 Помощь" || userText === "🏠 Хозяйство") {
      await ctx.reply("🏠 Помощь — выберите:", { reply_markup: getHelpKeyboard() });
      return;
    }

    if (userText === "🎭 Досуг" || userText === "🎭 Увлечения" || userText === "🎭 Афиша") {
      await ctx.reply("🎭 Досуг — выберите:", { reply_markup: getLeisureKeyboard() });
      return;
    }

    if (userText === "📋 Ещё") {
      await ctx.reply("📋 Ещё — выберите:", { reply_markup: getMoreKeyboard() });
      return;
    }

    const chatId = ctx.chat.id.toString();

    if (isPendingRegistration(chatId)) {
      pendingRegistration.delete(chatId);
      const name = userText.trim();
      if (!name || name.length < 2) {
        await ctx.reply(`Имя слишком короткое. Попробуйте ещё раз: /register`);
        return;
      }
      try {
        const result = await registerUserFromTelegram(chatId, name);
        await ctx.reply(result.message);
      } catch (err: any) {
        console.error("[telegram] Registration error:", err);
        await ctx.reply(`Произошла ошибка при регистрации. Попробуйте позже.`);
      }
      return;
    }

    cleanupPendingStates();
    if (onboardingState.has(chatId)) {
      const handled = await handleOnboardingStep(chatId, userText, ctx);
      if (handled) return;
    }

    if (isPendingLink(chatId)) {
      pendingLink.delete(chatId);
      if (!checkLinkRateLimit(chatId)) {
        await ctx.reply(`Слишком много попыток. Подождите 5 минут и попробуйте снова.`);
        return;
      }
      const code = userText.trim().toUpperCase();
      if (!code || code.length < 4) {
        await ctx.reply(`Код слишком короткий. Попробуйте ещё раз — нажмите /start`);
        return;
      }
      try {
        const parent = await storage.consumeLinkCode(code);
        if (!parent) {
          recordLinkFailure(chatId);
          await ctx.reply(`Код не найден или истёк. Проверьте и попробуйте снова — нажмите /start`);
          return;
        }
        if (parent.telegramChatId) {
          recordLinkFailure(chatId);
          await ctx.reply(`Этот аккаунт уже привязан к другому Telegram.`);
          return;
        }
        clearLinkAttempts(chatId);
        await storage.updateUserTelegramChatId(parent.id, chatId);
        await ctx.reply(
          `Отлично, ${parent.name}! Я теперь ваш Внучок в Telegram.\n\n` +
          `Просто напишите мне — поболтаем, помогу с чем нужно.\n\n` +
          `/pills — мои лекарства\n` +
          `/bp 120/80 — записать давление\n` +
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
        .text("👋 Давайте знакомиться!", "action_register").row()
        .text("🔗 Меня подключил(а) родственник(ца)", "action_link");

      await ctx.reply(
        `Здравствуйте! Меня зовут Внучок — я ваш помощник на каждый день.\n` +
        `Погода, рецепты, лекарства, льготы, электрички и многое другое.\n\n` +
        `Нажмите кнопку ниже, чтобы начать:`,
        { reply_markup: keyboard }
      );
      return;
    }

    const voiceConfirm = pendingVoiceConfirm.get(chatId);
    if (voiceConfirm) {
      const lower = userText.toLowerCase().trim();
      const isConfirm = /^(да|верно|правильно|ага|угу|yes|ок|ok|точно|всё верно|все верно|так и есть)/.test(lower);
      pendingVoiceConfirm.delete(chatId);

      if (isConfirm) {
        const confirmedText = voiceConfirm.transcript;
        console.log(`[telegram] Voice confirmed: "${confirmedText.slice(0, 50)}"`);

        if (!isEmergencyMessage(confirmedText)) {
          if (!checkBurstLimit(chatId)) {
            await ctx.reply(BURST_LIMIT_MESSAGE);
            return;
          }
          const allowed = await checkTelegramDailyLimit(user.id);
          if (!allowed) {
            await ctx.reply(RATE_LIMIT_MESSAGE);
            return;
          }
        }

        await storage.createChatMessage({
          parentId: user.id,
          role: "user",
          content: confirmedText,
          intent: null,
          hasAlert: false,
        });

        const chatHistory = await storage.getChatMessages(user.id, 20);
        const messages: Array<{ role: "user" | "assistant"; content: string }> = chatHistory
          .reverse()
          .filter(m => m.intent !== "voice_confirm")
          .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

        const stopTyping = startTypingLoop(ctx);
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
            : result.intent === "financial_risk"
            ? "Подозрительное финансовое решение!"
            : result.intent === "home_danger"
            ? "Опасная ситуация дома!"
            : result.intent === "lost"
            ? "Родитель потерялся на улице!"
            : "Родитель сообщил о проблеме со здоровьем!";

          const children = await storage.getChildrenByParentId(user.id);
          for (const child of children) {
            await storage.createEvent({
              userId: child.id,
              parentId: user.id,
              type: "alert",
              severity: "critical",
              title: alertTitle,
              description: confirmedText,
            });
            if (child.telegramChatId) {
              try {
                await bot!.api.sendMessage(
                  child.telegramChatId,
                  `⚠️ ${alertTitle}\n\n${user.name} сказал(а): "${confirmedText}"\n\nПроверьте ситуацию!`
                );
              } catch {}
            }
          }
        }

        const photoSrc3 = getPhotoSource(result);
        if (photoSrc3) {
          try {
            await ctx.replyWithPhoto(photoSrc3, { caption: result.reply.slice(0, 1024) });
          } catch {
            await ctx.reply(result.reply);
          }
        } else {
          let feedbackKb: InlineKeyboard | undefined;
          if (result.searchLogIds && result.searchLogIds.length > 0) {
            const logId = result.searchLogIds[result.searchLogIds.length - 1];
            feedbackKb = new InlineKeyboard()
              .text("👍 Полезно", `sqfb:positive:${logId}`)
              .text("👎 Неточно", `sqfb:negative:${logId}`);
          }
          await ctx.reply(result.reply, feedbackKb ? { reply_markup: feedbackKb } : undefined);
        }
        await maybeSendPaywallHint(user.id, chatId, ctx);
        return;
      } else {
        await ctx.reply("Ладно, давай попробуем ещё раз! Отправь голосовое сообщение заново 🎙");
        return;
      }
    }

    const settingsUpdate = detectPersonalitySettingsIntent(userText);
    if (settingsUpdate) {
      try {
        await storage.upsertPersonalitySettings(user.id, settingsUpdate.changes);
        await ctx.reply(settingsUpdate.confirmation);
      } catch (err) {
        console.error("[telegram] Settings update error:", err);
      }
      return;
    }

    const extractedDishText = extractDishFromText(userText);
    const clarification = extractedDishText ? RECIPE_CLARIFICATIONS[extractedDishText] : null;

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

    if (!isEmergencyMessage(userText)) {
      if (!checkBurstLimit(chatId)) {
        await ctx.reply(BURST_LIMIT_MESSAGE);
        return;
      }
      const allowed = await checkTelegramDailyLimit(user.id);
      if (!allowed) {
        await ctx.reply(RATE_LIMIT_MESSAGE);
        return;
      }
    }

    try {
      const chatHistory = await storage.getChatMessages(user.id, 20);
      const messages: Array<{ role: "user" | "assistant"; content: string }> = chatHistory
        .reverse()
        .filter(m => m.intent !== "voice_confirm")
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

      let researchMsgId: number | null = null;
      const onResearchStatus = async (status: string) => {
        try {
          if (researchMsgId) {
            try { await ctx.api.deleteMessage(ctx.chat.id, researchMsgId); } catch {}
          }
          const sent = await ctx.reply(status);
          researchMsgId = sent.message_id;
        } catch {}
      };

      let result;
      try {
        result = await chatWithGrandchild(messages, user.name, user.id, onToolCall, onResearchStatus);
      } finally {
        stopTyping();
        if (statusMsgId) {
          try { await ctx.api.deleteMessage(ctx.chat.id, statusMsgId); } catch {}
        }
        if (researchMsgId) {
          try { await ctx.api.deleteMessage(ctx.chat.id, researchMsgId); } catch {}
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
          : result.intent === "financial_risk"
          ? "Подозрительное финансовое решение!"
          : result.intent === "home_danger"
          ? "Опасная ситуация дома!"
          : result.intent === "lost"
          ? "Родитель потерялся на улице!"
          : "Родитель сообщил о проблеме со здоровьем!";

        const children = await storage.getChildrenByParentId(user.id);
        for (const child of children) {
          await storage.createEvent({
            userId: child.id,
            parentId: user.id,
            type: "alert",
            severity: "critical",
            title: alertTitle,
            description: userText,
          });

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

        if (children.length === 0) {
          await storage.createEvent({
            userId: user.id,
            parentId: user.id,
            type: "alert",
            severity: "critical",
            title: alertTitle,
            description: userText,
          });
        }
      }

      const photoSrc4 = getPhotoSource(result);
      if (photoSrc4) {
        try {
          if (result.reply.length > 1024) {
            await ctx.reply(result.reply);
            await ctx.replyWithPhoto(photoSrc4);
          } else {
            await ctx.replyWithPhoto(photoSrc4, {
              caption: result.reply,
            });
          }
        } catch (imgErr) {
          console.error("[telegram] Failed to send image:", imgErr);
          await ctx.reply(result.reply);
        }
      } else {
        let feedbackKb: InlineKeyboard | undefined;
        if (result.searchLogIds && result.searchLogIds.length > 0) {
          const logId = result.searchLogIds[result.searchLogIds.length - 1];
          feedbackKb = new InlineKeyboard()
            .text("👍 Полезно", `sqfb:positive:${logId}`)
            .text("👎 Неточно", `sqfb:negative:${logId}`);
        }
        await ctx.reply(result.reply, feedbackKb ? { reply_markup: feedbackKb } : undefined);
      }

      const wantsVoice = /голос(ом|ом\s|овое)|поговори(ть|м)?\s*(голосом)?|хочу.*голос|скажи\s*голосом|аудио/i.test(userText);
      if (wantsVoice) {
        try {
          const ttsResult = await textToSpeech(result.reply);
          await ctx.replyWithVoice(new InputFile(ttsResult.buffer, `response.ogg`));
        } catch (ttsErr) {
          console.error("[telegram] TTS for text message failed:", ttsErr);
        }
      }

      await maybeSendPaywallHint(user.id, chatId, ctx);
    } catch (err: any) {
      console.error("[telegram] Chat error:", err);
      await ctx.reply("Ой, что-то я задумался. Напишите ещё раз через минутку.");
    }
  });

  bot.catch((err) => {
    console.error("[telegram] Bot error:", err);
  });

  try {
    await bot.api.setMyCommands([
      { command: "start", description: "Начать общение" },
      { command: "help", description: "Помощь и подсказки" },
      { command: "settings", description: "Настройки бота" },
      { command: "topics", description: "Темы и экспертиза" },
      { command: "pills", description: "Напоминания о лекарствах" },
      { command: "bp", description: "Записать давление (120/80)" },
      { command: "meter", description: "Показания счётчиков" },
      { command: "link", description: "Привязать родственника" },
    ]);
    console.log("[telegram] Bot commands registered via setMyCommands");
  } catch (err) {
    console.error("[telegram] Failed to register bot commands:", err);
  }

  let botReady = false;

  const startBotWithRetry = async () => {
    const MAX_RETRIES = 10;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await bot.start({
          onStart: () => {
            botReady = true;
            (bot as any).__ready = true;
            console.log("[telegram] Bot started successfully");
          },
        });
        return;
      } catch (err: any) {
        if (err?.error_code === 409 || err?.message?.includes("409")) {
          const jitter = Math.random() * 2000;
          const delay = Math.min(5000 * Math.pow(2, attempt) + jitter, 60000);
          console.warn(`[telegram] 409 Conflict — another bot instance running. Retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        console.error("[telegram] Bot start failed with non-recoverable error:", err);
        return;
      }
    }
    console.error("[telegram] Bot failed to start after " + MAX_RETRIES + " attempts. Will retry in 5 minutes...");
    const recoveryInterval = setInterval(async () => {
      console.log("[telegram] Attempting bot recovery...");
      try {
        await bot.start({
          onStart: () => {
            botReady = true;
            (bot as any).__ready = true;
            console.log("[telegram] Bot recovered successfully!");
            clearInterval(recoveryInterval);
          },
        });
      } catch (err: any) {
        if (err?.error_code === 409 || err?.message?.includes("409")) {
          console.warn("[telegram] Recovery attempt: still 409 Conflict. Will retry in 5 minutes...");
        } else {
          console.error("[telegram] Recovery attempt failed:", err.message);
        }
      }
    }, 5 * 60 * 1000);
  };

  startBotWithRetry().catch(err => {
    console.error("[telegram] Bot start retry loop failed:", err);
  });

  return bot;
}

export function stopTelegramBot() {
  if (bot) {
    bot.stop();
    console.log("[telegram] Bot stopped");
  }
}
