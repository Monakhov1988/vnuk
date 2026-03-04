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
const EVENT_TTL = 10 * 60 * 1000;
const TRANSPORT_TTL = 10 * 60 * 1000;
const TV_TTL = 30 * 60 * 1000;
const CLINIC_TTL = 30 * 60 * 1000;
const PLACE_TTL = 30 * 60 * 1000;
const PRODUCT_TTL = 15 * 60 * 1000;
const RECIPE_TTL = 60 * 60 * 1000;
const MEDICINE_TTL = 60 * 60 * 1000;
const GOV_TTL = 60 * 60 * 1000;
const GARDEN_TTL = 60 * 60 * 1000;
const MOVIE_TTL = 60 * 60 * 1000;

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
  let coords = CITY_COORDS[cityKey];
  let cityName = coords?.name;
  let timezone = "Europe/Moscow";

  if (!coords) {
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru`;
      const geoResponse = await fetch(geoUrl, { signal: AbortSignal.timeout(5000) });
      if (geoResponse.ok) {
        const geoData = await geoResponse.json() as any;
        if (geoData.results && geoData.results.length > 0) {
          const result = geoData.results[0];
          coords = { lat: result.latitude, lon: result.longitude, name: result.name || city };
          cityName = result.name || city;
          timezone = result.timezone || "Europe/Moscow";
        }
      }
    } catch (e) {
      console.error("[weather] Geocoding error:", e);
    }
  }

  if (!coords) {
    return `Город "${city}" не найден. Попробуйте написать название по-другому или указать ближайший крупный город.`;
  }
  if (!cityName) cityName = coords.name;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=${encodeURIComponent(timezone)}&forecast_days=2`;
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

function getPerplexityContextHint(query: string): string {
  const lower = query.toLowerCase();
  if (/(?:афиш|концерт|спектакль|выставк|фестиваль|мероприяти|куда сходить|куда пойти|билет на |расписание сеансов)/.test(lower)) {
    return ` Это запрос про мероприятия/афишу. Ищи на kassir.ru, afisha.ru, culture.ru. Предупреди что даты могут меняться. Давай ссылки на покупку билетов. Указывай адрес площадки.`;
  }
  if (/(?:стих|поэзи|поэт|поэма|стихотворени|басн[яеи]|молитв|псалом|акафист|отче наш|символ веры|тропарь|песн[яеи]|текст песни|слова песни)/.test(lower)) {
    return ` Это запрос про литературный/религиозный текст. Копируй текст ТОЧНО как в оригинале — не пересказывай, не интерпретируй, не сокращай. Читатель знает наизусть и заметит ошибку.`;
  }
  if (/(?:новост|что случилось|что произошло|последние событи)/.test(lower)) {
    return ` Это запрос про новости. Указывай дату публикации каждой новости. Только проверенные источники.`;
  }
  return "";
}

async function fetchPerplexity(query: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY not set");

  const contextHint = getPerplexityContextHint(query);

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
          content: `Ты помогаешь пожилому человеку (55-75 лет) найти информацию. Отвечай тепло, понятно, по-русски. Называй конкретные названия, даты, факты. Если есть расписание — укажи его. Пиши простым текстом как сообщение в мессенджере, без маркдауна (без ###, **, - списков). Нумеруй пункты цифрами если нужен список. Преобразуй результаты поиска в простую форму. Избегай профессионального IT-жаргона: не используй слова вроде «дедлайн», «фидбэк», «апдейт», «интерфейс», «таймлайн», «воркфлоу». Общеупотребительные слова (онлайн, кэшбэк, QR-код, приложение) — оставляй как есть. Если используешь слово, которое может быть незнакомо пожилому человеку — поясни его в скобках, но не заменяй. ВАЖНО: передавай только найденную информацию. Если точных данных нет — напиши «информация не найдена». Не придумывай события, места, названия, цены, расписания, адреса, телефоны. Лучше сказать «не нашёл» чем выдумать.${contextHint} Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}`,
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

  const isEventQuery = /(?:афиш|концерт|спектакл|выставк|мероприят|куда сходить|расписание сеансов|премьер|фестиваль|билет на )/.test(lowerQ);
  const ttl = isEventQuery ? EVENT_TTL : SEARCH_TTL;
  setCache(cacheKey, result, ttl);
  return result;
}

export async function searchRecipe(dish: string, userId?: number): Promise<string> {
  const safeDish = stripPII(dish);
  const cacheKey = `recipe:${safeDish.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  if (userId) {
    const rateCheck = checkSearchRateLimit(userId);
    if (!rateCheck.allowed) return rateCheck.message!;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (apiKey) {
    try {
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
              content: `Ты помогаешь найти проверенный рецепт блюда. Ищи на кулинарных сайтах: povar.ru, eda.ru, russianfood.com, gastronom.ru. Выведи:
1. Ингредиенты с точными количествами
2. Пошаговую инструкцию приготовления
3. Время приготовления
4. Количество порций
5. Калорийность (если есть на сайте-источнике)
6. Источник рецепта (название сайта)

СТРОГИЕ ПРАВИЛА:
- Используй ТОЛЬКО реальные рецепты с кулинарных сайтов. НЕ выдумывай пропорции и ингредиенты.
- Указывай точные количества: граммы, миллилитры, штуки, столовые/чайные ложки.
- Если блюдо незнакомое или не найдено — напиши: «Не нашёл такой рецепт. Уточните название блюда.»
- Пиши простым текстом без маркдауна, как опытная хозяйка рассказывает рецепт. Нумеруй шаги цифрами.`,
            },
            { role: "user", content: `Рецепт: ${safeDish}` },
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
        userId: userId || null,
        endpoint: "search-recipe-perplexity",
        model: "sonar",
        tokensIn,
        tokensOut,
      });

      let result = sanitizeWebContent(content);
      const encodedDish = encodeURIComponent(safeDish + " рецепт с фото");
      result += `\n\nЕщё рецепты с фотографиями:\nhttps://www.povarenok.ru/search/name/${encodeURIComponent(safeDish)}/\nhttps://eda.ru/search?q=${encodeURIComponent(safeDish)}`;

      console.log(`[tools] Recipe search (Perplexity): ${tokensIn}+${tokensOut} tokens for "${dish.slice(0, 50)}"`);
      setCache(cacheKey, result, RECIPE_TTL);
      return result;
    } catch (err: any) {
      console.error("[tools] Recipe Perplexity error, falling back to GPT:", err.message);
    }
  }

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
        userId: userId || null,
        endpoint: "search-recipe-gpt-fallback",
        model: "gpt-4o-mini",
        tokensIn: usage.prompt_tokens,
        tokensOut: usage.completion_tokens,
      });
    }

    const encodedDish = encodeURIComponent(safeDish + " рецепт с фото");
    result += `\n\n=== ССЫЛКИ (ОБЯЗАТЕЛЬНО ПЕРЕДАЙ В ОТВЕТЕ) ===\nПодробнее с фотографиями: https://yandex.ru/search/?text=${encodedDish}`;

    setCache(cacheKey, result, RECIPE_TTL);
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
    let safePrompt = description
      .replace(/\b(with text|saying|written|inscription|caption|typography|letters|words|writing|надпись|текст|буквы|слова|banner|poster|sign|placard)\b/gi, "")
      .replace(/["«»].*?["«»]/g, "")
      .replace(/\b(Happy|Merry|Congratulations|International|Women'?s\s*Day|Mother'?s\s*Day|Father'?s\s*Day|Valentine'?s|New\s*Year|Christmas|Birthday|Holiday|Anniversary|Easter|March\s*8|8\s*March)\b/gi, "")
      .replace(/\b(greeting\s*card|post\s*card|postcard)\b/gi, "floral illustration")
      .replace(/\bcard\b/gi, "illustration")
      .replace(/\s{2,}/g, " ")
      .trim();

    const isPhotoStyle = /\b(photo|photograph|realistic|food|dish|блюд|фот)/i.test(safePrompt);
    const prefix = isPhotoStyle
      ? "Photorealistic image without any text, letters, numbers, words, or typography."
      : "Digital painting without any text, letters, numbers, words, or typography.";
    safePrompt = `${prefix} ${safePrompt}. The image must contain absolutely zero text, zero letters, zero inscriptions, zero banners, zero ribbons with writing. Pure visual artwork only.`;

    console.log(`[tools] DALL-E sanitized prompt: "${safePrompt.slice(0, 120)}..."`);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: safePrompt,
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

