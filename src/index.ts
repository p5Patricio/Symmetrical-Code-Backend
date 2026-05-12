import express from 'express';
import cors from 'cors';
import { CONFIG, validateConfig } from './config.js';
import chatRoutes from './routes/chat.js';
import whatsappRoutes from './routes/whatsapp.js';
import contactRoutes from './routes/contact.js';

const app = express();

// Validar configuración antes de arrancar
validateConfig();

// Middleware
app.use(cors({
  origin: CONFIG.FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Rutas
app.use('/api', chatRoutes);
app.use('/api', whatsappRoutes);
app.use('/api', contactRoutes);

// Manejo de rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada. Endpoints disponibles: POST /api/chat, POST /api/webhook/whatsapp, GET /api/health',
  });
});

// Iniciar servidor
app.listen(CONFIG.PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   🤖 Symmetrical Code Backend - Chatbot Server          ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║   🌐 URL: http://localhost:${CONFIG.PORT}                      ║`);
  console.log(`║   🧠 Modelo: ${CONFIG.GROQ_MODEL}        ║`);
  console.log('║   🔌 Proveedor: Groq (1,000 req/día gratis)             ║');
  console.log('║                                                          ║');
  console.log('║   Endpoints:                                             ║');
  console.log('║   • POST /api/chat           → Chat desde la web        ║');
  console.log('║   • POST /api/webhook/whatsapp → Webhook de WhatsApp    ║');
  console.log('║   • GET  /api/health         → Health check             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
});
