import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  PORT: Number(process.env.PORT) || 3001,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
} as const;

export function validateConfig(): void {
  if (!CONFIG.GROQ_API_KEY) {
    console.error('❌ ERROR: GROQ_API_KEY no está configurada.');
    console.error('   Creá un archivo .env basado en .env.example');
    console.error('   Obtené tu API key gratis en: https://console.groq.com/keys');
    process.exit(1);
  }
}
