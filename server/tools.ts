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

export async function getWeather(city: string): Promise<string> {
  const cacheKey = `weather:${city.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=ru`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Vnuchok-Bot/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return `Не удалось узнать погоду для "${city}". Попробуйте указать город точнее.`;
    }

    const data = await response.json() as any;
    const current = data.current_condition?.[0];
    const today = data.weather?.[0];
    const tomorrow = data.weather?.[1];

    if (!current) {
      return `Не нашёл данных о погоде для "${city}".`;
    }

    const ruDesc = current.lang_ru?.[0]?.value || current.weatherDesc?.[0]?.value || "";
    let result = `Погода в городе ${city}:\n`;
    result += `Сейчас: ${current.temp_C}°C, ${ruDesc}. `;
    result += `Ощущается как ${current.FeelsLikeC}°C. `;
    result += `Влажность ${current.humidity}%, ветер ${current.windspeedKmph} км/ч.\n`;

    if (today) {
      const todayDesc = today.hourly?.[4]?.lang_ru?.[0]?.value || "";
      result += `Сегодня: от ${today.mintempC}°C до ${today.maxtempC}°C. ${todayDesc}\n`;
    }

    if (tomorrow) {
      const tomDesc = tomorrow.hourly?.[4]?.lang_ru?.[0]?.value || "";
      result += `Завтра: от ${tomorrow.mintempC}°C до ${tomorrow.maxtempC}°C. ${tomDesc}`;
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
          content: "Ты — помощник для поиска информации. Отвечай кратко, по-русски, только факты. Не выдумывай — если не знаешь точно, скажи что не уверен. Дата сегодня: " + new Date().toLocaleDateString("ru-RU"),
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
          content: "Ты — кулинарный помощник. Дай подробный пошаговый рецепт блюда на русском языке. Укажи ингредиенты с точными количествами и пошаговую инструкцию. Пиши просто, как для домашней хозяйки.",
        },
        { role: "user", content: `Рецепт: ${dish}` },
      ],
      max_tokens: 800,
      temperature: 0.5,
    });

    const result = response.choices[0]?.message?.content || "Не удалось найти рецепт.";

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
