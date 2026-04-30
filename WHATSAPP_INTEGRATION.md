# 📱 Guía de Integración - WhatsApp + Symmetrical Code Chatbot

> **Para:** El compañero que se encarga de conectar el chatbot a WhatsApp.
> **Desde:** El equipo de Symmetrical Code.
>
> Esta guía te explica paso a paso cómo conectar la **WhatsApp Cloud API de Meta** al backend del chatbot.

---

## 🎯 Resumen

El backend ya está construido y tiene un endpoint listo para recibir mensajes de WhatsApp. **Vos solo tenés que:**

1. Crear una app en Meta Developers.
2. Conectar un número de teléfono a WhatsApp Business API.
3. Configurar un webhook que apunte al backend.
4. Enviar los mensajes de WhatsApp al endpoint `/api/webhook/whatsapp`.
5. Recibir la respuesta de la IA y reenviarla al usuario por WhatsApp.

---

## 🏗️ Arquitectura General

```
┌─────────────────┐      ┌─────────────────────────────┐      ┌─────────────────┐
│   USUARIO       │      │   BACKEND (ya construido)   │      │   META CLOUD    │
│   (WhatsApp)    │◄────►│                             │◄────►│   API           │
│                 │      │  POST /api/webhook/whatsapp │      │   (WhatsApp)    │
└─────────────────┘      │       ↓                     │      └─────────────────┘
                         │  Procesa con Gemini IA      │
                         │       ↓                     │
                         │  Devuelve respuesta JSON    │
                         └─────────────────────────────┘
```

---

## ✅ Paso 1: Crear App en Meta Developers

1. Andá a [https://developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Clickeá **"Create App"**
3. Seleccioná **"Business"** como tipo de app
4. Completá los datos básicos

---

## ✅ Paso 2: Agregar Producto WhatsApp

1. Dentro de tu app, andá a **"Add Product"**
2. Seleccioná **"WhatsApp"**
3. Asociá un **Business Account** (o creá uno nuevo, es gratis)

---

## ✅ Paso 3: Número de Teléfono

### Opción A: Sandbox (para probar, gratis)
- Meta te da un número de teléfono de prueba automáticamente.
- Podés agregar hasta 5 números de prueba en la sección "To" del sandbox.
- Mandale un WhatsApp a ese número desde tu celular para iniciar.

### Opción B: Número real (para producción)
- Necesitás un número de teléfono que pueda recibir SMS o llamada de voz.
- Andá a **WhatsApp > Getting Started > Add Phone Number**
- Seguí el proceso de verificación.
- ⚠️ **IMPORTANTE:** Una vez migrado a la API, ese número NO puede volver a usar la app de WhatsApp Business normal.

---

## ✅ Paso 4: Obtener Credenciales

Andá a la sección **WhatsApp > Getting Started** y anotá:

| Dato | Dónde encontrarlo | Para qué sirve |
|------|-------------------|----------------|
| **Access Token** | Se genera en el panel | Autenticar tus requests a la API |
| **Phone Number ID** | Se muestra en el panel | Identificar el número que envía mensajes |
| **WhatsApp Business Account ID** | Se muestra en el panel | Identificar la cuenta de negocio |

**Recomendación:** Generá un **Permanent Token** en lugar del token temporal. Para eso:
1. Andá a **System Users** en Business Manager
2. Creá un System User
3. Asignale el rol de Admin en tu WhatsApp Business Account
4. Generá un token permanente con el scope `whatsapp_business_messaging`

---

## ✅ Paso 5: Configurar el Webhook

El webhook es la URL donde Meta enviará los mensajes que reciba tu número.

### 5.1 El backend ya tiene el endpoint listo:

```
POST http://localhost:3001/api/webhook/whatsapp
```

Pero Meta necesita una URL pública. Tenés dos opciones:

#### Opción A: Ngrok (para desarrollo/local)
```bash
# Instalar ngrok: https://ngrok.com/download
# Crear cuenta gratuita

ngrok http 3001

# Te dará una URL pública tipo:
# https://abc123.ngrok-free.app
```

Luego en Meta Developers configurás:
- **Callback URL:** `https://abc123.ngrok-free.app/api/webhook/whatsapp`
- **Verify Token:** creá uno vos (ej: `symmetrical_webhook_2025`)

#### Opción B: Deploy en la nube (para producción)
- Deployar el backend en Vercel, Railway, Render, o cualquier VPS.
- Usar la URL pública del deploy.

### 5.2 En Meta Developers:

1. Andá a **WhatsApp > Configuration**
2. En **Webhook**, clickeá **Edit**
3. **Callback URL:** `https://tu-url/api/webhook/whatsapp`
4. **Verify Token:** el que definiste arriba
5. Clickeá **Verify and Save**
6. Suscribite al evento: `messages`

---

## ✅ Paso 6: Probar el Flujo Completo

### 6.1 Enviar un mensaje (desde tu código o herramienta HTTP)

Meta te enviará un webhook cuando alguien te escriba. La estructura del payload es similar a:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "5491123456789",
          "id": "wamid.XXX",
          "timestamp": "1234567890",
          "type": "text",
          "text": { "body": "Hola, ¿qué servicios ofrecen?" }
        }]
      }
    }]
  }]
}
```

### 6.2 Tu código debe extraer el mensaje y enviarlo al backend

```javascript
// Ejemplo en Node.js (lo que vos tenés que implementar)

