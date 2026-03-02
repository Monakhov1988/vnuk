import OpenAI, { toFile } from "openai";
import { storage } from "./storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TtsResult {
  buffer: Buffer;
  format: "wav" | "opus";
}

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

async function textToSpeechAudioModel(text: string): Promise<TtsResult> {
  const trimmedText = text.slice(0, 4096);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini-audio-preview",
    modalities: ["text", "audio"],
    audio: { voice: "coral", format: "wav" },
    messages: [
      {
        role: "system",
        content: "Говори эмоционально и дружелюбно, как заботливый внук. Тепло, с душевными интонациями, не торопясь. Озвучь следующий текст точно как написано, ничего не добавляя и не меняя.",
      },
      {
        role: "user",
        content: trimmedText,
      },
    ],
  } as any);

  const audioData = (response.choices[0]?.message as any)?.audio?.data;
  if (!audioData) {
    throw new Error("Audio model returned no audio data");
  }

  const buffer = Buffer.from(audioData, "base64");

  const usage = response.usage;
  storage.logAiUsage({
    userId: null,
    endpoint: "text-to-speech-audio",
    model: "gpt-4o-mini-audio-preview",
    tokensIn: usage?.prompt_tokens || 0,
    tokensOut: usage?.completion_tokens || 0,
  });

  console.log(`[voice] Audio model TTS: ${buffer.length} bytes for ${trimmedText.length} chars (coral/wav)`);
  return { buffer, format: "wav" };
}

async function textToSpeechClassic(text: string): Promise<TtsResult> {
  const trimmedText = text.slice(0, 4096);

  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
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

  console.log(`[voice] Classic TTS: ${buffer.length} bytes for ${trimmedText.length} chars (alloy/opus)`);
  return { buffer, format: "opus" };
}

export async function textToSpeech(text: string): Promise<TtsResult> {
  try {
    return await textToSpeechAudioModel(text);
  } catch (err: any) {
    console.error("[voice] Audio model TTS failed, falling back to classic TTS:", err.message);
    return await textToSpeechClassic(text);
  }
}
