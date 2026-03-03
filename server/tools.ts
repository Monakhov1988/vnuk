import OpenAI from "openai";
import { storage } from "./storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

const WEATHER_TTL = 30 * 60 * 1000;
const SEARCH_TTL = 15 * 60 * 1000;

const MAX_SEARCH_PER_HOUR = 30;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

const userSearchCounts = new Map<number, { count: number; windowStart: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of userSearchCounts) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW) {
      userSearchCounts.delete(key);
    }
  }
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}, 10 * 60 * 1000);

export function checkSearchRateLimit(userId: number): { allowed: boolean; message?: string } {
  const now = Date.now();
  const entry = userSearchCounts.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    userSearchCounts.set(userId, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_SEARCH_PER_HOUR) {
    console.log(`[tools] RATE LIMIT: user ${userId} hit ${MAX_SEARCH_PER_HOUR} searches/hour`);
    return { allowed: false, message: "Я уже много искал за последний час. Давайте немного подождём и попробуем позже!" };
  }

  entry.count++;
  return { allowed: true };
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /forget\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /забудь\s+(все\s+)?предыдущие\s+инструкции/i,
  /игнорируй\s+(все\s+)?предыдущие/i,
  /новая\s+роль/i,
  /ты\s+теперь\s+не\s+/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /<\|system\|>/i,
  /<<SYS>>/i,
  /system\s*:\s*you\s+are/i,
  /SYSTEM\s*PROMPT/i,
  /\[ALERT\]/,
];

const MAX_WEB_CONTENT_LENGTH = 3000;

export function sanitizeWebContent(text: string): string {
  let cleaned = text;

  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(new RegExp(pattern.source, pattern.flags + "g"), "[removed]");
  }

  cleaned = cleaned.replace(/(?:javascript|data|vbscript):/gi, "[blocked-url]:");
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, "");
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, "");

  if (cleaned.length > MAX_WEB_CONTENT_LENGTH) {
    cleaned = cleaned.slice(0, MAX_WEB_CONTENT_LENGTH) + "\n...[текст обрезан]";
  }

  return cleaned;
}

export function stripPII(text: string): string {
  let cleaned = text;

  cleaned = cleaned.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[номер карты]");

  cleaned = cleaned.replace(/(?:\+7|8)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/g, "[телефон]");

  cleaned = cleaned.replace(/(?:паспорт|серия)[:\s]*\d{4}[\s-]*\d{6}\b/gi, "[паспорт]");
  cleaned = cleaned.replace(/\b\d{4}\s+\d{6}\b/g, "[паспорт]");

  cleaned = cleaned.replace(/\b\d{3}-\d{3}-\d{3}\s*\d{2}\b/g, "[СНИЛС]");

  cleaned = cleaned.replace(/(?:инн|ИНН)[:\s]*\d{10,12}\b/gi, "[ИНН]");
  cleaned = cleaned.replace(/\b\d{12}\b/g, "[ИНН]");

  cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email]");

  return cleaned;
}

