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
  const coords = CITY_COORDS[cityKey] || CITY_COORDS["москва"];
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
    result += `Влажность ${current.relativehumidity_2m}%, ветер ${Math.round(current.windspeed_10m)} км/ч.\n`;

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

export async function searchWeb(query: string): Promise<string> {
  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты — помощник для поиска информации. Отвечай кратко, по-русски, только факты. Не выдумывай — если не знаешь точно, скажи что не уверен. Если спрашивают про афишу, кино, театр, мероприятия — дай конкретные рекомендации: назови популярные фильмы и спектакли которые сейчас идут. Предложи посмотреть актуальную афишу на afisha.ru, kinopoisk.ru, kassir.ru. Дата сегодня: " + new Date().toLocaleDateString("ru-RU"),
        },
        { role: "user", content: query },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const result = response.choices[0]?.message?.content || "Не удалось найти информацию.";

    const usage = response.usage;
    if (usage) {
      storage.logAiUsage({
        userId: null,
        endpoint: "search-web",
        model: "gpt-4o-mini",
        tokensIn: usage.prompt_tokens,
        tokensOut: usage.completion_tokens,
      });
    }

    const lowerQuery = query.toLowerCase();
    const isEntertainment = ["кино", "театр", "афиш", "фильм", "спектакл", "концерт", "выставк", "мероприят"].some(w => lowerQuery.includes(w));
    if (isEntertainment) {
      const encodedQuery = encodeURIComponent(query);
      result += `\n\nАктуальная афиша:\nafisha.ru — https://www.afisha.ru/msk/cinema/\nkinopoisk.ru — https://www.kinopoisk.ru/afisha/\nkassir.ru — https://kassir.ru/`;
    }

    setCache(cacheKey, result, SEARCH_TTL);
    return result;
  } catch (err: any) {
    console.error("[tools] Search error:", err.message);
    return `Не удалось выполнить поиск. Попробуйте позже.`;
  }
}

export async function searchRecipe(dish: string): Promise<string> {
  const cacheKey = `recipe:${dish.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты — кулинарный помощник. Дай подробный пошаговый рецепт блюда на русском языке. Укажи ингредиенты с точными количествами и пошаговую инструкцию. Пиши просто и понятно, как для домашней хозяйки. НЕ используй маркдаун, заголовки (###), буллеты (-), звёздочки (**). Пиши обычным текстом как сообщение в мессенджере. Нумеруй шаги цифрами (1, 2, 3...). Не добавляй ссылки на сайты.",
        },
        { role: "user", content: `Рецепт: ${dish}` },
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

    const encodedDish = encodeURIComponent(dish);
    result += `\n\nЕщё рецепты можно посмотреть тут:\npovarenok.ru — https://www.povarenok.ru/recipes/search/?search=${encodedDish}\neda.ru — https://eda.ru/recepty?q=${encodedDish}`;

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
    console.error("[tools] Image generation error:", err.message);
    return { url: null, error: "Не получилось нарисовать картинку. Попробуем позже." };
  }
}