export async function searchMovie(query: string, userId?: number): Promise<string> {
  const safeQuery = stripPII(query);
  const cacheKey = `movie:${safeQuery.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  if (userId) {
    const rateCheck = checkSearchRateLimit(userId);
    if (!rateCheck.allowed) return rateCheck.message!;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return "Сервис поиска фильмов временно недоступен.";

  try {
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
            content: `Ты помогаешь пожилому человеку найти информацию о фильме или сериале. Ищи данные ТОЛЬКО на Кинопоиске (kinopoisk.ru). Выведи:
1. Полное название фильма (и оригинальное если есть)
2. Год выпуска, жанр, страна, режиссёр
3. Оценка на Кинопоиске (число из 10) и количество оценок
4. Краткое описание сюжета (2-3 предложения)
5. Что пишут в отзывах — основные плюсы и минусы по мнению зрителей

СТРОГИЕ ПРАВИЛА:
- Используй ТОЛЬКО реальные данные с Кинопоиска. НЕ выдумывай оценки, количество отзывов, имена актёров.
- Если фильм не найден на Кинопоиске — напиши: «Не нашёл этот фильм на Кинопоиске.»
- Если не уверен в точной оценке — напиши: «Точную оценку лучше проверить на Кинопоиске.»
- Пиши простым текстом без маркдауна. Нумеруй пункты цифрами.
- Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}`,
          },
          { role: "user", content: `Найди на Кинопоиске: ${safeQuery}` },
        ],
        max_tokens: 800,
        temperature: 0.2,
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
      userId: userId || null,
      endpoint: "search-movie-perplexity",
      model: "sonar",
      tokensIn,
      tokensOut,
    });

    let result = sanitizeWebContent(content);

    const encodedQuery = encodeURIComponent(safeQuery);
    result += `\n\nПодробнее на Кинопоиске:\nhttps://www.kinopoisk.ru/index.php?kp_query=${encodedQuery}`;

    console.log(`[tools] Movie search: ${tokensIn}+${tokensOut} tokens for "${query.slice(0, 50)}"`);
    setCache(cacheKey, result, MOVIE_TTL);
    return result;
  } catch (err: any) {
    console.error("[tools] Movie search error:", err.message);
    return "Не удалось найти информацию о фильме. Попробуйте позже.";
  }
}