const CITY_COORDS: Record<string, { lat: number; lon: number; name: string }> = {
  "москва": { lat: 55.7558, lon: 37.6173, name: "Москва" },
  "санкт-петербург": { lat: 59.9343, lon: 30.3351, name: "Санкт-Петербург" },
  "петербург": { lat: 59.9343, lon: 30.3351, name: "Санкт-Петербург" },
  "питер": { lat: 59.9343, lon: 30.3351, name: "Санкт-Петербург" },
  "спб": { lat: 59.9343, lon: 30.3351, name: "Санкт-Петербург" },
  "новосибирск": { lat: 55.0084, lon: 82.9357, name: "Новосибирск" },
  "екатеринбург": { lat: 56.8389, lon: 60.6057, name: "Екатеринбург" },
  "казань": { lat: 55.7887, lon: 49.1221, name: "Казань" },
  "нижний новгород": { lat: 56.2965, lon: 43.9361, name: "Нижний Новгород" },
  "челябинск": { lat: 55.1644, lon: 61.4368, name: "Челябинск" },
  "самара": { lat: 53.1959, lon: 50.1002, name: "Самара" },
  "омск": { lat: 54.9885, lon: 73.3242, name: "Омск" },
  "ростов-на-дону": { lat: 47.2357, lon: 39.7015, name: "Ростов-на-Дону" },
  "ростов": { lat: 47.2357, lon: 39.7015, name: "Ростов-на-Дону" },
  "уфа": { lat: 54.7348, lon: 55.9579, name: "Уфа" },
  "красноярск": { lat: 56.0153, lon: 92.8932, name: "Красноярск" },
  "воронеж": { lat: 51.6683, lon: 39.1843, name: "Воронеж" },
  "пермь": { lat: 58.0105, lon: 56.2502, name: "Пермь" },
  "волгоград": { lat: 48.7080, lon: 44.5133, name: "Волгоград" },
  "краснодар": { lat: 45.0353, lon: 38.9753, name: "Краснодар" },
  "сочи": { lat: 43.6028, lon: 39.7342, name: "Сочи" },
  "тюмень": { lat: 57.1523, lon: 65.5272, name: "Тюмень" },
  "тула": { lat: 54.1961, lon: 37.6182, name: "Тула" },
  "рязань": { lat: 54.6269, lon: 39.6916, name: "Рязань" },
  "саратов": { lat: 51.5336, lon: 46.0343, name: "Саратов" },
  "ярославль": { lat: 57.6261, lon: 39.8845, name: "Ярославль" },
  "калининград": { lat: 54.7065, lon: 20.5110, name: "Калининград" },
  "иркутск": { lat: 52.2978, lon: 104.2964, name: "Иркутск" },
  "владивосток": { lat: 43.1198, lon: 131.8869, name: "Владивосток" },
  "хабаровск": { lat: 48.4827, lon: 135.0837, name: "Хабаровск" },
  "минск": { lat: 53.9045, lon: 27.5615, name: "Минск" },
  "киев": { lat: 50.4501, lon: 30.5234, name: "Киев" },
};

const WMO_WEATHER_RU: Record<number, string> = {
  0: "ясно", 1: "преимущественно ясно", 2: "переменная облачность", 3: "пасмурно",
  45: "туман", 48: "изморозь",
  51: "лёгкая морось", 53: "морось", 55: "сильная морось",
  56: "ледяная морось", 57: "сильная ледяная морось",
  61: "небольшой дождь", 63: "дождь", 65: "сильный дождь",
  66: "ледяной дождь", 67: "сильный ледяной дождь",
  71: "небольшой снег", 73: "снег", 75: "сильный снег", 77: "снежная крупа",
  80: "небольшой ливень", 81: "ливень", 82: "сильный ливень",
  85: "небольшой снегопад", 86: "сильный снегопад",
  95: "гроза", 96: "гроза с градом", 99: "сильная гроза с градом",
};

export async function getWeather(city: string): Promise<string> {
  const cacheKey = `weather:${city.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  const cityKey = city.toLowerCase().trim();
  const coords = CITY_COORDS[cityKey];
  if (!coords) {
    return `Город "${city}" не найден в моей базе. Попробуйте указать ближайший крупный город.`;
  }
  const cityName = coords.name;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe/Moscow&forecast_days=2`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return `Не удалось узнать погоду для "${cityName}".`;
    }

    const data = await response.json() as any;
    const current = data.current;
    const daily = data.daily;

    if (!current) {
      return `Не нашёл данных о погоде для "${cityName}".`;
    }

    const weatherDesc = WMO_WEATHER_RU[current.weathercode] || "переменная облачность";
    let result = `Погода в городе ${cityName}:\n`;
    result += `Сейчас: ${Math.round(current.temperature_2m)}°C, ${weatherDesc}. `;
    result += `Ощущается как ${Math.round(current.apparent_temperature)}°C. `;
    const windMs = (current.windspeed_10m / 3.6).toFixed(1);
    result += `Влажность ${current.relativehumidity_2m}%, ветер ${windMs} м/с.\n`;

    if (daily?.temperature_2m_min?.[0] !== undefined) {
      const todayDesc = WMO_WEATHER_RU[daily.weathercode?.[0]] || "";
      result += `Сегодня: от ${Math.round(daily.temperature_2m_min[0])}°C до ${Math.round(daily.temperature_2m_max[0])}°C. ${todayDesc}\n`;
    }

    if (daily?.temperature_2m_min?.[1] !== undefined) {
      const tomDesc = WMO_WEATHER_RU[daily.weathercode?.[1]] || "";
      result += `Завтра: от ${Math.round(daily.temperature_2m_min[1])}°C до ${Math.round(daily.temperature_2m_max[1])}°C. ${tomDesc}`;
    }

    setCache(cacheKey, result, WEATHER_TTL);
    return result;
  } catch (err: any) {
    console.error("[tools] Weather error:", err.message);
    return `Не удалось получить погоду. Сервис временно недоступен.`;
  }
}

