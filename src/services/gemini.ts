import { GoogleGenerativeAI } from '@google/generative-ai';
import { CONFIG } from '../config.js';
import { SYSTEM_PROMPT } from '../data/startupContext.js';
import type { ChatMessage } from '../types/index.js';

const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);

/**
 * Genera una respuesta usando Gemini con el contexto de Symmetrical Code.
 *
 * @param userMessage - El mensaje del usuario
 * @param history - Historial previo de la conversación (opcional)
 * @returns La respuesta del modelo
 */
export async function generateChatResponse(
  userMessage: string,
  history: ChatMessage[] = []
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: CONFIG.GEMINI_MODEL,
  });

  // Convertir el historial al formato que espera Gemini
  const geminiHistory = history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  const chat = model.startChat({
    history: geminiHistory,
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await chat.sendMessage(userMessage);
  const response = await result.response;
  const text = response.text();

  return text;
}

/**
 * Wrapper para canales externos (WhatsApp, etc.)
 * Permite agregar metadata del canal sin afectar la conversación.
 */
export async function generateResponseForChannel(
  userMessage: string,
  channel: 'web' | 'whatsapp',
  history: ChatMessage[] = []
): Promise<string> {
  // Por ahora, el canal no modifica el comportamiento.
  // En el futuro se puede personalizar la respuesta según el canal.
  console.log(`[${channel.toUpperCase()}] Procesando mensaje...`);
  return generateChatResponse(userMessage, history);
}
