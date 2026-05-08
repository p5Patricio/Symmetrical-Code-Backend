import { Router } from 'express';
import { generateResponseForChannel } from '../services/groq.js';
import type { ChatRequest } from '../types/index.js';
import { sendLeadEmail } from '../services/email.js';

const router = Router();

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

    // Siempre detecta el idioma del mensaje actual — ignora cualquier default
    const reply = await generateResponseForChannel(message, 'web', history);

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

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'symmetrical-code-backend',
    timestamp: new Date().toISOString(),
  });
});


// // 🧪 ENDPOINT DE PRUEBA - ELIMINAR DESPUÉS
// router.post('/test-email', async (req, res) => {
//   const success = await sendLeadEmail({
//     nombre: 'Cliente de Prueba',
//     descripcion: 'Quiero saber más sobre sus servicios de e-commerce',
//     whatsapp: '524181585313',
//   });

//   res.json({ success });
// });

export default router;