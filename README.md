# 🤖 Symmetrical Code Bot — WhatsApp AI Assistant

Backend serverless para el asistente comercial 24/7 de **Symmetrical Code** construido sobre **Cloudflare Workers**, **Cloudflare D1** (SQLite edge), **Google Gemini API**, **Meta WhatsApp Cloud API** y **Telegram Bot API**.

---

## 🏗️ Arquitectura del Sistema

```text
CLIENTE (WhatsApp)
       │
       ▼
Meta WhatsApp Cloud API
       │
       │ POST /webhook (HTTPS)
       ▼
Cloudflare Worker (src/index.ts)
       │
       ├── 1. Control de Idempotencia (tabla messages vía message_id)
       ├── 2. Control de Estado de Conversación (tabla conversations)
       │
       ├── [Estado == HUMAN_REQUESTED | HUMAN_ACTIVE] ──> Silencio (Bot pausado)
       │
       └── [Estado == BOT_ACTIVE]
              │
              ├── 3. Detección Rápida de Intents (src/intents/)
              │       │
              │       ├── Si es HUMAN_HANDOFF -> Desactiva bot, notifica Telegram y envía acuse
              │       │
              │       └── Si es Consulta / Cotización ->
              │               ├── Consulta catálogo y contexto en D1 (src/knowledge/)
              │               ├── Consulta a Google Gemini API (src/ai/)
              │               ├── Si se completó captura de lead -> Guarda lead y notifica Telegram
              │               └── Envía respuesta oficial al cliente vía WhatsApp Cloud API
              ▼
WhatsApp Cloud API ──> CLIENTE
```

---

## 🛠️ Stack Tecnológico

- **Runtime:** Cloudflare Workers (TypeScript, Edge V8)
- **Persistencia:** Cloudflare D1 (SQLite serverless)
- **Canal de Mensajería:** Meta WhatsApp Business Platform — Cloud API (`v21.0`)
- **Inteligencia Artificial:** Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`)
- **Notificaciones del Equipo:** Telegram Bot API
- **Testing:** Vitest

---

## 📁 Estructura del Proyecto

```text
symmetrical-whatsapp-assistant/
│
├── AGENTS.md                   # Normas y guía para agentes de IA
├── README.md                   # Esta documentación
├── package.json                # Dependencias y scripts
├── tsconfig.json               # Configuración estricta de TypeScript
├── wrangler.toml               # Configuración de Worker y D1
├── .dev.vars.example           # Plantilla de secretos locales
│
├── migrations/
│   └── 0001_initial.sql        # Esquema inicial D1
│
├── src/
│   ├── index.ts                # Router principal y entrypoint del Worker
│   ├── config/env.ts           # Variables de entorno tipadas
│   ├── webhook/
│   │   ├── verify.ts           # GET /webhook (Meta verification)
│   │   └── handler.ts          # POST /webhook (Procesamiento de mensajes)
│   ├── whatsapp/
│   │   ├── client.ts           # Cliente oficial WhatsApp Cloud API
│   │   ├── messages.ts         # Constructores de payloads
│   │   └── templates.ts        # Respuestas estándar y plantillas
│   ├── ai/
│   │   ├── gemini.ts           # Cliente REST de Google Gemini
│   │   ├── prompts.ts          # System prompt con directivas anti-alucinación
│   │   └── router.ts           # Orquestador IA y contexto D1
│   ├── conversations/
│   │   ├── repository.ts       # Repositorio D1 para mensajes e historial
│   │   ├── service.ts          # Ciclo de vida de conversaciones
│   │   └── state.ts            # Máquina de estados (BOT_ACTIVE, HUMAN_REQUESTED, etc.)
│   ├── leads/
│   │   ├── repository.ts       # Repositorio D1 de leads
│   │   └── service.ts          # Calificación y captura estructurada de leads
│   ├── knowledge/
│   │   ├── company.ts          # Perfil verificado de la empresa
│   │   ├── services.ts         # Catálogo de servicios oficiales
│   │   ├── projects.ts         # Portafolio de proyectos
│   │   └── faq.ts              # FAQ y límites fuera de alcance
│   ├── notifications/
│   │   └── telegram.ts         # Alertas internas a Telegram
│   ├── intents/
│   │   ├── detect.ts           # Detección determinista de intents
│   │   └── types.ts            # Tipos de intents
│   └── utils/
│       ├── logger.ts           # Logger seguro con sanitización de secretos
│       └── validation.ts       # Validaciones y sanitización
│
└── tests/
    ├── intents.test.ts         # Pruebas de detección de intents
    ├── conversations.test.ts   # Pruebas de máquina de estados
    └── leads.test.ts           # Pruebas de calificación de leads
