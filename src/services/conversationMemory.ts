import type { ChatMessage } from '../types/index.js';

/**
 * Almacena el historial de conversación por número de WhatsApp.
 * Memoria simple en RAM — se pierde si reinicia el servidor.
 *
 * Estructura: Map<numeroWhatsApp, mensajes[]>
 */
const conversations = new Map<string, ChatMessage[]>();

/**
 * Configuración:
 * - MAX_MESSAGES: Cuántos mensajes guardar por usuario.
 *   Más alto = más contexto pero más caro en tokens de IA.
 * - INACTIVITY_MS: Después de cuánto tiempo sin actividad
 *   se borra una conversación para liberar memoria.
 */
const MAX_MESSAGES = 20;
const INACTIVITY_MS = 60 * 60 * 1000; // 1 hora

// Guarda timestamp de última actividad por usuario
const lastActivity = new Map<string, number>();

/**
 * Obtiene el historial de un cliente.
 * Si no existe, devuelve array vacío.
 */
export function getHistory(userId: string): ChatMessage[] {
  return conversations.get(userId) || [];
}

/**
 * Agrega un mensaje al historial del cliente.
 * Mantiene solo los últimos MAX_MESSAGES mensajes.
 */
export function addMessage(
  userId: string,
  role: 'user' | 'model',   // 👈 cambio aquí
  text: string
): void {
  const history = conversations.get(userId) || [];

  history.push({ role, text });

  if (history.length > MAX_MESSAGES) {
    history.splice(0, history.length - MAX_MESSAGES);
  }

  conversations.set(userId, history);
  lastActivity.set(userId, Date.now());
}

/**
 * Borra la conversación de un cliente.
 * Útil cuando ya capturamos su lead — empieza limpio si vuelve a escribir.
 */
export function clearHistory(userId: string): void {
  conversations.delete(userId);
  lastActivity.delete(userId);
}

/**
 * Limpia conversaciones inactivas para liberar memoria.
 * Se ejecuta automáticamente cada hora.
 */
function cleanupInactive(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [userId, timestamp] of lastActivity.entries()) {
    if (now - timestamp > INACTIVITY_MS) {
      conversations.delete(userId);
      lastActivity.delete(userId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[MEMORY] Limpieza: ${cleaned} conversaciones inactivas eliminadas`);
  }
}

// Limpieza automática cada hora
setInterval(cleanupInactive, INACTIVITY_MS);