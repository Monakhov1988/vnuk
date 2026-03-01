import OpenAI, { toFile } from "openai";
import { storage } from "./storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function speechToText(audioBuffer: Buffer): Promise<string> {
  try {
    const file = await toFile(audioBuffer, "voice.ogg", { type: "audio/ogg" });

    const response = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "ru",
    });

    const text = response.text?.trim() || "";
    console.log(`[voice] STT result (${text.length} chars): ${text.slice(0, 80)}`);

    storage.logAiUsage({
      userId: null,
      endpoint: "speech-to-text",
      model: "whisper-1",
      tokensIn: 0,
      tokensOut: 0,
    });

    return text;
  } catch (err: any) {
    console.error("[voice] STT error:", err.message);
    throw new Error("Не удалось распознать голосовое сообщение");
  }
}

export async function textToSpeech(text: string): Promise<Buffer> {
  try {
    const trimmedText = text.slice(0, 4096);

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: trimmedText,
      response_format: "opus",
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`[voice] TTS result: ${buffer.length} bytes for ${trimmedText.length} chars`);

    storage.logAiUsage({
      userId: null,
      endpoint: "text-to-speech",
      model: "tts-1",
      tokensIn: 0,
      tokensOut: 0,
    });

    return buffer;
  } catch (err: any) {
    console.error("[voice] TTS error:", err.message);
    throw new Error("Не удалось озвучить ответ");
  }
}