```

---

## 🚀 Guía de Inicio y Desarrollo Local

### 1. Requisitos Previos
- **Node.js**: v18+ (recomendado v20+ o v24+)
- **npm**: v9+
- Cuenta de **Cloudflare** (con Wrangler instalado o vía npx)
- API Key de **Google Gemini**
- Cuenta de Desarrollador en **Meta for Developers** con WhatsApp Cloud API configurado
- Bot de **Telegram** (creado vía `@BotFather`) y Chat ID

---

### 2. Instalación de Dependencias
```bash
npm install
```

---

### 3. Configuración de Variables Locales

Copia el archivo de ejemplo y completa tus credenciales:
```bash
cp .dev.vars.example .dev.vars
```

Edita `.dev.vars`:
```env
WHATSAPP_ACCESS_TOKEN=tu_access_token_de_meta
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_VERIFY_TOKEN=token_seguro_que_elijas_para_el_webhook
GEMINI_API_KEY=tu_gemini_api_key
TELEGRAM_BOT_TOKEN=tu_telegram_bot_token
TELEGRAM_CHAT_ID=tu_telegram_chat_id
ADMIN_API_KEY=clave_secreta_para_endpoints_administrativos
```

---

### 4. Inicializar y Migrar la Base de Datos Local (D1)
```bash
npm run d1:migrate:local
```

---

### 5. Ejecutar Pruebas y Compilación
```bash
# Verificar tipos de TypeScript
npm run typecheck

# Ejecutar suite de pruebas unitarias con Vitest
npm test
```

---

### 6. Ejecutar Servidor Local de Desarrollo
```bash
npm run dev
```
El Worker estará escuchando en `http://localhost:8787`.

Endpoints disponibles:
- `GET http://localhost:8787/health` → Estado del worker y validación de variables.
- `GET http://localhost:8787/webhook` → Verificación de webhook de Meta.
- `POST http://localhost:8787/webhook` → Recepción de eventos de WhatsApp.
- `POST http://localhost:8787/api/admin/bot-state` → Pausar o reanudar el bot manualmente para un teléfono.

---

## ☁️ Despliegue a Producción (Cloudflare)

### 1. Crear Base de Datos D1 en Cloudflare
```bash
npx wrangler d1 create symmetrical-code-db
```
Copia el `database_id` devuelto y colócalo en tu `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "symmetrical-code-db"
database_id = "tu-database-id-aqui"
```

### 2. Aplicar Migraciones en D1 Remoto
```bash
npm run d1:migrate:remote
```

### 3. Configurar Secretos en Cloudflare Workers
```bash
npx wrangler secret put WHATSAPP_ACCESS_TOKEN
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
npx wrangler secret put WHATSAPP_VERIFY_TOKEN
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put ADMIN_API_KEY
```

### 4. Desplegar Worker
```bash
npm run deploy
```

---

## 🔗 Configuración de Webhook en Meta for Developers

1. Ve a tu aplicación en [Meta for Developers](https://developers.facebook.com/).
2. En la sección **WhatsApp** → **Configuración** → **Webhook**:
   - **URL de devolución de llamada:** `https://symmetrical-code-bot.<tu-subdominio>.workers.dev/webhook`
   - **Token de verificación:** El mismo valor configurado en `WHATSAPP_VERIFY_TOKEN`.
3. Haz clic en **Verificar y guardar**.
4. En los campos de suscripción del webhook, activa **`messages`**.

---

## 🛡️ Reglas de Seguridad y Costos

- **Idempotencia:** Cada `message_id` entrante se registra de forma única en SQLite D1. Reintentos de Meta no generan respuestas duplicadas ni alertas duplicadas.
- **Sin Costos Sorpresa:** El sistema opera completamente bajo los tiers gratuitos de Cloudflare Workers (100,000 req/día), D1 (5M lecturas/día) y Gemini API.
- **Handoff Humano Seguro:** Si el usuario solicita un humano o el equipo toma el control en WhatsApp, el bot se desactiva inmediatamente para ese chat, evitando respuestas simultáneas.
