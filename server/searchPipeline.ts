import OpenAI from "openai";
import { storage } from "./storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

const MAX_PIPELINE_CONTENT_LENGTH = 3000;

function sanitizePipelineContent(text: string): string {
  let cleaned = text;
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(new RegExp(pattern.source, pattern.flags + "g"), "[removed]");
  }
  cleaned = cleaned.replace(/(?:javascript|data|vbscript):/gi, "[blocked-url]:");
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, "");
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, "");
  if (cleaned.length > MAX_PIPELINE_CONTENT_LENGTH) {
    cleaned = cleaned.slice(0, MAX_PIPELINE_CONTENT_LENGTH) + "\n...[текст обрезан]";
  }
  return cleaned;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const pipelineCache = new Map<string, CacheEntry<any>>();

function getPipelineCached<T>(key: string): T | null {
  const entry = pipelineCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pipelineCache.delete(key);
    return null;
  }
  return entry.data as T;
}

const MAX_PIPELINE_CACHE_SIZE = 500;

function setPipelineCache<T>(key: string, data: T, ttlMs: number): void {
  if (pipelineCache.size >= MAX_PIPELINE_CACHE_SIZE) {
    const firstKey = pipelineCache.keys().next().value;
    if (firstKey !== undefined) pipelineCache.delete(firstKey);
  }
  pipelineCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of pipelineCache) {
    if (now > entry.expiresAt) {
      pipelineCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface PipelineQuery {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  label: string;
  model?: string;
}

export interface PipelineConfig {
  toolName: string;
  cacheKey: string;
  cacheTtl: number;
  queries: PipelineQuery[];
  mergeStrategy: "best" | "combine" | "compare";
  mergePrompt?: string;
  validateFacts?: boolean;
  validatePrompt?: string;
  userId?: number | null;
  suffix?: string;
  errorMessage?: string;
}

export interface PipelineResult {
  text: string;
  logId?: number;
  citations?: string[];
}

interface PerplexityResult {
  content: string;
  tokensIn: number;
  tokensOut: number;
  citations?: string[];
}

export async function callPerplexity(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 800,
  temperature: number = 0.2,
  timeoutMs: number = 15000,
  model: string = "sonar",
): Promise<PerplexityResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY not set");

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Perplexity HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Perplexity: empty response");

  return {
    content,
    tokensIn: data.usage?.prompt_tokens || 0,
    tokensOut: data.usage?.completion_tokens || 0,
    citations: data.citations || undefined,
  };
}

async function mergeWithGPT(results: string[], mergePrompt: string): Promise<string> {
  const numberedResults = results.map((r, i) => `=== ИСТОЧНИК ${i + 1} ===\n${r}`).join("\n\n");

  const safetyRule = "\n\nСТРОГОЕ ПРАВИЛО: используй ТОЛЬКО информацию из предоставленных источников. НЕ добавляй факты, цифры, даты, адреса, телефоны от себя. Если данные противоречат друг другу — укажи оба варианта. Пиши простым текстом без маркдауна.";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: mergePrompt + safetyRule,
      },
      {
        role: "user",
        content: numberedResults,
      },
    ],
    max_tokens: 1200,
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("GPT merge: empty response");

  const tokensIn = response.usage?.prompt_tokens || 0;
  const tokensOut = response.usage?.completion_tokens || 0;
  storage.logAiUsage({
    userId: null,
    endpoint: "pipeline-merge-gpt",
    model: "gpt-4o-mini",
    tokensIn,
    tokensOut,
  });

  console.log(`[pipeline] GPT merge: ${tokensIn}+${tokensOut} tokens`);
  return content;
}