export async function searchPlace(query: string, city?: string, userId?: number): Promise<string> {
  const safeQuery = stripPII(query);
  const safeCity = city ? stripPII(city) : "";
  const fullQuery = safeCity ? `${safeQuery} ${safeCity}` : safeQuery;
  const cacheKey = `place:${fullQuery.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  if (userId) {
    const rateCheck = checkSearchRateLimit(userId);
    if (!rateCheck.allowed) return rateCheck.message!;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return "Сервис поиска заведений временно недоступен.";

  try {
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
            content: `Ты помогаешь пожилому человеку найти информацию о заведении или сервисе. Ищи данные на Яндекс.Картах (yandex.ru/maps). Выведи:
1. Полное название заведения
2. Адрес
3. Оценка (из 5) и количество отзывов
4. Режим работы (если есть)
5. Что пишут в отзывах — основные плюсы и минусы по мнению посетителей
6. Контактный телефон (если есть)

СТРОГИЕ ПРАВИЛА:
- Используй ТОЛЬКО реальные данные с Яндекс.Карт. НЕ выдумывай оценки, адреса, телефоны, отзывы.
- Если заведение не найдено на Яндекс.Картах — напиши: «Не нашёл это заведение на Яндекс.Картах. Попробуйте уточнить название или город.»
- Если не уверен в данных — напиши: «Точную информацию лучше проверить на Яндекс.Картах.»
- Если запрос общий (например «хороший ресторан в Москве») — предложи 2-3 варианта с оценками с Яндекс.Карт.
- Пиши простым текстом без маркдауна. Нумеруй пункты цифрами.
- Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}`,
          },
          { role: "user", content: `Найди на Яндекс.Картах: ${fullQuery}` },
        ],
        max_tokens: 800,
        temperature: 0.2,
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
      userId: userId || null,
      endpoint: "search-place-perplexity",
      model: "sonar",
      tokensIn,
      tokensOut,
    });

    let result = sanitizeWebContent(content);

    const encodedQuery = encodeURIComponent(fullQuery);
    result += `\n\nПосмотреть на Яндекс.Картах:\nhttps://yandex.ru/maps/?text=${encodedQuery}`;

    console.log(`[tools] Place search: ${tokensIn}+${tokensOut} tokens for "${query.slice(0, 50)}"`);
    setCache(cacheKey, result, PLACE_TTL);
    return result;
  } catch (err: any) {
    console.error("[tools] Place search error:", err.message);
    return "Не удалось найти информацию о заведении. Попробуйте позже.";
  }
}

