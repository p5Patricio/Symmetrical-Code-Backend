import { Router } from 'express';
import { generateResponseForChannel } from '../services/groq.js';

const router = Router();

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;

// Verificación del webhook
router.get('/webhook/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[WHATSAPP] Webhook verificado ✅');
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

// Recibir mensajes de WhatsApp
router.post('/webhook/whatsapp', async (req, res) => {
    try {
        const body = req.body;

        // Verificar que es un mensaje de WhatsApp
        if (body.object !== 'whatsapp_business_account') {
            res.status(400).send('Not a WhatsApp event');
            return;
        }

        const changes = body.entry?.[0]?.changes?.[0]?.value;
        const message = changes?.messages?.[0];

        // Ignorar si no hay mensaje de texto
        if (!message || message.type !== 'text') {
            res.status(200).send('OK');
            return;
        }

        const from = message.from.replace(/^521(\d{10})$/, '52$1');      // número del usuario
        const text = message.text.body;  // texto del mensaje

        console.log(`[WHATSAPP] Mensaje de ${from}: ${text}`);

        // Generar respuesta con Groq
        const reply = await generateResponseForChannel(text, 'whatsapp');

        // Enviar respuesta al usuario por WhatsApp
        await sendWhatsAppMessage(from, reply);

        res.status(200).send('OK');
    } catch (error) {
        console.error('[WHATSAPP] Error:', error);
        res.status(500).send('Error');
    }
});

// Función para enviar mensajes
async function sendWhatsAppMessage(to: string, text: string) {
    const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('[WHATSAPP] Error enviando mensaje:', error);
    }
}

export default router;