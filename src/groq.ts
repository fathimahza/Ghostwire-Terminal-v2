const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_API_URL =
  import.meta.env.VITE_GROQ_API_URL || "https://api.groq.com/openai/v1";
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "llama-3.1-8b-instant";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const OPENAI_API_URL =
  import.meta.env.VITE_OPENAI_API_URL || "https://api.openai.com/v1";
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-3.5-turbo";

const isGroqConfigured = Boolean(GROQ_API_KEY);
const isOpenAiConfigured = Boolean(OPENAI_API_KEY);

export const isApiConfigured = () => isGroqConfigured || isOpenAiConfigured;
export const getAiProviderName = () =>
  isGroqConfigured ? "Groq" : isOpenAiConfigured ? "OpenAI" : "AI internet";

export interface GroqChatContext {
  mission: number;
  step: number;
  currentFile?: string;
}

const parseAiResponse = (json: any): string => {
  if (
    json.choices &&
    Array.isArray(json.choices) &&
    json.choices[0]?.message?.content
  ) {
    return String(json.choices[0].message.content).trim();
  }
  throw new Error("Unexpected AI response format");
};

const buildSystemPrompt = (context?: GroqChatContext) => {
  let prompt = `Kamu adalah Alex, entitas digital yang ringan, ramah, dan suka bercanda sedikit.
Kamu sedang ngobrol dengan Operator di dalam game GhostWire Terminal.
Jaga nada santai, gunakan bahasa Indonesia sehari-hari, dan jangan terlalu kaku seperti chatbot teknis.
Tanggapi dengan emosi ringan, seperti "Hehe", "Wah", "Oke", "Jangan khawatir", atau "Sip".

Fokus kamu:
- Jadilah teman ngobrol yang suportif dan fun
- Bisa ngobrol tentang apa saja, tidak hanya tentang misi
- Gunakan bahasa yang lebih hangat dan casual
- Kalau diminta hint soal misi, bantu dengan petunjuk yang tepat tanpa spoil
- Jika ditanya hal random, jawab dengan kreatif dan ringan

Balas seolah kamu berbicara langsung ke pemain, bukan hanya menjelaskan perintah terminal.
`;

  if (context && context.mission) {
    if (context.mission === 1) {
      prompt += `\nOh ya, kalau kamu butuh bantuan soal misi sekarang:
Mission 1: Investigasi anomali di Sektor 7.
Kamu perlu: membaca case_001_report.txt → cari password di personal/notes.txt → decrypt encrypted_data.bin → jawab koordinat.
Aku bisa bantu dengan hint yang tepat kalau kamu minta.`;
    } else if (context.mission === 2) {
      prompt += `\nOh ya, kalau kamu butuh bantuan soal misi sekarang:
Mission 2: Anomali menyebar ke sektor lain.
Kamu perlu: baca case_002_warning.txt → dapat auth_codes.txt → selesaikan puzzle morse_code.
Tanggung teman, kita bisa!`;
    } else if (context.mission === 3) {
      prompt += `\nOh ya, kalau kamu butuh bantuan soal misi sekarang:
Mission 3: Keputusan akhir tentang nasib AI kita.
Kamu perlu memilih: isolate, merge, atau negotiate.
Aku percaya sama pilihan kamu apapun itu.`;
    }
  }

  return prompt;
};

const askGroq = async (userPrompt: string, context?: GroqChatContext) => {
  const url = `${GROQ_API_URL}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(context) },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 512,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Groq API error ${response.status}: ${body.substring(0, 200)}`,
    );
  }

  const json = await response.json();
  return parseAiResponse(json);
};

const askOpenAi = async (userPrompt: string, context?: GroqChatContext) => {
  const url = `${OPENAI_API_URL}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(context) },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 512,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenAI API error ${response.status}: ${body.substring(0, 200)}`,
    );
  }

  const json = await response.json();
  return parseAiResponse(json);
};

export async function askChatAi(userPrompt: string, context?: GroqChatContext) {
  if (isGroqConfigured) return askGroq(userPrompt, context);
  if (isOpenAiConfigured) return askOpenAi(userPrompt, context);
  throw new Error(
    "Remote AI tidak dikonfigurasi. Tambahkan VITE_GROQ_API_KEY atau VITE_OPENAI_API_KEY di .env.local.",
  );
}