export async function searchTransport(from: string, to: string, date?: string, transportType?: string, userId?: number): Promise<string> {
  const safeFrom = stripPII(from);
  const safeTo = stripPII(to);
  const typeLabel = transportType || "поезд или автобус";
  const dateLabel = date || "ближайшие дни";
  const cacheKey = `transport:${safeFrom}:${safeTo}:${dateLabel}:${typeLabel}`.toLowerCase();
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  if (userId) {
    const rateCheck = checkSearchRateLimit(userId);
    if (!rateCheck.allowed) return rateCheck.message!;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return "Сервис поиска расписания временно недоступен.";

  try {
    const dateInstruction = date
      ? `Ищи рейсы на конкретную дату: ${date}.`
      : `Ищи ближайшие рейсы. Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}.`;

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
            content: `Ты помогаешь найти расписание транспорта в России. Пассажир — пожилой человек. Ищи данные на сайтах: РЖД (rzd.ru), Яндекс.Расписания (rasp.yandex.ru), Туту.ру (tutu.ru), автовокзалы. Выведи:
1. Доступные рейсы (${typeLabel}) из ${safeFrom} в ${safeTo}
2. Время отправления и прибытия
3. Время в пути
4. Ориентировочная стоимость билета (плацкарт/купе для поездов, стандарт для автобусов)
5. Номер поезда/рейса (если есть)

${dateInstruction}

СТРОГИЕ ПРАВИЛА:
- Используй ТОЛЬКО реальные данные из расписаний. НЕ выдумывай рейсы, время, цены.
- Если точное расписание не найдено — напиши: «Точное расписание лучше проверить на сайте» и дай ссылки.
- Если направление не обслуживается прямым рейсом — предложи варианты с пересадкой, если знаешь.
- Цены указывай как ориентировочные: «от ... руб» или «примерно ... руб».
- Рекомендуй нижние полки в поездах. Если есть скидки для пенсионеров — упомяни.
- Пиши простым текстом без маркдауна. Нумеруй рейсы цифрами.`,
          },
          { role: "user", content: `Расписание ${typeLabel} из ${safeFrom} в ${safeTo}${date ? ` на ${date}` : ""}` },
        ],
        max_tokens: 800,
        temperature: 0.2,
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
      userId: userId || null,
      endpoint: "search-transport-perplexity",
      model: "sonar",
      tokensIn,
      tokensOut,
    });

    let result = sanitizeWebContent(content);

    const encodedFrom = encodeURIComponent(safeFrom);
    const encodedTo = encodeURIComponent(safeTo);
    result += `\n\nГде купить билеты и проверить расписание:`;
    result += `\nhttps://rasp.yandex.ru/search/?fromName=${encodedFrom}&toName=${encodedTo}`;
    result += `\nhttps://www.tutu.ru/`;
    result += `\nhttps://www.rzd.ru/`;

    console.log(`[tools] Transport search: ${tokensIn}+${tokensOut} tokens for "${from} -> ${to}"`);
    setCache(cacheKey, result, TRANSPORT_TTL);
    return result;
  } catch (err: any) {
    console.error("[tools] Transport search error:", err.message);
    return "Не удалось найти расписание. Попробуйте позже.";
  }
}

export async function searchClinic(query: string, city?: string, userId?: number): Promise<string> {
  const safeQuery = stripPII(query);
  const safeCity = city ? stripPII(city) : "";
  const fullQuery = safeCity ? `${safeQuery} ${safeCity}` : safeQuery;
  const cacheKey = `clinic:${fullQuery.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  if (userId) {
    const rateCheck = checkSearchRateLimit(userId);
    if (!rateCheck.allowed) return rateCheck.message!;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return "Сервис поиска клиник временно недоступен.";

  try {
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
            content: `Ты помогаешь найти врача или клинику в России. Пациент — пожилой человек. Ищи данные на сайтах: ПроДокторов (prodoctorov.ru), ДокДок (docdoc.ru), СберЗдоровье (sberhealth.ru), Яндекс.Карты. Выведи:
1. Название клиники или ФИО врача
2. Специализация
3. Адрес
4. Рейтинг и количество отзывов
5. Стоимость первичного приёма
6. Что пишут пациенты — основные плюсы и минусы
7. Телефон или способ записи (если есть)

СТРОГИЕ ПРАВИЛА:
- Используй ТОЛЬКО реальные данные с медицинских сервисов. НЕ выдумывай врачей, клиники, цены, отзывы, адреса, телефоны.
- Если врач/клиника не найдены — напиши: «Не нашёл по этому запросу. Попробуйте уточнить специализацию или город.»
- Если запрос общий (например «хороший терапевт в Казани») — предложи 2-3 варианта с рейтингами.
- Если есть информация о доступности (лифт, пандус, 1 этаж) — укажи. Приоритет врачам с опытом работы с пожилыми пациентами.
- Всегда добавляй: «Для записи лучше позвонить в клинику или записаться через сайт.»
- Пиши простым текстом без маркдауна. Нумеруй пункты цифрами.
- Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}`,
          },
          { role: "user", content: `Найди врача или клинику: ${fullQuery}` },
        ],
        max_tokens: 800,
        temperature: 0.2,
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
      userId: userId || null,
      endpoint: "search-clinic-perplexity",
      model: "sonar",
      tokensIn,
      tokensOut,
    });

    let result = sanitizeWebContent(content);

    const encodedQuery = encodeURIComponent(fullQuery);
    result += `\n\nГде записаться и почитать отзывы:`;
    result += `\nhttps://prodoctorov.ru/search/?q=${encodedQuery}`;
    result += `\nhttps://docdoc.ru/`;
    result += `\nhttps://sberhealth.ru/`;
    result += `\nhttps://www.gosuslugi.ru/`;

    console.log(`[tools] Clinic search: ${tokensIn}+${tokensOut} tokens for "${query.slice(0, 50)}"`);
    setCache(cacheKey, result, CLINIC_TTL);
    return result;
  } catch (err: any) {
    console.error("[tools] Clinic search error:", err.message);
    return "Не удалось найти информацию о враче или клинике. Попробуйте позже.";
  }
}

