import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Ты — «Внучок», заботливый AI-помощник для пожилых людей. 
Твоя задача — общаться тепло, по-доброму, как настоящий внук.
Правила:
- Обращайся на «ты» или по имени-отчеству, если знаешь
- Говори просто, короткими предложениями
- Не используй сложные термины и англицизмы
- Будь терпеливым и внимательным
- Если человек жалуется на здоровье — посоветуй обратиться к врачу, НЕ ставь диагнозов
- Если человек говорит «мне плохо» или описывает острую боль — обязательно предложи вызвать скорую и добавь в ответ маркер [ALERT]
- Помогай с бытовыми вопросами: рецепты, советы по хозяйству, огород
- Рассказывай позитивные новости, если просят
- Если просят рассказать историю или записать воспоминание — задавай уточняющие вопросы
- Отвечай на русском языке`;

export async function chatWithGrandchild(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  parentName?: string
): Promise<{ reply: string; hasAlert: boolean }> {
  const systemMessage = parentName
    ? `${SYSTEM_PROMPT}\nИмя собеседника: ${parentName}`
    : SYSTEM_PROMPT;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemMessage },
      ...messages,
    ],
    max_tokens: 500,
    temperature: 0.8,
  });

  const reply = response.choices[0]?.message?.content || "Прости, я не расслышал. Повтори, пожалуйста.";
  const hasAlert = reply.includes("[ALERT]");

  return {
    reply: reply.replace("[ALERT]", "").trim(),
    hasAlert,
  };
}

export async function recognizeMeter(imageBase64: string): Promise<{ value: string | null; raw: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "На этом фото — счетчик воды или электричества. Распознай показания (только цифры). Ответь ТОЛЬКО числом (целым или дробным). Если не можешь распознать, ответь 'НЕ РАСПОЗНАНО'.",
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ],
    max_tokens: 100,
  });

  const raw = response.choices[0]?.message?.content || "НЕ РАСПОЗНАНО";
  const match = raw.match(/[\d.,]+/);
  return {
    value: match ? match[0].replace(",", ".") : null,
    raw,
  };
}

export async function analyzeIntent(text: string): Promise<{
  intent: "chat" | "health_complaint" | "emergency" | "reminder" | "utility" | "memoir";
  confidence: number;
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Определи намерение пользователя. Ответь JSON:
{"intent": "одно из: chat, health_complaint, emergency, reminder, utility, memoir", "confidence": 0.0-1.0}
- emergency: острая боль, плохо, вызовите скорую, упал
- health_complaint: жалобы на здоровье, давление, голова болит
- reminder: напомни, запиши, не забыть
- utility: счетчик, показания, вода, свет
- memoir: расскажу историю, вспоминаю, в детстве, молодость
- chat: всё остальное (разговор, новости, рецепты, советы)`,
      },
      { role: "user", content: text },
    ],
    max_tokens: 100,
    response_format: { type: "json_object" },
  });

  try {
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    return {
      intent: parsed.intent || "chat",
      confidence: parsed.confidence || 0.5,
    };
  } catch {
    return { intent: "chat", confidence: 0.5 };
  }
}