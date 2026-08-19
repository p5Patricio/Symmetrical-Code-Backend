export interface Env {
  // Cloudflare D1 Binding
  DB: D1Database;

  // Environment mode
  ENVIRONMENT?: string;

  // Meta WhatsApp Cloud API Secrets / Variables
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_VERIFY_TOKEN: string;

  // Google Gemini API Secret
  GEMINI_API_KEY: string;

  // Telegram Bot API Secrets
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;

  // Admin secret for manual interventions
  ADMIN_API_KEY?: string;
}

export function validateEnv(env: Env): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!env.DB) missing.push('DB (D1 Binding)');
  if (!env.WHATSAPP_ACCESS_TOKEN) missing.push('WHATSAPP_ACCESS_TOKEN');
  if (!env.WHATSAPP_PHONE_NUMBER_ID) missing.push('WHATSAPP_PHONE_NUMBER_ID');
  if (!env.WHATSAPP_VERIFY_TOKEN) missing.push('WHATSAPP_VERIFY_TOKEN');
  if (!env.GEMINI_API_KEY) missing.push('GEMINI_API_KEY');

  return {
    valid: missing.length === 0,
    missing,
  };
}