export async function searchMedicine(query: string, userId?: number): Promise<string> {
  const safeQuery = stripPII(query);
  const cacheKey = `medicine:${safeQuery.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  if (userId) {
    const rateCheck = checkSearchRateLimit(userId);
    if (!rateCheck.allowed) return rateCheck.message!;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return "Сервис поиска лекарств временно недоступен.";

  try {
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
            content: `Ты помогаешь найти информацию о лекарственном препарате. Пациент — пожилой человек. Ищи данные на сайтах: Видаль (vidal.ru), РЛС (rlsnet.ru), Аптека.ру (apteka.ru). Выведи:
1. Полное торговое и международное непатентованное название
2. Для чего применяется (показания) — кратко, понятным языком
3. Основные побочные эффекты (самые частые)
4. Противопоказания (основные)
5. Особые указания для пожилых (сниженная дозировка, контроль почек/печени — если есть)
6. Аналоги (дженерики) — 2-3 варианта с примерными ценами
7. Ориентировочная цена в аптеках

СТРОГИЕ ПРАВИЛА:
- Используй ТОЛЬКО реальные данные из справочников лекарств. НЕ выдумывай названия, показания, побочки, цены.
- Если препарат не найден — напиши: «Не нашёл такой препарат. Проверьте название или спросите у фармацевта.»
- ОБЯЗАТЕЛЬНО добавляй: «Перед приёмом любого лекарства проконсультируйтесь с врачом. Не меняйте дозировку самостоятельно.»
- Предупреди о рисках взаимодействия с частыми лекарствами пожилых (от давления, для сердца, кроверазжижающие — варфарин, аспирин).
- НЕ рекомендуй конкретные лекарства. НЕ предлагай замену назначенного врачом препарата.
- Пиши простым текстом без маркдауна. Нумеруй пункты цифрами.`,
          },
          { role: "user", content: `Информация о лекарстве: ${safeQuery}` },
        ],
        max_tokens: 800,
        temperature: 0.2,
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
      userId: userId || null,
      endpoint: "search-medicine-perplexity",
      model: "sonar",
      tokensIn,
      tokensOut,
    });

    let result = sanitizeWebContent(content);
    const encodedQuery = encodeURIComponent(safeQuery);
    result += `\n\nПодробная инструкция и цены:\nhttps://www.vidal.ru/search?t=all&q=${encodedQuery}\nhttps://apteka.ru/search/?q=${encodedQuery}`;

    console.log(`[tools] Medicine search: ${tokensIn}+${tokensOut} tokens for "${query.slice(0, 50)}"`);
    setCache(cacheKey, result, MEDICINE_TTL);
    return result;
  } catch (err: any) {
    console.error("[tools] Medicine search error:", err.message);
    return "Не удалось найти информацию о лекарстве. Попробуйте позже.";
  }
}