const BACKEND_URL = 'https://tu-backend.com/api/webhook/whatsapp';

async function handleWhatsAppWebhook(metaPayload) {
  const message = metaPayload.entry[0].changes[0].value.messages[0];
  const from = message.from; // número del usuario
  const text = message.text.body; // texto del mensaje

  // Enviar al backend de Symmetrical Code
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: 'whatsapp',
      userId: from,
      message: text,
      timestamp: new Date().toISOString(),
    }),
  });

  const data = await response.json();

  if (data.success) {
    // Enviar la respuesta de vuelta al usuario por WhatsApp
    await sendWhatsAppMessage(from, data.reply);
  }
}

// Función para enviar mensaje por WhatsApp API
async function sendWhatsAppMessage(to, text) {
  const PHONE_NUMBER_ID = 'TU_PHONE_NUMBER_ID';
  const ACCESS_TOKEN = 'TU_ACCESS_TOKEN';

  await fetch(`https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text },
    }),
  });
}
```

---

## ✅ Paso 7: Verificar la Firma del Webhook (Seguridad)

Meta firma los webhooks con una clave secreta. Verificá la firma para evitar requests falsos:

```javascript
import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, appSecret) {
  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(payload, 'utf8')
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}
```

---

## 📊 Costos de WhatsApp API

| Concepto | Costo |
|----------|-------|
| Acceso a la API | **Gratis** |
| Meta Business Manager | **Gratis** |
| Verificación de negocio | **Gratis** |
| **Conversaciones de servicio** (cliente escribe primero) | **1,000 GRATIS al mes** |
| Conversaciones extra | ~$0.03 USD por conversación de 24h |

> 💡 Para una startup con poco volumen, **WhatsApp es prácticamente gratis**.

---

## 🆘 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Webhook verification failed" | Asegurate de que la URL pública esté accesible y responda el challenge de Meta. |
| "Message not delivered" | Verificá que el número del destinatario esté en formato internacional (sin +). Ej: `5491123456789` |
| "Invalid Access Token" | Generá un token permanente en System Users, no uses el token temporal del sandbox. |
| "Number not registered" | Si es un número real, asegurate de haber completado la verificación en Meta Business Manager. |
| "Rate limit exceeded" | Meta limita los mensajes por segundo. Si tenés mucho tráfico, implementá un queue. |

---

## 🔗 Recursos Útiles

- **Meta WhatsApp Cloud API Docs:** [https://developers.facebook.com/docs/whatsapp/cloud-api](https://developers.facebook.com/docs/whatsapp/cloud-api)
- **Webhook Setup Guide:** [https://developers.facebook.com/docs/whatsapp/webhooks](https://developers.facebook.com/docs/whatsapp/webhooks)
- **WhatsApp API Pricing:** [https://business.whatsapp.com/products/whatsapp-business-api/pricing](https://business.whatsapp.com/products/whatsapp-business-api/pricing)
- **Graph API Explorer:** [https://developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)

---

## 📞 Contacto

Si tenés dudas sobre el backend o necesitás cambiar algo, hablá con el equipo de Symmetrical Code. El backend corre en:

```
POST /api/webhook/whatsapp
```

Y responde con:

```json
{
  "success": true,
  "reply": "Texto de respuesta generado por la IA"
}
```

**¡Éxitos con la integración! 🚀**