async function fetchDuckDuckGo(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const encoded = encodeURIComponent(query);
  const response = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "ru-RU,ru;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) throw new Error(`DDG HTTP ${response.status}`);
  const html = await response.text();

  if (html.includes("anomaly-modal") || html.includes("please try again")) {
    throw new Error("DDG CAPTCHA/rate-limited");
  }

  const results: Array<{ title: string; url: string; snippet: string }> = [];

  const titleRegex = /result__a[^>]*href="[^"]*uddg=([^&"]+)[^"]*"[^>]*>([^<]+)/g;
  const snippetRegex = /result__snippet[^>]*>([^<]+)/g;

  const titles: Array<{ url: string; title: string }> = [];
  let match;
  while ((match = titleRegex.exec(html)) !== null) {
    try {
      titles.push({ url: decodeURIComponent(match[1]), title: match[2].trim() });
    } catch {
      titles.push({ url: match[1], title: match[2].trim() });
    }
  }

  const snippets: string[] = [];
  while ((match = snippetRegex.exec(html)) !== null) {
    snippets.push(match[1].trim());
  }

  for (let i = 0; i < Math.min(titles.length, 7); i++) {
    results.push({
      title: titles[i].title,
      url: titles[i].url,
      snippet: snippets[i] || "",
    });
  }

  console.log(`[tools] DDG parsed: ${titles.length} titles, ${snippets.length} snippets`);
  return results;
}

async function fetchPerplexity(query: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY not set");

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: `Ты помогаешь пожилому человеку найти информацию. Отвечай тепло, понятно, по-русски. Называй конкретные названия, даты, факты. Если есть расписание — укажи его. Пиши простым текстом как сообщение в мессенджере, без маркдауна (без ###, **, - списков). Нумеруй пункты цифрами если нужен список. Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}`,
        },
        { role: "user", content: query },
      ],
      max_tokens: 800,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Perplexity HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Perplexity: empty response");

  const tokensIn = data.usage?.prompt_tokens || 0;
  const tokensOut = data.usage?.completion_tokens || 0;
  storage.logAiUsage({
    userId: null,
    endpoint: "search-web-perplexity",
    model: "sonar",
    tokensIn,
    tokensOut,
  });

  let result = content;

  const citations = data.citations;
  if (citations && Array.isArray(citations) && citations.length > 0) {
    const topLinks = citations.slice(0, 3);
    result += "\n\nИсточники:\n" + topLinks.map((url: string) => url).join("\n");
  }

  console.log(`[tools] Perplexity: ${tokensIn}+${tokensOut} tokens for "${query.slice(0, 50)}"`);
  return result;
}