export async function searchTV(channel?: string, date?: string, userId?: number): Promise<string> {
  const dateLabel = date || "сегодня";
  const channelLabel = channel || "основные каналы";
  const cacheKey = `tv:${channelLabel}:${dateLabel}`.toLowerCase();
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  if (userId) {
    const rateCheck = checkSearchRateLimit(userId);
    if (!rateCheck.allowed) return rateCheck.message!;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return "Сервис телепрограммы временно недоступен.";

  try {
    const channelInstruction = channel
      ? `Покажи программу канала «${channel}» на ${dateLabel}.`
      : `Покажи программу основных каналов (Первый, Россия 1, НТВ, Культура, ТВ Центр) на ${dateLabel}. По каждому каналу — 5-7 основных передач.`;

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
            content: `Ты помогаешь пожилому человеку узнать телепрограмму. Ищи данные на сайтах: tv.yandex.ru, teleprogramma.pro, tv.mail.ru. ${channelInstruction}

Для каждой передачи укажи:
- Время начала
- Название передачи
- Жанр или краткое описание (для фильмов — кратко о чём)

СТРОГИЕ ПРАВИЛА:
- Используй ТОЛЬКО реальные данные из телепрограммы. НЕ выдумывай передачи, время, каналы.
- Если программа на указанную дату не найдена — напиши: «Точную программу лучше посмотреть на сайте» и дай ссылку.
- Выделяй вечерние фильмы и популярные передачи (Время, Пусть говорят, Поле чудес и т.д.)
- Пиши простым текстом без маркдауна. Нумеруй передачи по времени.
- Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}`,
          },
          { role: "user", content: `Телепрограмма ${channelLabel} на ${dateLabel}` },
        ],
        max_tokens: 1000,
        temperature: 0.2,
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
      userId: userId || null,
      endpoint: "search-tv-perplexity",
      model: "sonar",
      tokensIn,
      tokensOut,
    });

    let result = sanitizeWebContent(content);
    result += `\n\nПолная телепрограмма:\nhttps://tv.yandex.ru/`;

    console.log(`[tools] TV search: ${tokensIn}+${tokensOut} tokens for "${channelLabel} ${dateLabel}"`);
    setCache(cacheKey, result, TV_TTL);
    return result;
  } catch (err: any) {
    console.error("[tools] TV search error:", err.message);
    return "Не удалось найти телепрограмму. Попробуйте позже.";
  }
}

export async function searchGovServices(query: string, userId?: number): Promise<string> {
  const safeQuery = stripPII(query);
  const cacheKey = `gov:${safeQuery.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  if (userId) {
    const rateCheck = checkSearchRateLimit(userId);
    if (!rateCheck.allowed) return rateCheck.message!;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return "Сервис поиска госуслуг временно недоступен.";

  try {
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
            content: `Ты помогаешь пожилому человеку разобраться с государственными услугами в России. Ищи данные на сайтах: Госуслуги (gosuslugi.ru), СФР — Социальный фонд России (sfr.gov.ru), КонсультантПлюс (consultant.ru), Гарант (garant.ru). Выведи:
1. Суть услуги/льготы — простым языком
2. Кому положено (условия получения)
3. Какие документы нужны
4. Куда обращаться (МФЦ, Госуслуги, СФР)
5. Актуальные суммы выплат/размеры льгот (если применимо)
6. Сроки оформления

СТРОГИЕ ПРАВИЛА:
- Используй ТОЛЬКО актуальные данные из официальных источников. НЕ выдумывай суммы, сроки, условия.
- Если точные данные не найдены — напиши: «Точную информацию лучше уточнить на Госуслугах или в МФЦ.»
- Всегда указывай год актуальности данных (например: «по данным на 2026 год»).
- Упомяни что можно оформить через соцработника или с помощью родных, а не только через интернет.
- Объясняй ПРОСТЫМ языком, без юридических терминов. Если используешь термин — поясни в скобках.
- Пиши простым текстом без маркдауна. Нумеруй пункты цифрами.
- Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}`,
          },
          { role: "user", content: `Государственные услуги: ${safeQuery}` },
        ],
        max_tokens: 800,
        temperature: 0.2,
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
      userId: userId || null,
      endpoint: "search-gov-perplexity",
      model: "sonar",
      tokensIn,
      tokensOut,
    });

    let result = sanitizeWebContent(content);
    result += `\n\nПолезные ссылки:\nhttps://www.gosuslugi.ru/\nhttps://sfr.gov.ru/`;

    console.log(`[tools] Gov services search: ${tokensIn}+${tokensOut} tokens for "${query.slice(0, 50)}"`);
    setCache(cacheKey, result, GOV_TTL);
    return result;
  } catch (err: any) {
    console.error("[tools] Gov services search error:", err.message);
    return "Не удалось найти информацию о госуслуге. Попробуйте позже.";
  }
}

