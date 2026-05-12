
import { Router } from 'express';
import { sendContactEmail } from '../services/email.js';

const router = Router();

/**
 * Cooldown simple por IP para prevenir spam.
 * Una IP solo puede mandar 1 mensaje cada 60 segundos.
 */
const COOLDOWN_MS = 60 * 1000;
const lastSentByIp = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamp] of lastSentByIp.entries()) {
    if (now - timestamp > COOLDOWN_MS) lastSentByIp.delete(ip);
  }
}, COOLDOWN_MS);

/**
 * POST /api/contact
 * Recibe los datos del formulario de contacto del sitio web
 * y los envía por correo al equipo de admins.
 */
router.post('/contact', async (req, res) => {
  try {
    const { nombre, email, mensaje } = req.body;

    // 1. Validación básica de campos
    if (!nombre || !email || !mensaje) {
      res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos.',
      });
      return;
    }

    if (typeof nombre !== 'string' || typeof email !== 'string' || typeof mensaje !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Formato de datos inválido.',
      });
      return;
    }

    // 2. Validación de longitud
    if (nombre.length < 2 || nombre.length > 100) {
      res.status(400).json({ success: false, error: 'Nombre inválido.' });
      return;
    }

    if (mensaje.length < 10 || mensaje.length > 2000) {
      res.status(400).json({
        success: false,
        error: 'El mensaje debe tener entre 10 y 2000 caracteres.',
      });
      return;
    }

    // 3. Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, error: 'Email inválido.' });
      return;
    }

    // 4. Anti-spam: cooldown por IP
    const ip = req.ip || 'unknown';
    const lastSent = lastSentByIp.get(ip);
    if (lastSent && Date.now() - lastSent < COOLDOWN_MS) {
      res.status(429).json({
        success: false,
        error: 'Demasiados mensajes. Intentá de nuevo en un minuto.',
      });
      return;
    }

    // 5. Enviar correo
    const sent = await sendContactEmail({
      nombre: nombre.trim(),
      email: email.trim(),
      mensaje: mensaje.trim(),
    });

    if (!sent) {
      res.status(500).json({
        success: false,
        error: 'No se pudo enviar el mensaje. Intentá más tarde.',
      });
      return;
    }

    // 6. Registrar el envío para el cooldown
    lastSentByIp.set(ip, Date.now());

    console.log(`[CONTACT] Mensaje recibido de ${nombre} <${email}>`);

    res.json({ success: true });
  } catch (error) {
    console.error('[CONTACT] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor.',
    });
  }
});

export default router;