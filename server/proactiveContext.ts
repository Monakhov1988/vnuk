import { storage } from "./storage";
import { getWeather } from "./tools";

export type ProactiveCategory =
  | "follow_up"
  | "health_check"
  | "weather"
  | "seasonal"
  | "memoir_prompt"
  | "feature_discovery"
  | "gratitude";

interface SeasonalContext {
  season: string;
  seasonEmoji: string;
  upcomingHolidays: { name: string; daysUntil: number }[];
}

interface WeatherContext {
  city: string;
  summary: string;
}

interface DayContext {
  isWeekend: boolean;
  dayOfWeek: string;
  timeOfDay: "утро" | "день" | "вечер";
  mskHour: number;
}

export interface ProactiveContext {
  day: DayContext;
  seasonal: SeasonalContext;
  weather: WeatherContext | null;
  healthGap: number | null;
  medicationStreak: number;
  daysSinceLastChat: number;
  suggestedFeatures: string[];
  usedMemoirPrompts: string[];
}

const RUSSIAN_HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: "Новый год" },
  { month: 1, day: 7, name: "Рождество" },
  { month: 2, day: 14, name: "День святого Валентина" },
  { month: 2, day: 23, name: "День защитника Отечества" },
  { month: 3, day: 8, name: "Международный женский день" },
  { month: 5, day: 1, name: "Праздник Весны и Труда" },
  { month: 5, day: 9, name: "День Победы" },
  { month: 6, day: 1, name: "День защиты детей" },
  { month: 6, day: 12, name: "День России" },
  { month: 9, day: 1, name: "День знаний" },
  { month: 10, day: 1, name: "День пожилого человека" },
  { month: 11, day: 4, name: "День народного единства" },
  { month: 12, day: 31, name: "Новогодний вечер" },
];

const DAY_NAMES = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];

export function getDayContext(): DayContext {
  const now = new Date();
  const msk = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
  const mskHour = msk.getHours();
  const dayOfWeek = msk.getDay();

  let timeOfDay: "утро" | "день" | "вечер" = "день";
  if (mskHour < 12) timeOfDay = "утро";
  else if (mskHour >= 18) timeOfDay = "вечер";

  return {
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    dayOfWeek: DAY_NAMES[dayOfWeek],
    timeOfDay,
    mskHour,
  };
}

export function getSeasonalContext(): SeasonalContext {
  const now = new Date();
  const msk = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
  const month = msk.getMonth() + 1;
  const day = msk.getDate();

  let season: string;
  let seasonEmoji: string;
  if (month >= 3 && month <= 5) { season = "весна"; seasonEmoji = "🌸"; }
  else if (month >= 6 && month <= 8) { season = "лето"; seasonEmoji = "☀️"; }
  else if (month >= 9 && month <= 11) { season = "осень"; seasonEmoji = "🍂"; }
  else { season = "зима"; seasonEmoji = "❄️"; }

  const upcomingHolidays: { name: string; daysUntil: number }[] = [];
  const todayMidnight = new Date(msk.getFullYear(), msk.getMonth(), msk.getDate());

  for (const h of RUSSIAN_HOLIDAYS) {
    let holidayDate = new Date(msk.getFullYear(), h.month - 1, h.day);
    if (holidayDate < todayMidnight) {
      holidayDate = new Date(msk.getFullYear() + 1, h.month - 1, h.day);
    }
    const diffMs = holidayDate.getTime() - todayMidnight.getTime();
    const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (daysUntil <= 5 && daysUntil >= 0) {
      upcomingHolidays.push({ name: h.name, daysUntil });
    }
  }

  upcomingHolidays.sort((a, b) => a.daysUntil - b.daysUntil);

  return { season, seasonEmoji, upcomingHolidays };
}

export async function getWeatherContext(parentId: number): Promise<WeatherContext | null> {
  try {
    const memories = await storage.getUserMemory(parentId, 50);
    const cityFact = memories.find(m =>
      /город|живёт в|живет в|проживает|из города/i.test(m.fact)
    );
    if (!cityFact) return null;

    const cityMatch = cityFact.fact.match(/(?:город[:\s]+|живёт в\s+|живет в\s+|проживает в\s+|из города\s+)([А-Яа-яЁё\s-]+)/i);
    if (!cityMatch) return null;

    const city = cityMatch[1].trim();
    if (!city || city.length < 2) return null;

    const weatherText = await getWeather(city);
    if (weatherText.includes("не найден")) return null;

    return { city, summary: weatherText };
  } catch {
    return null;
  }
}