export async function searchGarden(query: string, region?: string, userId?: number): Promise<string> {
  const safeQuery = stripPII(query);
  const safeRegion = region ? stripPII(region) : "";
  const currentMonth = new Date().toLocaleDateString("ru-RU", { month: "long" });
  const fullQuery = safeRegion ? `${safeQuery} ${safeRegion}` : safeQuery;
  const cacheKey = `garden:${fullQuery}:${currentMonth}`.toLowerCase();
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  if (userId) {
    const rateCheck = checkSearchRateLimit(userId);
    if (!rateCheck.allowed) return rateCheck.message!;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return "Сервис садоводства временно недоступен.";

  try {
    const regionInstruction = safeRegion
      ? `Учитывай регион: ${safeRegion}.`
      : `Если регион не указан — давай общие рекомендации для средней полосы России.`;

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
            content: `Ты помогаешь опытному пожилому садоводу-огороднику. Ищи данные на сайтах: Антонов Сад (antonovsad.ru), 7 Дач (7dach.ru), Ботаничка (botanichka.ru). Сейчас месяц: ${currentMonth}. ${regionInstruction}

Выведи:
1. Конкретные рекомендации с учётом текущего сезона и месяца
2. Сроки посадки/обработки (для данного региона если указан)
3. Пошаговые действия
4. Народные приметы и проверенные советы (если есть)

СТРОГИЕ ПРАВИЛА:
- Используй ТОЛЬКО реальные агрономические данные. НЕ выдумывай сроки, дозировки удобрений, препараты.
- Учитывай ТЕКУЩИЙ МЕСЯЦ — не давай советы не по сезону.
- Не рекомендуй тяжёлую физическую работу (перекопка лопатой, перетаскивание тяжестей). Предлагай облегчённые варианты (мульчирование вместо прополки, высокие грядки, капельный полив).
- Если препарат для обработки — указывай точное название и дозировку из инструкции.
- Пиши простым текстом без маркдауна, как опытная соседка по даче. Нумеруй пункты цифрами.
- Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}`,
          },
          { role: "user", content: `Садоводство/огород: ${fullQuery}` },
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
      userId: userId || null,
      endpoint: "search-garden-perplexity",
      model: "sonar",
      tokensIn,
      tokensOut,
    });

    let result = sanitizeWebContent(content);
    const encodedQuery = encodeURIComponent(fullQuery);
    result += `\n\nПодробнее:\nhttps://7dach.ru/search/?q=${encodedQuery}`;

    console.log(`[tools] Garden search: ${tokensIn}+${tokensOut} tokens for "${query.slice(0, 50)}"`);
    setCache(cacheKey, result, GARDEN_TTL);
    return result;
  } catch (err: any) {
    console.error("[tools] Garden search error:", err.message);
    return "Не удалось найти информацию по садоводству. Попробуйте позже.";
  }
}

export async function searchProduct(query: string, userId?: number): Promise<string> {
  const safeQuery = stripPII(query);
  const cacheKey = `product:${safeQuery.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  if (userId) {
    const rateCheck = checkSearchRateLimit(userId);
    if (!rateCheck.allowed) return rateCheck.message!;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return "Сервис поиска товаров временно недоступен.";

  try {
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
            content: `Ты помогаешь пожилому человеку выбрать товар. Ищи данные на сайтах: Яндекс.Маркет (market.yandex.ru), Ozon (ozon.ru), Wildberries (wildberries.ru). Выведи:
1. Название товара / модель
2. Цена (диапазон от-до если на разных площадках)
3. Рейтинг и количество отзывов
4. Основные плюсы и минусы по отзывам покупателей
5. Если запрос общий (например «стиральная машина для бабушки») — предложи 2-3 варианта в разных ценовых категориях с пояснением чем отличаются

СТРОГИЕ ПРАВИЛА:
- Используй ТОЛЬКО реальные данные с маркетплейсов. НЕ выдумывай цены, модели, отзывы.
- Если товар не найден — напиши: «Не нашёл такой товар. Попробуйте уточнить название.»
- Цены указывай как ориентировочные: «от ... руб» или «примерно ... руб».
- Покупатель — пожилой человек. Рекомендуй товары с крупными кнопками/экраном, простым управлением, надёжностью. Избегай сложных технологических решений.
- Пиши простым текстом без маркдауна. Нумеруй пункты цифрами.
- Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}`,
          },
          { role: "user", content: `Найди товар: ${safeQuery}` },
        ],
        max_tokens: 800,
        temperature: 0.2,
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
      userId: userId || null,
      endpoint: "search-product-perplexity",
      model: "sonar",
      tokensIn,
      tokensOut,
    });

    let result = sanitizeWebContent(content);
    const encodedQuery = encodeURIComponent(safeQuery);
    result += `\n\nГде посмотреть и купить:`;
    result += `\nhttps://market.yandex.ru/search?text=${encodedQuery}`;
    result += `\nhttps://www.ozon.ru/search/?text=${encodedQuery}`;
    result += `\nhttps://www.wildberries.ru/catalog/0/search.aspx?search=${encodedQuery}`;

    console.log(`[tools] Product search: ${tokensIn}+${tokensOut} tokens for "${query.slice(0, 50)}"`);
    setCache(cacheKey, result, PRODUCT_TTL);
    return result;
  } catch (err: any) {
    console.error("[tools] Product search error:", err.message);
    return "Не удалось найти информацию о товаре. Попробуйте позже.";
  }
}