async function validateWithPerplexity(
  originalQuery: string,
  mergedResult: string,
  validatePrompt?: string,
): Promise<{ warning?: string }> {
  const numberPattern = /(?:\d+[\s,.]?\d*\s*(?:руб|₽|%|тыс|млн|балл|кг|мг|мл|г\b|литр)|\d{1,2}[:.]\d{2}|\d{1,2}\s+(?:январ|феврал|март|апрел|ма[яй]|июн|июл|август|сентябр|октябр|ноябр|декабр))/gi;
  const facts = mergedResult.match(numberPattern);
  if (!facts || facts.length === 0) return {};

  const keyFacts = [...new Set(facts)].slice(0, 5).join(", ");

  const prompt = validatePrompt || `Ты — факт-чекер. Проверь следующие цифры/факты из ответа на запрос пользователя. Ответь кратко: какие данные ПОДТВЕРЖДЕНЫ, а какие МОГУТ БЫТЬ НЕТОЧНЫ. Если все данные верны — напиши "ВСЁ ВЕРНО". Дата сегодня: ${new Date().toLocaleDateString("ru-RU")}`;

  try {
    const result = await callPerplexity(
      prompt,
      `Запрос: "${originalQuery}"\nФакты для проверки: ${keyFacts}`,
      200,
      0.1,
      10000,
    );

    storage.logAiUsage({
      userId: null,
      endpoint: "pipeline-validate",
      model: "sonar",
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    });

    console.log(`[pipeline] Validation: ${result.tokensIn}+${result.tokensOut} tokens`);

    const lower = result.content.toLowerCase();
    if (/неточн|устарел|не подтвержд|отличается|расхожд/.test(lower)) {
      const warningLine = result.content.split("\n").find(l => /неточн|устарел|не подтвержд|отличается|расхожд/i.test(l));
      return {
        warning: warningLine
          ? `Перепроверка: ${warningLine.trim()}`
          : "Некоторые цифры могут быть неточными — рекомендуем перепроверить на официальном сайте.",
      };
    }

    return {};
  } catch (err: any) {
    console.error(`[pipeline] Validation error: ${err.message}`);
    return {};
  }
}

function mergeResultsSimple(results: string[], strategy: "combine" | "compare"): string {
  if (strategy === "combine") {
    return results.join("\n\n---\n\n");
  }
  return results.map((r, i) => `Источник ${i + 1}:\n${r}`).join("\n\n");
}