export async function getHealthGapDays(parentId: number): Promise<number | null> {
  try {
    const logs = await storage.getHealthLogs(parentId, 1);
    if (logs.length === 0) return null;
    const lastLog = logs[0];
    if (!lastLog.createdAt) return null;
    const diffMs = Date.now() - new Date(lastLog.createdAt).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export async function getMedicationStreak(parentId: number): Promise<number> {
  try {
    const reminders = await storage.getRemindersByParent(parentId);
    if (reminders.length === 0) return 0;

    const allConfirmedToday = reminders.every(r => {
      if (!r.lastConfirmed) return false;
      const confDate = new Date(r.lastConfirmed).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      return confDate === today;
    });

    return allConfirmedToday ? 1 : 0;
  } catch {
    return 0;
  }
}

export async function getSuggestedFeatures(parentId: number): Promise<string[]> {
  try {
    const memories = await storage.getUserMemory(parentId, 200);
    return memories
      .filter(m => m.category === "feature_discovery")
      .map(m => m.fact);
  } catch {
    return [];
  }
}

export async function getUsedMemoirPrompts(parentId: number): Promise<string[]> {
  try {
    const memories = await storage.getUserMemory(parentId, 200);
    return memories
      .filter(m => m.category === "memoir_prompt_used")
      .map(m => m.fact);
  } catch {
    return [];
  }
}

export async function gatherProactiveContext(parentId: number): Promise<ProactiveContext> {
  const [day, seasonal, weather, healthGap, medicationStreak, suggestedFeatures, usedMemoirPrompts, lastMsgTime] = await Promise.all([
    getDayContext(),
    getSeasonalContext(),
    getWeatherContext(parentId),
    getHealthGapDays(parentId),
    getMedicationStreak(parentId),
    getSuggestedFeatures(parentId),
    getUsedMemoirPrompts(parentId),
    storage.getLastMessageTime(parentId),
  ]);

  const daysSinceLastChat = lastMsgTime
    ? Math.floor((Date.now() - lastMsgTime.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  return {
    day,
    seasonal,
    weather,
    healthGap,
    medicationStreak,
    daysSinceLastChat,
    suggestedFeatures,
    usedMemoirPrompts,
  };
}

export const MEMOIR_PROMPTS: { id: string; theme: string; text: string; seasons?: string[] }[] = [
  { id: "childhood_summer", theme: "детство", text: "А помните, как проводили лето в детстве? Может, ездили к бабушке в деревню или на дачу?", seasons: ["лето"] },
  { id: "childhood_winter", theme: "детство", text: "А какие зимы были в вашем детстве? Помните, как катались на санках или лепили снеговиков?", seasons: ["зима"] },
  { id: "childhood_games", theme: "детство", text: "А во что вы играли во дворе в детстве? Какие игры были самые любимые?" },
  { id: "school_teacher", theme: "школа", text: "А помните своего любимого учителя в школе? Кто это был и чему он вас научил?" },
  { id: "school_friends", theme: "школа", text: "А с кем вы дружили в школе? Может, до сих пор общаетесь?" },
  { id: "first_job", theme: "работа", text: "А помните свою первую работу? Как это было — волновались?" },
  { id: "career_proudest", theme: "работа", text: "А какой момент на работе вам запомнился больше всего? Чем гордитесь?" },
  { id: "wedding_story", theme: "семья", text: "А расскажите, как познакомились со своей второй половинкой? Это же целая история!" },
  { id: "children_born", theme: "семья", text: "А помните, как родился ваш первый ребёнок? Какие были чувства?" },
  { id: "family_traditions", theme: "семья", text: "А какие традиции были в вашей семье? Может, что-то особенное на праздники готовили?" },
  { id: "travel_memorable", theme: "путешествия", text: "А какое путешествие запомнилось вам больше всего? Куда ездили?" },
  { id: "travel_dream", theme: "путешествия", text: "А куда вы мечтали поехать, когда были молодыми? Удалось ли побывать?" },
  { id: "cooking_recipe", theme: "кулинария", text: "А есть какое-нибудь фирменное блюдо, которое вы готовите лучше всех? Расскажите секрет!" },
  { id: "cooking_grandma", theme: "кулинария", text: "А помните, что вкусного готовила ваша мама или бабушка? Может, тот самый борщ или пирожки?" },
  { id: "holiday_newyear", theme: "праздники", text: "А как вы встречали Новый год раньше? Что готовили на стол? Какие были традиции?", seasons: ["зима"] },
  { id: "holiday_may9", theme: "праздники", text: "А что рассказывали ваши родители или бабушки-дедушки о войне? Какие истории передавались в семье?" },
  { id: "neighborhood", theme: "место", text: "А каким был ваш двор или район, где вы выросли? Что там было интересного?" },
  { id: "city_changes", theme: "место", text: "А как изменился ваш город за вашу жизнь? Что было раньше и чего уже нет?" },
  { id: "technology", theme: "прогресс", text: "А помните первый телевизор или телефон в вашей семье? Как это было?" },
  { id: "music_favorite", theme: "увлечения", text: "А какую музыку вы слушали в молодости? Может, ходили на концерты?" },
  { id: "books_movies", theme: "увлечения", text: "А какие книги или фильмы произвели на вас самое сильное впечатление?" },
  { id: "friendship_best", theme: "дружба", text: "А расскажите о своём лучшем друге или подруге. Как познакомились?" },
  { id: "pet_story", theme: "питомцы", text: "А были у вас домашние животные? Расскажите о них — они ведь как члены семьи!" },
  { id: "garden_dacha", theme: "дача", text: "А расскажите про свою дачу или огород. Что любите выращивать?", seasons: ["весна", "лето"] },
  { id: "autumn_harvest", theme: "дача", text: "А помните, как собирали урожай? Что варили, солили, мариновали?", seasons: ["осень"] },
  { id: "spring_feelings", theme: "времена года", text: "Весна — время обновления. А что вы обычно делали весной? Может, генеральную уборку или на дачу выезжали?", seasons: ["весна"] },
  { id: "funny_story", theme: "юмор", text: "А какой самый смешной случай вы помните из своей жизни? Такой, над которым до сих пор смеётесь!" },
  { id: "life_lesson", theme: "мудрость", text: "А какой главный урок преподнесла вам жизнь? Что бы вы посоветовали молодым?" },
  { id: "grandchildren", theme: "семья", text: "А расскажите о своих внуках! Какие они? Чем радуют?" },
  { id: "hobby_craft", theme: "увлечения", text: "А есть что-то, что вы умеете делать руками? Вязание, шитьё, ремонт — расскажите!" },
];

export function pickMemoirPrompt(usedPrompts: string[], season: string): { id: string; text: string } | null {
  const available = MEMOIR_PROMPTS.filter(p => {
    if (usedPrompts.includes(p.id)) return false;
    if (p.seasons && !p.seasons.includes(season)) return false;
    return true;
  });

  if (available.length === 0) return null;

  const seasonalPrompts = available.filter(p => p.seasons && p.seasons.includes(season));
  const pool = seasonalPrompts.length > 0 && Math.random() < 0.4 ? seasonalPrompts : available;

  return pool[Math.floor(Math.random() * pool.length)];
}

const ALL_FEATURES: { id: string; keywords: RegExp; suggestion: string }[] = [
  { id: "transport", keywords: /электричк|расписани|поезд|автобус|маршрут/i, suggestion: "расписание электричек и поездов" },
  { id: "benefits", keywords: /льгот|пенси|субсиди|предпенсион|пособи/i, suggestion: "льготы и пенсия" },
  { id: "legal", keywords: /юридическ|наследств|завещани|права\s+при|договор/i, suggestion: "юридические вопросы" },
  { id: "travel", keywords: /санатори|путешестви|экскурси|отдых|тур\b/i, suggestion: "путешествия и санатории" },
  { id: "exercise", keywords: /зарядк|упражнени|разминк|гимнастик/i, suggestion: "зарядка и упражнения" },
  { id: "recipe", keywords: /рецепт|ингредиент|приготов|пошагов/i, suggestion: "рецепты блюд" },
  { id: "card", keywords: /открытк|нарисова.*открытк/i, suggestion: "создание открыток" },
  { id: "medicine", keywords: /побочн.*эффект|совместимость.*лекарств|противопоказани/i, suggestion: "информация о лекарствах" },
  { id: "memoir", keywords: /мемуар|книга жизни|история жизни|воспоминани/i, suggestion: "Книга жизни — запись ваших историй" },
  { id: "meter", keywords: /счётчик|показани|жкх|коммуналк/i, suggestion: "отправка показаний счётчиков" },
  { id: "bp", keywords: /давлени|тонометр|пульс|120.*80/i, suggestion: "запись давления" },
  { id: "pills", keywords: /лекарств|напомин|таблетк|приём/i, suggestion: "напоминания о лекарствах" },
  { id: "garden", keywords: /огород|рассад|посадк|дач/i, suggestion: "советы по огороду и даче" },
  { id: "cinema", keywords: /кино|фильм|сериал|что посмотреть/i, suggestion: "что посмотреть в кино или по ТВ" },
  { id: "weather_feature", keywords: /погод|прогноз|температур/i, suggestion: "прогноз погоды" },
];

export function pickFeatureToSuggest(
  suggestedFeatures: string[],
  recentContent: string
): { id: string; suggestion: string } | null {
  const unused = ALL_FEATURES.filter(f => {
    if (suggestedFeatures.includes(f.id)) return false;
    if (f.keywords.test(recentContent)) return false;
    return true;
  });

  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)];
}

export function pickCategory(
  ctx: ProactiveContext,
  hasSubstantiveConversation: boolean,
  todayCategories: string[] = [],
  yesterdayCategories: string[] = [],
): ProactiveCategory {
  const isUsedToday = (cat: string) => todayCategories.includes(cat);
  const isUsedYesterday = (cat: string) => yesterdayCategories.includes(cat);

  if (ctx.daysSinceLastChat >= 2 && !isUsedToday("gratitude") && !isUsedYesterday("gratitude")) {
    return "gratitude";
  }

  if (ctx.healthGap !== null && ctx.healthGap >= 3 && !isUsedToday("health_check") && !isUsedYesterday("health_check")) {
    if (Math.random() < 0.6) return "health_check";
  }

  if (ctx.medicationStreak >= 1 && !isUsedToday("health_check") && !isUsedYesterday("health_check")) {
    if (Math.random() < 0.2) return "health_check";
  }

  if (ctx.seasonal.upcomingHolidays.length > 0 && !isUsedToday("seasonal") && !isUsedYesterday("seasonal")) {
    if (Math.random() < 0.5) return "seasonal";
  }

  if (hasSubstantiveConversation && !isUsedToday("follow_up") && !isUsedYesterday("follow_up")) {
    if (Math.random() < 0.55) return "follow_up";
  }

  if (ctx.weather && ctx.day.timeOfDay === "утро" && !isUsedToday("weather") && !isUsedYesterday("weather")) {
    if (Math.random() < 0.4) return "weather";
  }

  const canSuggestFeature = ctx.suggestedFeatures.length < ALL_FEATURES.length;
  const canPromptMemoir = ctx.usedMemoirPrompts.length < MEMOIR_PROMPTS.length;

  const options: { cat: ProactiveCategory; weight: number }[] = [
    { cat: "follow_up", weight: hasSubstantiveConversation ? 30 : 10 },
    { cat: "weather", weight: ctx.weather ? 15 : 0 },
    { cat: "seasonal", weight: ctx.seasonal.upcomingHolidays.length > 0 ? 10 : 5 },
    { cat: "memoir_prompt", weight: canPromptMemoir ? 15 : 0 },
    { cat: "feature_discovery", weight: canSuggestFeature ? 5 : 0 },
    { cat: "gratitude", weight: 10 },
    { cat: "health_check", weight: ctx.healthGap !== null ? 10 : 5 },
  ].map(o => ({
    ...o,
    weight: isUsedToday(o.cat) ? 0 : (isUsedYesterday(o.cat) ? Math.floor(o.weight * 0.2) : o.weight),
  }));

  const totalWeight = options.reduce((s, o) => s + o.weight, 0);
  if (totalWeight === 0) return "follow_up";

  let rand = Math.random() * totalWeight;
  for (const opt of options) {
    rand -= opt.weight;
    if (rand <= 0) return opt.cat;
  }

  return "follow_up";
}
