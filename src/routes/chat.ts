import { Router } from 'express';
import { generateChatResponse, generateResponseForChannel } from '../services/groq.js';
import type { ChatRequest, WebhookRequest } from '../types/index.js';

const router = Router();

/**
 * POST /api/chat
 * Body: { message: string, history?: ChatMessage[], language?: string }
 * Response: { success: boolean, reply: string }
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history, language }: ChatRequest & { language?: string } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        reply: '',
        error: 'El campo "message" es requerido y debe ser un string.',
      });
      return;
    }

    // language viene del frontend ('es' | 'en'), por defecto 'es'
    const reply = await generateChatResponse(message, history, language ?? 'es');

    res.json({ success: true, reply });
  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({
      success: false,
      reply: '',
      error: 'Ocurrió un error al procesar tu mensaje. Por favor, intentá de nuevo.',
    });
  }
});

/**
 * POST /api/webhook/whatsapp
 * Body: { channel: 'whatsapp', userId: string, message: string, timestamp: string }
 */
router.post('/webhook/whatsapp', async (req, res) => {
  try {
    const { channel, userId, message, timestamp }: WebhookRequest = req.body;

    if (channel !== 'whatsapp') {
      res.status(400).json({ success: false, reply: '', error: 'Canal no soportado. Usá "whatsapp".' });
      return;
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, reply: '', error: 'El campo "message" es requerido.' });
      return;
    }

    console.log(`[WHATSAPP] Mensaje de ${userId} a las ${timestamp}: ${message}`);

    const reply = await generateResponseForChannel(message, 'whatsapp');

    res.json({ success: true, reply });
  } catch (error) {
    console.error('Error en /api/webhook/whatsapp:', error);
    res.status(500).json({
      success: false,
      reply: '',
      error: 'Ocurrió un error al procesar el mensaje de WhatsApp.',
    });
  }
});

/**
 * GET /health
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'symmetrical-code-backend',
    timestamp: new Date().toISOString(),
  });
});

export default router;