export async function searchPipeline(config: PipelineConfig): Promise<PipelineResult> {
  const {
    toolName,
    cacheKey,
    cacheTtl,
    queries,
    mergeStrategy,
    mergePrompt,
    validateFacts,
    validatePrompt,
    userId,
    suffix,
    errorMessage,
  } = config;

  const cached = getPipelineCached<PipelineResult>(cacheKey);
  if (cached) {
    console.log(`[pipeline] ${toolName}: cache hit for "${cacheKey.slice(0, 60)}"`);
    return cached;
  }

  const startTime = Date.now();

  try {
    console.log(`[pipeline] ${toolName}: starting ${queries.length} parallel queries`);

    const queryResults = await Promise.allSettled(
      queries.map(async (q) => {
        const result = await callPerplexity(
          q.systemPrompt,
          q.userMessage,
          q.maxTokens || 800,
          q.temperature || 0.2,
          15000,
          q.model || "sonar",
        );

        storage.logAiUsage({
          userId: userId || null,
          endpoint: `pipeline-${toolName}-${q.label}`,
          model: q.model || "sonar",
          tokensIn: result.tokensIn,
          tokensOut: result.tokensOut,
        });

        console.log(`[pipeline] ${toolName}/${q.label}: ${result.tokensIn}+${result.tokensOut} tokens`);
        return {
          content: sanitizePipelineContent(result.content),
          label: q.label,
          citations: result.citations,
        };
      }),
    );

    const successResults = queryResults
      .filter((r): r is PromiseFulfilledResult<{ content: string; label: string; citations?: string[] }> =>
        r.status === "fulfilled")
      .map(r => r.value);

    const failedCount = queryResults.filter(r => r.status === "rejected").length;
    if (failedCount > 0) {
      console.warn(`[pipeline] ${toolName}: ${failedCount}/${queries.length} queries failed`);
    }

    if (successResults.length === 0) {
      throw new Error("All pipeline queries failed");
    }

    let mergedResult: string;

    if (successResults.length === 1) {
      mergedResult = successResults[0].content;
    } else if (mergePrompt) {
      const strategySuffix = mergeStrategy === "best"
        ? "\n\nСТРАТЕГИЯ: ВЫБЕРИ ОДИН лучший, более полный и точный источник. Не смешивай информацию из разных источников. Верни текст лучшего источника, при необходимости немного отредактировав для ясности."
        : mergeStrategy === "compare"
        ? "\n\nСТРАТЕГИЯ: ПОКАЖИ ОБА варианта, кратко указав различия между ними. Пользователь должен видеть информацию из каждого источника отдельно."
        : "\n\nСТРАТЕГИЯ: ОБЪЕДИНИ информацию из всех источников в единый связный ответ. Убери дубли, сохрани все уникальные факты.";
      try {
        mergedResult = await mergeWithGPT(
          successResults.map(r => r.content),
          mergePrompt + strategySuffix,
        );
      } catch (mergeErr) {
        console.error(`[pipeline] ${toolName}: merge failed, using simple merge:`, (mergeErr as Error).message);
        mergedResult = mergeResultsSimple(
          successResults.map(r => r.content),
          mergeStrategy === "best" ? "combine" : mergeStrategy,
        );
      }
    } else {
      mergedResult = mergeResultsSimple(
        successResults.map(r => r.content),
        mergeStrategy === "best" ? "combine" : mergeStrategy,
      );
    }

    let validationResult: string | null = null;
    if (validateFacts) {
      const originalQuery = queries[0]?.userMessage || "";
      const validation = await validateWithPerplexity(originalQuery, mergedResult, validatePrompt);
      if (validation.warning) {
        mergedResult += `\n\n⚠️ ${validation.warning}`;
        validationResult = "inaccurate";
      } else {
        validationResult = "confirmed";
      }
    }

    if (suffix) {
      mergedResult += suffix;
    }

    const elapsed = Date.now() - startTime;
    console.log(`[pipeline] ${toolName}: completed in ${elapsed}ms (${successResults.length}/${queries.length} sources)`);

    let totalTokens = 0;
    for (const r of queryResults) {
      if (r.status === "fulfilled") {
        totalTokens += (r.value as any).tokensIn || 0;
        totalTokens += (r.value as any).tokensOut || 0;
      }
    }

    let logId: number | undefined;
    try {
      const logEntry = await storage.logSearchQuality({
        parentId: userId || null,
        toolName,
        query: queries[0]?.userMessage?.slice(0, 500) || "",
        sourcesCount: successResults.length,
        mergeStrategy,
        validationResult,
        responseTimeMs: elapsed,
        tokensTotal: totalTokens,
        userFeedback: null,
      });
      logId = logEntry.id || undefined;
    } catch (e) {
      // non-critical
    }

    const allCitations: string[] = [];
    for (const r of successResults) {
      if (r.citations) {
        for (const c of r.citations) {
          if (!allCitations.includes(c)) allCitations.push(c);
        }
      }
    }

    const result: PipelineResult = { text: mergedResult, logId, citations: allCitations.length > 0 ? allCitations : undefined };
    setPipelineCache(cacheKey, result, cacheTtl);
    return result;
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[pipeline] ${toolName}: error after ${elapsed}ms: ${err.message}`);
    return { text: errorMessage || "Не удалось найти информацию. Попробуйте позже." };
  }
}

import { AsyncLocalStorage } from "node:async_hooks";
export const pipelineLogStorage = new AsyncLocalStorage<number[]>();

export async function searchPipelineText(config: PipelineConfig): Promise<string> {
  const result = await searchPipeline(config);
  if (result.logId) {
    const store = pipelineLogStorage.getStore();
    if (store) store.push(result.logId);
  }
  return result.text;
}

export async function searchPipelineWithCitations(config: PipelineConfig): Promise<{ text: string; citations: string[] }> {
  const result = await searchPipeline(config);
  if (result.logId) {
    const store = pipelineLogStorage.getStore();
    if (store) store.push(result.logId);
  }
  return { text: result.text, citations: result.citations || [] };
}

export function todayDateRu(): string {
  return new Date().toLocaleDateString("ru-RU");
}

export function currentMonthRu(): string {
  return new Date().toLocaleDateString("ru-RU", { month: "long" });
}

export function fullDateRu(): string {
  return new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}
