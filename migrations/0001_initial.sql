-- Symmetrical Code Bot — Initial D1 Database Schema
-- Migration: 0001_initial.sql

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 2. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    phone TEXT NOT NULL,
    bot_active INTEGER NOT NULL DEFAULT 1,
    human_requested INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'BOT_ACTIVE', -- BOT_ACTIVE | HUMAN_REQUESTED | HUMAN_ACTIVE | CLOSED
    last_intent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- 3. Messages Table (with message_id uniqueness for idempotency)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id TEXT UNIQUE NOT NULL, -- WhatsApp message ID
    direction TEXT NOT NULL,         -- 'inbound' | 'outbound'
    message_type TEXT NOT NULL DEFAULT 'text', -- 'text' | 'interactive' | 'image' | 'system'
    content TEXT NOT NULL,
    raw_payload TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_msg_id ON messages(message_id);

-- 4. Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    conversation_id TEXT REFERENCES conversations(id),
    name TEXT,
    phone TEXT NOT NULL,
    company TEXT,
    project_type TEXT,
    description TEXT,
    timeline TEXT,
    budget TEXT,
    status TEXT NOT NULL DEFAULT 'NEW', -- 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISQUALIFIED'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- 5. Services Catalog
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    features TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Projects / Portfolio
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tech_stack TEXT,
    url TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Knowledge Base
CREATE TABLE IF NOT EXISTS knowledge_base (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL, -- 'company' | 'services' | 'faq' | 'process' | 'boundaries'
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category);

-- 8. Business & System Events
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    conversation_id TEXT REFERENCES conversations(id),
    event_type TEXT NOT NULL, -- 'lead_created' | 'quote_completed' | 'human_requested' | 'bot_enabled' | 'bot_disabled'
    payload TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- Seed Initial Verified Knowledge
INSERT OR IGNORE INTO knowledge_base (id, category, topic, content) VALUES
('kb-1', 'company', 'about', 'Symmetrical Code es un Software Studio boutique especializado en desarrollo de software a medida, aplicaciones web fullstack, plataformas SaaS, dashboards y herramientas internas con altos estándares de arquitectura y diseño.'),
('kb-2', 'company', 'contact', 'Sitio web oficial: https://www.symmetricalcode.com/ | Modalidad: 100% remoto internacional | Idiomas de atención: Español e Inglés.'),
('kb-3', 'boundaries', 'out_of_scope', 'Symmetrical Code NO ofrece servicios de marketing digital, campañas publicitarias/ads, community management, ni creación de logotipos desde cero sin desarrollo asociado.'),
('kb-4', 'services', 'pricing_policy', 'Los precios nunca son fijos ni genéricos: dependen del alcance, requerimientos técnicos, integraciones y plazos del proyecto. El bot recopila los detalles preliminares y el equipo humano elabora una cotización personalizada.');

INSERT OR IGNORE INTO services (id, slug, title, description, features, active) VALUES
('srv-1', 'fullstack-web', 'Desarrollo Web Fullstack', 'Aplicaciones web modernas y escalables con frontend interactivo y backend robusto.', 'Arquitectura limpia, APIs REST/GraphQL, bases de datos optimizadas', 1),
('srv-2', 'saas-platforms', 'Plataformas SaaS & B2B', 'Sistemas cloud para modelos de negocio recurrentes y plataformas multi-tenant.', 'Autenticación, roles, pasarelas de pago, paneles administrativos', 1),
('srv-3', 'dashboards-analytics', 'Dashboards & Paneles de Analítica', 'Visualización de datos de negocio y métricas clave en tiempo real.', 'Gráficos interactivos, reportes exportables, alta performance', 1),
('srv-4', 'ecommerce', 'E-commerce a Medida', 'Tiendas online personalizadas con control de inventario y pagos seguros.', 'Stripe, PayPal, pasarelas locales, gestión de pedidos', 1),
('srv-5', 'landing-pages', 'Landing Pages de Alto Rendimiento', 'Sitios corporativos y páginas de conversión con máxima velocidad y optimización SEO.', 'Diseño responsivo premium, Web Vitals optimizados, copywriting persuasivo', 1);
