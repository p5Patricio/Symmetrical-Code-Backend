import { Router } from 'express';
import { generateResponseForChannel } from '../services/groq.js';

const router = Router();

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN!;
const VERIFY_TOKEN    = process.env.WHATSAPP_VERIFY_TOKEN!;

// Guarda IDs de mensajes ya procesados (se limpia cada hora)
const processedMessages = new Set<string>();
setInterval(() => processedMessages.clear(), 60 * 60 * 1000);

router.get('/webhook/whatsapp', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WHATSAPP] Webhook verificado ✅');
    res.status(200).send(challenge);
  } else {
    console.error('[WHATSAPP] Token incorrecto ❌');
    res.status(403).send('Forbidden');
  }
});

router.post('/webhook/whatsapp', (req, res) => {
  res.status(200).send('OK');

  const body = req.body;

  if (body.object !== 'whatsapp_business_account') return;

  const changes = body.entry?.[0]?.changes?.[0]?.value;
  const message = changes?.messages?.[0];

  if (!message || message.type !== 'text') return;

  // ✅ Ignorar si ya procesamos este mensaje
  const messageId = message.id;
  if (processedMessages.has(messageId)) {
    console.log(`[WHATSAPP] Mensaje duplicado ignorado: ${messageId}`);
    return;
  }
  processedMessages.add(messageId);

  const rawFrom = message.from;
  const text    = message.text.body;
  const from    = rawFrom.replace(/^521(\d{10})$/, '52$1');

  console.log(`[WHATSAPP] Mensaje de ${from}: ${text}`);
  console.log('[WHATSAPP] Procesando mensaje...');

  (async () => {
    try {
      const reply = await generateResponseForChannel(text, 'whatsapp');
      await sendWhatsAppMessage(from, reply);
      console.log(`[WHATSAPP] Respuesta enviada a ${from} ✅`);
    } catch (error) {
      console.error('[WHATSAPP] Error procesando mensaje:', error);
    }
  })();
});

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