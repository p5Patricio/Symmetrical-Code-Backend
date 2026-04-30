# 🤖 Symmetrical Code Backend - Chatbot API

Backend del chatbot inteligente para **Symmetrical Code**, un Software Studio especializado en desarrollo de soluciones digitales a medida.

## 🏗️ Arquitectura

Este backend expone una API REST que actúa como **cerebro único** del chatbot. Atiende múltiples canales:

| Canal | Endpoint | Estado |
|-------|----------|--------|
| 🌐 Web (widget de la página) | `POST /api/chat` | ✅ Implementado |
| 📱 WhatsApp | `POST /api/webhook/whatsapp` | 🔌 Listo para conectar |

**El mismo motor de IA (Google Gemini) responde en ambos canales**, usando el mismo contexto y conocimiento sobre Symmetrical Code.

## 🚀 Tecnologías

- **Node.js** + **Express** + **TypeScript**
- **Google Gemini API** (nivel gratuito: 1,500 requests/día)
- **CORS** para comunicación segura con el frontend

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── index.ts              # Punto de entrada del servidor
│   ├── config.ts             # Variables de entorno
│   ├── routes/
│   │   └── chat.ts           # Endpoints /api/chat y /api/webhook/whatsapp
│   ├── services/
│   │   └── gemini.ts         # Integración con Google Gemini
│   ├── data/
│   │   └── startupContext.ts # System prompt con info de Symmetrical Code
│   └── types/
│       └── index.ts          # Tipos TypeScript
├── .env.example              # Ejemplo de variables de entorno
├── package.json
└── tsconfig.json
```

## ⚙️ Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editá `.env` y agregá tu **Google Gemini API Key** (gratis):

```env
PORT=3001
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=tu_api_key_aqui
GEMINI_MODEL=gemini-2.5-flash-lite-preview-06-17
```

> 💡 **Obtener API Key gratuita:** [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
> El plan gratuito incluye **1,500 requests/día** con Gemini 2.5 Flash-Lite.

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

El servidor arranca en `http://localhost:3001`.

## 📡 Endpoints

### `POST /api/chat`

Chat desde el widget web.

**Request:**
```json
{
  "message": "¿Qué servicios ofrecen?",
  "history": [
    { "role": "user", "text": "Hola" },
    { "role": "model", "text": "¡Hola! Soy el asistente de Symmetrical Code..." }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "reply": "Ofrecemos desarrollo web fullstack, e-commerce, SaaS B2B..."
}
```

### `POST /api/webhook/whatsapp`

Webhook para integración con WhatsApp (ver [WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md)).

### `GET /api/health`

Health check del servidor.

## 📝 Actualizar el Conocimiento del Chatbot

Para modificar lo que el chatbot sabe sobre la startup, editá el archivo:

```
src/data/startupContext.ts
```

Ahí está el `SYSTEM_PROMPT` que se envía a Gemini en cada conversación. Actualizá:
- Servicios y precios
- Miembros del equipo
- Proyectos destacados
- Políticas de la empresa

## 🤝 Integración WhatsApp

Si tu compañero se encarga de la integración con WhatsApp, pasale el archivo:

👉 **[WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md)**

Ahí tiene toda la documentación necesaria.

## 🏷️ Licencia

MIT - Symmetrical Code Team