const VERIFY_TTL = 10 * 60 * 1000;

const DATE_PATTERNS = /(?:\d{1,2}\s+(?:январ[яь]|феврал[яь]|март[аеу]?|апрел[яь]|ма[яй]|июн[яь]|июл[яь]|август[аеу]?|сентябр[яь]|октябр[яь]|ноябр[яь]|декабр[яь])|\d{1,2}\.\d{1,2}(?:\.\d{2,4})?|(?:в|с|до)\s+\d{1,2}[:.]\d{2}|\d{1,2}:\d{2})/i;

const EVENT_CONTEXT_PATTERNS = /(?:концерт|спектакль|выставк|представлени|фестиваль|мероприяти|афиш|билет|расписани|рейс|поезд|электричк|автобус|приём врач|запись к|расписание приём|кино|театр|сеанс|премьер|матч|цирк|шоу|гастрол|куда сходить|куда пойти)/i;

function extractKeyFact(searchResult: string, originalQuery: string): string | null {
  const lines = searchResult.split("\n").filter(l => l.trim().length > 0);

  const factsWithDates: string[] = [];
  for (const line of lines) {
    if (DATE_PATTERNS.test(line) && line.length > 10 && line.length < 300) {
      const cleaned = line.replace(/^[\s\-•*\d.]+/, "").trim();
      if (cleaned.length > 10) {
        factsWithDates.push(cleaned);
      }
    }
  }

  if (factsWithDates.length === 0) return null;

  return factsWithDates.slice(0, 2).join("; ");
}

export async function verifySearchResult(
  originalQuery: string,
  searchResult: string,
  toolName: string,
): Promise<{ verified: boolean; warning?: string }> {
  if (!EVENT_CONTEXT_PATTERNS.test(originalQuery) && !EVENT_CONTEXT_PATTERNS.test(searchResult)) {
    return { verified: true };
  }

  const keyFact = extractKeyFact(searchResult, originalQuery);
  if (!keyFact) {
    return { verified: true };
  }

  const cacheKey = `verify:${keyFact.slice(0, 80).toLowerCase()}`;
  const cached = getCached<{ verified: boolean; warning?: string }>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return { verified: true };

  try {
    console.log(`[tools] Verification: checking "${keyFact.slice(0, 60)}..." for ${toolName}`);

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
            content: `Ты — факт-чекер. Проверь утверждение ниже. Ответь ОДНИМ словом: ПОДТВЕРЖДЕНО, НЕТОЧНО или НЕИЗВЕСТНО. Потом одно предложение — почему. Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}`,
          },
          {
            role: "user",
            content: `Проверь: "${keyFact}"\nКонтекст запроса: "${originalQuery}"`,
          },
        ],
        max_tokens: 150,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[tools] Verification HTTP ${response.status}`);
      return { verified: true };
    }

    const data = await response.json() as any;
    const content = (data.choices?.[0]?.message?.content || "").toLowerCase();

    const tokensIn = data.usage?.prompt_tokens || 0;
    const tokensOut = data.usage?.completion_tokens || 0;
    storage.logAiUsage({
      userId: null,
      endpoint: `verify-${toolName}`,
      model: "sonar",
      tokensIn,
      tokensOut,
    });

    console.log(`[tools] Verification result: "${content.slice(0, 80)}" (${tokensIn}+${tokensOut} tokens)`);

    const isConfirmed = /подтвержд/i.test(content);
    const isInaccurate = /неточн/i.test(content);
    const isUnknown = /неизвестн/i.test(content);

    let result: { verified: boolean; warning?: string };

    if (isConfirmed && !isInaccurate) {
      result = { verified: true };
    } else if (isInaccurate) {
      result = {
        verified: false,
        warning: "Перепроверка показала, что информация может быть неточной. Даты, время и детали могут отличаться — обязательно предупреди об этом и дай ссылку для самостоятельной проверки.",
      };
    } else if (isUnknown) {
      result = {
        verified: false,
        warning: "Не удалось найти подтверждение этой информации в других источниках. Предупреди что даты и детали могут быть неточными и дай ссылку для проверки.",
      };
    } else {
      result = {
        verified: false,
        warning: "Не удалось подтвердить конкретные даты и детали из другого источника. Предупреди что информация может быть неточной и дай ссылку для проверки.",
      };
    }

    setCache(cacheKey, result, VERIFY_TTL);
    return result;
  } catch (err: any) {
    console.error("[tools] Verification error:", err.message);
    return { verified: true };
  }
}
