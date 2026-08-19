# AGENTS.md — Symmetrical Code Bot

> **Authoritative Guide for AI Coding Agents and Developers**  
> Every AI agent working on this codebase must strictly adhere to the guidelines, architectural boundaries, and safety constraints documented in this file.

---

## 1. Project Purpose & Scope

**Symmetrical Code Bot** is the official 24/7 commercial WhatsApp assistant for **Symmetrical Code** (software studio specializing in high-standard custom digital solutions, web development, SaaS, and internal tools).

### Primary Capabilities:
1. Explain Symmetrical Code's identity, value proposition, and verified services.
2. Showcase real past projects and case studies.
3. Answer questions strictly limited to Symmetrical Code and its service offerings.
4. Guide prospective clients naturally through an initial discovery conversation.
5. Collect preliminary structured details for custom quote scoping.
6. Detect when a client requests human attention or when a commercial milestone is reached.
7. Seamlessly hand off the conversation to human team members on the same WhatsApp Business number.
8. Send instant internal alerts to the team via Telegram.

---

## 2. Hard Constraints & Prohibitions

> [!CAUTION]
> **STRICT COMPLIANCE REQUIRED:**
> - **NEVER** implement or suggest unofficial WhatsApp integrations (e.g., Baileys, WhatsApp Web automation, Selenium, Playwright, reverse-engineered APIs, or unverified wrappers). All communication MUST go through the official **Meta WhatsApp Cloud API**.
> - **NEVER** invent prices, estimates, fake projects, or unsupported services. The AI must only state prices depend on scope and offer quotation scoping by the team.
> - **NEVER** print, log, or expose secrets (`WHATSAPP_ACCESS_TOKEN`, `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `ADMIN_API_KEY`) in HTTP responses, git commits, or console logs.
> - **NEVER** introduce expensive persistent servers (VPS), Kubernetes, Docker, Redis, or heavy external databases. This system is designed serverless on **Cloudflare Workers + D1** (Free Tier safety first).

---

## 3. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Runtime** | Cloudflare Workers | TypeScript, V8 Isolate Serverless Edge |
| **Database** | Cloudflare D1 | Serverless SQLite database at the edge |
| **Messaging Channel** | Meta WhatsApp Cloud API | Official Graph API (`v21.0` / `v22.0`) |
| **Intelligence (AI)** | Google Gemini API | REST / `@google/genai` (Fast, structured, low-latency) |
| **Team Alerts** | Telegram Bot API | Internal notifications channel for leads & handoffs |
| **Testing** | Vitest | Fast unit testing for state machine, intents, and idempotency |

---

## 4. Architecture & Data Flow

```text
CLIENT (WhatsApp)
       │
       ▼
Meta WhatsApp Cloud API
       │
       │ POST /webhook (HTTPS)
       ▼
Cloudflare Worker (src/index.ts)
       │
       ├── 1. Idempotency Check (messages table via message_id)
       ├── 2. Conversation State Resolution (conversations table)
       │
       ├── [State == HUMAN_REQUESTED | HUMAN_ACTIVE] ──> Silent / Log only (Bot paused)
       │
       └── [State == BOT_ACTIVE]
              │
              ├── 3. Intent Detection & Safety Filter (src/intents/)
              │       │
              │       ├── If HUMAN_HANDOFF -> Transition state, notify Telegram, send handoff ack
              │       │
              │       └── If QUOTE / INQUIRY ->
              │               ├── Fetch relevant knowledge from D1 (src/knowledge/)
              │               ├── Prompt Gemini (src/ai/)
              │               ├── Process response & extract structured lead data
              │               ├── If lead completed -> Persist lead, notify Telegram
              │               └── Send response to user via WhatsApp Cloud API
              ▼
WhatsApp Cloud API ──> CLIENT
```

---

## 5. Project Directory Structure

```text
symmetrical-whatsapp-assistant/
│
├── AGENTS.md                   # This instruction file
├── README.md                   # General documentation & setup guide
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript strict configuration
├── wrangler.toml               # Cloudflare Workers & D1 configuration
├── .gitignore                  # Git ignore rules
├── .dev.vars.example           # Example local environment secrets
│
├── migrations/
│   └── 0001_initial.sql        # Initial D1 schema (users, conversations, messages, etc.)
│
├── src/
│   ├── index.ts                # Main worker fetch dispatcher & router
│   │
│   ├── config/
│   │   └── env.ts              # Strongly-typed environment variables & bindings
│   │
│   ├── webhook/
│   │   ├── verify.ts           # GET /webhook Meta verification
│   │   └── handler.ts          # POST /webhook payload parser & dispatcher
│   │
│   ├── whatsapp/
│   │   ├── client.ts           # WhatsApp Cloud API client (send text, interactive)
│   │   ├── messages.ts         # Message builder helpers
│   │   └── templates.ts        # WhatsApp message template definitions
│   │
│   ├── ai/
│   │   ├── gemini.ts           # Google Gemini API client
│   │   ├── prompts.ts          # Symmetrical Code system prompt & grounding rules
│   │   └── router.ts           # AI orchestration with D1 context
│   │
│   ├── conversations/
│   │   ├── repository.ts       # D1 queries for conversations & history
│   │   ├── service.ts          # Conversation lifecycle management
│   │   └── state.ts            # State machine (BOT_ACTIVE, HUMAN_REQUESTED, etc.)
│   │
│   ├── leads/
│   │   ├── repository.ts       # D1 queries for leads table
│   │   └── service.ts          # Lead data validation, updates & completion logic
│   │
│   ├── knowledge/
│   │   ├── company.ts          # Verified company profile data
│   │   ├── services.ts         # Official services catalog
│   │   ├── projects.ts         # Verified projects & portfolio
│   │   └── faq.ts              # FAQ definitions & out-of-scope boundaries
│   │
│   ├── notifications/
│   │   └── telegram.ts         # Telegram Bot API notification client
│   │
│   ├── intents/
│   │   ├── detect.ts           # Intent detection (keywords, regex & AI fallback)
│   │   └── types.ts            # Intent type definitions & interfaces
│   │
│   └── utils/
│       ├── logger.ts           # Safe logger with secret sanitization
│       └── validation.ts       # Input sanitization and phone validators
│
└── tests/
    ├── intents.test.ts         # Intent classification tests
    ├── conversations.test.ts   # State transitions & idempotency tests
    └── leads.test.ts           # Lead capture & completion tests
```

---

## 6. Conversation State Machine

Every conversation has a deterministic state:

- **`BOT_ACTIVE`**: The AI assistant responds automatically to incoming messages.
- **`HUMAN_REQUESTED`**: The user requested a human or an escalation was triggered. The bot stops responding automatically. An internal Telegram notification is sent.
- **`HUMAN_ACTIVE`**: A human team member is actively chatting with the customer via the WhatsApp Business App/Inbox. The bot remains silent.
- **`CLOSED`**: The conversation is concluded. New inbound messages re-open the conversation in `BOT_ACTIVE` state.

---

## 7. Commands & Common Tasks

### Development & Execution
```bash
# Install dependencies
npm install

# Run local development worker with D1 local database
npm run dev

# Run TypeScript typecheck
npm run typecheck

# Run unit tests
npm test

# Apply D1 migrations locally
npm run d1:migrate:local

# Apply D1 migrations to remote Cloudflare D1
npm run d1:migrate:remote

# Deploy to Cloudflare Workers
npm run deploy
```

---

## 8. Security & Environment Variables

| Variable | Scope | Description |
|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Secret | System User permanent access token from Meta Business Manager |
| `WHATSAPP_PHONE_NUMBER_ID` | Secret / Var | Phone Number ID from WhatsApp Cloud API dashboard |
| `WHATSAPP_VERIFY_TOKEN` | Secret / Var | Custom verification token configured in Meta Webhook settings |
| `GEMINI_API_KEY` | Secret | Google Gemini API key |
| `TELEGRAM_BOT_TOKEN` | Secret | Bot token from @BotFather for team alerts |
| `TELEGRAM_CHAT_ID` | Secret / Var | Telegram Group / Channel ID where alerts are delivered |
| `ADMIN_API_KEY` | Secret | Optional token to authorize administrative webhook endpoints |

Never commit `.dev.vars` or hardcode tokens into any source file.
