# 🤖 Symmetrical Code Backend - Chatbot API

Backend del chatbot inteligente para **Symmetrical Code**.

> ⚠️ **IMPORTANTE:** El código activo de desarrollo está en la rama **`patodev`**. La rama `main` se mantiene limpia hasta que el equipo decida hacer merge.

## 📂 Ramas

| Rama | Propósito |
|------|-----------|
| `main` | Código estable (actualmente vacío, solo este README) |
| `patodev` | Desarrollo activo del chatbot |

## 🚀 Empezar

```bash
# Clonar el repo
git clone https://github.com/p5Patricio/Symmetrical-Code-Backend.git

# Cambiar a la rama de desarrollo
git checkout patodev

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editá .env y agregá tu GROQ_API_KEY

# Correr en desarrollo
npm run dev
```

## 📁 Estructura (en rama `patodev`)

```
backend/
├── src/
│   ├── index.ts              # Servidor Express
│   ├── config.ts             # Variables de entorno
│   ├── routes/
│   │   └── chat.ts           # Endpoints /chat y /webhook/whatsapp
│   ├── services/
│   │   └── groq.ts           # Integración Groq API (Llama 3.3 70B)
│   ├── data/
│   │   └── startupContext.ts # Conocimiento de Symmetrical Code
│   └── types/
│       └── index.ts
├── WHATSAPP_INTEGRATION.md   # Guía para integrar WhatsApp
└── ...
```

## 📡 Endpoints

- `POST /api/chat` → Chat desde la web
- `POST /api/webhook/whatsapp` → Webhook de WhatsApp
- `GET /api/health` → Health check

## 📱 Integración WhatsApp

Ver [WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md) en la rama `patodev`.

## 🏷️ Licencia

MIT - Symmetrical Code Team
