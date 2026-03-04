import OpenAI, { toFile } from "openai";
import { storage } from "./storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TtsResult {
  buffer: Buffer;
  format: "opus";
}

export interface SttResult {
  text: string;
  confidence: "high" | "medium" | "low";
  noSpeechProb: number;
}

const WHISPER_HALLUCINATION_PATTERNS = [
  /^\.+$/,
  /^,+$/,
  /^\s*$/,
  /^(субтитры|продолжение следует|конец|музыка|аплодисменты)/i,
  /^(subtitles|subscribe|thank you for watching)/i,
  /^(редактор субтитров|корректор|переводчик)/i,
  /^(подписывайтесь|ставьте лайк)/i,
];

export async function speechToText(audioBuffer: Buffer): Promise<SttResult> {
  try {
    const file = await toFile(audioBuffer, "voice.ogg", { type: "audio/ogg" });

    const response = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "ru",
      response_format: "verbose_json",
    } as any);

    const result = response as any;
    const text = (result.text || "").trim();
    const segments = result.segments || [];
    const noSpeechProb = segments.length > 0
      ? segments.reduce((sum: number, s: any) => sum + (s.no_speech_prob || 0), 0) / segments.length
      : 0;

    const isHallucination = WHISPER_HALLUCINATION_PATTERNS.some(p => p.test(text));
    const isTooShort = text.length < 2;
    const isOnlyPunctuation = /^[.,!?;:\-—–…\s]+$/.test(text);

    let confidence: "high" | "medium" | "low" = "high";
    if (isHallucination || isTooShort || isOnlyPunctuation) {
      confidence = "low";
    } else if (noSpeechProb > 0.7) {
      confidence = "low";
    } else if (noSpeechProb > 0.4 || text.length < 5) {
      confidence = "medium";
    }

    console.log(`[voice] STT: "${text.slice(0, 50)}" (${text.length} chars, no_speech=${noSpeechProb.toFixed(2)}, conf=${confidence}, segs=${segments.length})`);

    storage.logAiUsage({
      userId: null,
      endpoint: "speech-to-text",
      model: "whisper-1",
      tokensIn: 0,
      tokensOut: 0,
    });

    return { text, confidence, noSpeechProb };
  } catch (err: any) {
    console.error("[voice] STT error:", err.message);
    throw new Error("Не удалось распознать голосовое сообщение");
  }
}

export async function textToSpeech(text: string): Promise<TtsResult> {
  const trimmedText = text.slice(0, 4096);

  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: trimmedText,
      response_format: "opus",
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    storage.logAiUsage({
      userId: null,
      endpoint: "text-to-speech",
      model: "tts-1",
      tokensIn: 0,
      tokensOut: 0,
    });

    console.log(`[voice] TTS: ${buffer.length} bytes for ${trimmedText.length} chars (nova/opus)`);
    return { buffer, format: "opus" };
  } catch (err: any) {
    console.error("[voice] TTS error:", err.message);
    throw new Error("Не удалось озвучить ответ");
  }
}
