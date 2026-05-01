import { CONFIG } from '../config.js';
import { SYSTEM_PROMPT } from '../data/startupContext.js';
import type { ChatMessage } from '../types/index.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

async function detectLanguage(text: string): Promise<'en' | 'es'> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CONFIG.GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a language detector. Reply with ONLY "en" or "es" — nothing else.',
        },
        {
          role: 'user',
          content: `What language is this message written in? Message: "${text}"`,
        },
      ],
      temperature: 0,
      max_tokens: 4,
    }),
  });

  if (!response.ok) return 'es';

  const data = (await response.json()) as GroqResponse;
  const result = data.choices[0]?.message?.content?.trim().toLowerCase();
  return result === 'en' ? 'en' : 'es';
}

export async function generateChatResponse(
  userMessage: string,
  history: ChatMessage[] = [],
  language: string = 'es'
): Promise<string> {
  const languageInstruction =
    language === 'en'
      ? '\n\nLANGUAGE INSTRUCTION: The user wrote in English. You MUST reply in English ONLY. Do NOT use Spanish under any circumstance, even if the rest of your instructions are in Spanish.'
      : '\n\nINSTRUCCIÓN DE IDIOMA: El usuario escribió en español. Respondé ÚNICAMENTE en español. No uses inglés bajo ninguna circunstancia.';

  const messages: GroqMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + languageInstruction },
  ];

  for (const msg of history) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text,
    });
  }

  messages.push({ role: 'user', content: userMessage });

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CONFIG.GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as GroqResponse;
  return data.choices[0]?.message?.content || 'No recibí una respuesta válida.';
}

export async function generateResponseForChannel(
  userMessage: string,
  channel: 'web' | 'whatsapp',
  history: ChatMessage[] = []
): Promise<string> {
  console.log(`[${channel.toUpperCase()}] Procesando mensaje...`);

  const detectedLanguage = await detectLanguage(userMessage);
  console.log(`[${channel.toUpperCase()}] Idioma detectado: ${detectedLanguage}`);

  return generateChatResponse(userMessage, history, detectedLanguage);
}