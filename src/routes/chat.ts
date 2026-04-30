import { Router } from 'express';
import { generateChatResponse, generateResponseForChannel } from '../services/gemini.js';
import type { ChatRequest, WebhookRequest } from '../types/index.js';

const router = Router();

/**
 * POST /api/chat
 * Endpoint principal para el chatbot desde la página web.
 *
 * Body: { message: string, history?: ChatMessage[] }
 * Response: { success: boolean, reply: string }
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history }: ChatRequest = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        reply: '',
        error: 'El campo "message" es requerido y debe ser un string.',
      });
      return;
    }

    const reply = await generateChatResponse(message, history);

    res.json({
      success: true,
      reply,
    });
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
 * Endpoint para recibir mensajes de WhatsApp.
 * DISEÑADO PARA SER USADO POR EL COMPAÑERO QUE INTEGRA WHATSAPP.
 *
 * Body: { channel: 'whatsapp', userId: string, message: string, timestamp: string }
 * Response: { success: boolean, reply: string }
 */
router.post('/webhook/whatsapp', async (req, res) => {
  try {
    const { channel, userId, message, timestamp }: WebhookRequest = req.body;

    if (channel !== 'whatsapp') {
      res.status(400).json({
        success: false,
        reply: '',
        error: 'Canal no soportado. Usá "whatsapp".',
      });
      return;
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        reply: '',
        error: 'El campo "message" es requerido.',
      });
      return;
    }

    console.log(`[WHATSAPP] Mensaje de ${userId} a las ${timestamp}: ${message}`);

    // Generar respuesta usando el MISMO cerebro de IA que la web
    const reply = await generateResponseForChannel(message, 'whatsapp');

    // La respuesta se devuelve en JSON. El integrador de WhatsApp
    // debe tomar este "reply" y enviarlo por la WhatsApp API de Meta.
    res.json({
      success: true,
      reply,
    });
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
 * Health check para verificar que el servidor está corriendo.
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'symmetrical-code-backend',
    timestamp: new Date().toISOString(),
  });
});

export default router;
