import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  PORT: Number(process.env.PORT) || 3001,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite-preview-06-17',
} as const;

export function validateConfig(): void {
  if (!CONFIG.GEMINI_API_KEY) {
    console.error('❌ ERROR: GEMINI_API_KEY no está configurada.');
    console.error('   Creá un archivo .env basado en .env.example');
    console.error('   Obtené tu API key gratis en: https://aistudio.google.com/app/apikey');
    process.exit(1);
  }
}