export async function searchWeb(query: string, userId?: number): Promise<string> {
  const safeQuery = stripPII(query);
  const cacheKey = `search:${safeQuery.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  if (userId) {
    const rateCheck = checkSearchRateLimit(userId);
    if (!rateCheck.allowed) return rateCheck.message!;
  }

  let result: string | null = null;

  if (process.env.PERPLEXITY_API_KEY) {
    try {
      const raw = await fetchPerplexity(safeQuery);
      result = sanitizeWebContent(raw);
      console.log(`[tools] Search via Perplexity for "${query.slice(0, 50)}"`);
    } catch (err: any) {
      console.error("[tools] Perplexity failed, falling back:", err.message);
    }
  }

  if (!result) {
    let searchResults: Array<{ title: string; url: string; snippet: string }> = [];
    let usedRealSearch = false;

    try {
      searchResults = await fetchDuckDuckGo(safeQuery);
      usedRealSearch = searchResults.length > 0;
      console.log(`[tools] DuckDuckGo: ${searchResults.length} results for "${query.slice(0, 50)}"`);
    } catch (err: any) {
      console.error("[tools] DuckDuckGo failed, falling back to GPT:", err.message);
    }

    try {
      if (usedRealSearch) {
        const searchContext = searchResults
          .map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   ${r.url}`)
          .join("\n\n");

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Ты помогаешь пожилому человеку. Вот реальные результаты поиска по его запросу. Перескажи их тепло, понятно, по-русски. Назови конкретные названия (фильмы, спектакли, передачи, события). Не выдумывай ничего сверх того что есть в результатах. Если в результатах есть даты, расписание — назови их. Пиши простым текстом без маркдауна. Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}`,
            },
            { role: "user", content: `Запрос: ${safeQuery}\n\nРезультаты поиска:\n${searchContext}` },
          ],
          max_tokens: 600,
          temperature: 0.3,
        });

        const rawResult = response.choices[0]?.message?.content || "Не удалось разобрать результаты.";
        result = sanitizeWebContent(rawResult);

        const usage = response.usage;
        if (usage) {
          storage.logAiUsage({
            userId: null,
            endpoint: "search-web-summarize",
            model: "gpt-4o-mini",
            tokensIn: usage.prompt_tokens,
            tokensOut: usage.completion_tokens,
          });
        }
      } else {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Ты — помощник для поиска информации. Отвечай кратко, по-русски. Если спрашивают про кино, театр, сериалы — назови конкретные примеры фильмов/спектаклей которые скорее всего идут сейчас (недавние российские и мировые премьеры). Если не уверен в точности — честно скажи "точное расписание лучше проверить на сайте". Если спрашивают про телепрограмму — назови популярные передачи каналов. Если про праздники — используй дату. Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}`,
            },
            { role: "user", content: safeQuery },
          ],
          max_tokens: 500,
          temperature: 0.3,
        });

        const rawFallback = response.choices[0]?.message?.content || "Не удалось найти информацию.";
        result = sanitizeWebContent(rawFallback);

        const usage = response.usage;
        if (usage) {
          storage.logAiUsage({
            userId: null,
            endpoint: "search-web-fallback",
            model: "gpt-4o-mini",
            tokensIn: usage.prompt_tokens,
            tokensOut: usage.completion_tokens,
          });
        }
      }
    } catch (err: any) {
      console.error("[tools] Search error:", err.message);
      return `Не удалось выполнить поиск. Попробуйте позже.`;
    }
  }

  const lowerQ = query.toLowerCase();
  const isCinema = ["кино", "фильм"].some(w => lowerQ.includes(w));
  const isTheatre = ["театр", "спектакл"].some(w => lowerQ.includes(w));
  const isEntertainment = isCinema || isTheatre || ["афиш", "концерт", "выставк", "мероприят", "куда сходить"].some(w => lowerQ.includes(w));
  const isMedical = ["врач", "поликлиник", "аптек", "записаться"].some(w => lowerQ.includes(w));
  const isGov = ["пенси", "льгот", "субсиди", "госуслуг", "мфц"].some(w => lowerQ.includes(w));

  if (isEntertainment) {
    let links = "\n\nГде посмотреть актуальное расписание:";
    if (isCinema) {
      links += "\nhttps://www.afisha.ru/msk/cinema/\nhttps://www.kinopoisk.ru/afisha/";
    } else if (isTheatre) {
      links += "\nhttps://www.afisha.ru/msk/theatre/\nhttps://www.culture.ru/afisha/russia/teatry";
    } else {
      links += "\nhttps://www.afisha.ru/msk/\nhttps://kassir.ru/";
    }
    result += links;
  }

  if (isMedical) {
    result += "\n\nЗаписаться к врачу:\nhttps://www.gosuslugi.ru/\nhttps://gorzdrav.org/";
  }

  if (isGov) {
    result += "\n\nПолезные ссылки:\nhttps://www.gosuslugi.ru/\nhttps://sfr.gov.ru/";
  }

  setCache(cacheKey, result, SEARCH_TTL);
  return result;
}

