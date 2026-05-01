import { Router } from 'express';
import { generateChatResponse, generateResponseForChannel } from '../services/groq.js';
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


export default router