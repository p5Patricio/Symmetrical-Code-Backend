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

/**
 * Genera una respuesta usando Groq con el contexto de Symmetrical Code.
 *
 * @param userMessage - El mensaje del usuario
 * @param history - Historial previo de la conversación (opcional)
 * @param language - Idioma en el que debe responder ('es' | 'en'), por defecto 'es'
 * @returns La respuesta del modelo
 */
export async function generateChatResponse(
  userMessage: string,
  history: ChatMessage[] = [],
  language: string = 'es'
): Promise<string> {
  // Instrucción de idioma que se agrega al final del system prompt
  const languageInstruction =
    language === 'en'
      ? '\n\n LANGUAGE INSTRUCTION: The user has their interface set to English. You MUST respond in English for the entire conversation, regardless of the language the user writes in.'
      : '\n\n INSTRUCCIÓN DE IDIOMA: El usuario tiene la interfaz en español. Respondé siempre en español.';

  const messages: GroqMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + languageInstruction },
  ];

  // Convertir historial al formato de Groq (OpenAI)
  for (const msg of history) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text,
    });
  }

  // Agregar el mensaje actual del usuario
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

/**
 * Wrapper para canales externos (WhatsApp, etc.)
 */
export async function generateResponseForChannel(
  userMessage: string,
  channel: 'web' | 'whatsapp',
  history: ChatMessage[] = [],
  language: string = 'es'
): Promise<string> {
  console.log(`[${channel.toUpperCase()}] Procesando mensaje...`);
  return generateChatResponse(userMessage, history, language);
}