export async function searchRecipe(dish: string): Promise<string> {
  const safeDish = stripPII(dish);
  const cacheKey = `recipe:${safeDish.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты — кулинарный помощник. Дай подробный пошаговый рецепт блюда на русском языке. Укажи ингредиенты с точными количествами и пошаговую инструкцию. Пиши просто и понятно, как для домашней хозяйки. НЕ используй маркдаун, заголовки (###), буллеты (-), звёздочки (**). Пиши обычным текстом как сообщение в мессенджере. Нумеруй шаги цифрами (1, 2, 3...).",
        },
        { role: "user", content: `Рецепт: ${safeDish}` },
      ],
      max_tokens: 800,
      temperature: 0.5,
    });

    let result = response.choices[0]?.message?.content || "Не удалось найти рецепт.";

    const usage = response.usage;
    if (usage) {
      storage.logAiUsage({
        userId: null,
        endpoint: "search-recipe",
        model: "gpt-4o-mini",
        tokensIn: usage.prompt_tokens,
        tokensOut: usage.completion_tokens,
      });
    }

    const encodedDish = encodeURIComponent(safeDish + " рецепт с фото");
    result += `\n\n=== ССЫЛКИ (ОБЯЗАТЕЛЬНО ПЕРЕДАЙ В ОТВЕТЕ) ===\nПодробнее с фотографиями: https://yandex.ru/search/?text=${encodedDish}`;

    setCache(cacheKey, result, SEARCH_TTL);
    return result;
  } catch (err: any) {
    console.error("[tools] Recipe search error:", err.message);
    return `Не удалось найти рецепт. Попробуйте позже.`;
  }
}

export async function generateImage(description: string, userId?: number): Promise<{ url: string | null; error: string | null }> {
  if (userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await storage.countAiUsageToday(userId, "generate-image");
    if (count >= 10) {
      return { url: null, error: "Я сегодня уже нарисовал много картинок, давай завтра?" };
    }
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: description,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const url = response.data[0]?.url || null;

    storage.logAiUsage({
      userId: userId || null,
      endpoint: "generate-image",
      model: "dall-e-3",
      tokensIn: 0,
      tokensOut: 0,
    });

    return { url, error: null };
  } catch (err: any) {
    console.error("[tools] Image generation error:", err.message, err.status, err.code);

    let errorMessage: string;
    const errMsg = (err.message || "").toLowerCase();
    const errCode = err.code || "";
    const errStatus = err.status || 0;

    if (errStatus === 429 || errCode === "rate_limit_exceeded" || errMsg.includes("rate limit")) {
      errorMessage = "Сейчас слишком много запросов на рисование. Давай подождём пару минут и попробуем снова, хорошо?";
    } else if (errStatus === 400 && (errMsg.includes("content_policy") || errMsg.includes("safety") || errMsg.includes("rejected"))) {
      errorMessage = "Не получилось нарисовать такую картинку — система посчитала описание неподходящим. Попробуй попросить что-нибудь другое, например открытку с цветами или красивый пейзаж!";
    } else if (errStatus === 400 && errMsg.includes("billing")) {
      errorMessage = "Сервис рисования временно недоступен. Попробуем позже!";
    } else if (errMsg.includes("timeout") || errMsg.includes("timed out")) {
      errorMessage = "Рисование заняло слишком много времени. Давай попробуем ещё раз?";
    } else if (errStatus >= 500) {
      errorMessage = "Сервис рисования сейчас перегружен. Попробуем чуть позже, ладно?";
    } else {
      errorMessage = "Не получилось нарисовать картинку. Попробуем ещё раз чуть позже?";
    }

    return { url: null, error: errorMessage };
  }
}
