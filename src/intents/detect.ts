import { IntentType, IntentDetectionResult } from './types';

// Deterministic keywords and regex patterns for rapid rule-based classification
const HUMAN_HANDOFF_PATTERNS = [
  /\b(hablar|comunicar(me)?|contactar|comunicarme)\s+(con|a)\s+(un[a-z]*\s+)?(persona|humano|asesor|desarrollador|alguien|representante|miembro|agente)\b/i,
  /\b(quiero|necesito|prefiero|deseo)\s+(hablar\s+con\s+)?(un[a-z]*\s+)?(humano|persona|asesor|agente|operador|desarrollador|alguien)\b/i,
  /\b(me\s+)?(pasas|pasa|pasame|pásame|conectas|conecta|conectame|conéctame|transfiereme|transfiéreme)\s+(con\s+)?(un[a-z]*\s+)?(humano|alguien|asesor|persona|desarrollador)\b/i,
  /\b(atenci[oó]n\s+humana|soporte\s+humano|contacto\s+humano|ayuda\s+humana)\b/i,
  /\b(no\s+quiero\s+(un\s+)?bot|sos\s+un\s+bot|eres\s+un\s+bot|hablar\s+con\s+un\s+humano)\b/i,
];

const QUOTE_PATTERNS = [
  /\b(cu[aá]nto\s+cuesta|precio|precios|cotiza(r|ci[oó]n)?|presupuesto|cu[aá]nto\s+cobran|costo|tarifas)\b/i,
  /\b(quiero\s+desarrollar|necesito\s+una?\s+(app|web|p[aá]gina|sistema|software|plataforma))\b/i,
  /\b(tengo\s+un\s+proyecto|cotizame)\b/i,
];

const PROJECTS_PATTERNS = [
  /\b(proyectos|portafolio|trabajos|casos\s+de\s+[eé]xito|ejemplos\s+de\s+proyectos|que\s+han\s+hecho)\b/i,
];

const SERVICES_PATTERNS = [
  /\b(servicios|qu[eé]\s+hacen|qu[eé]\s+ofrecen|desarrollo\s+web|saas|ecommerce|landing\s+page|dashboard)\b/i,
];

const CONTACT_PATTERNS = [
  /\b(contacto|email|correo|d[oó]nde\s+est[aá]n|ubicaci[oó]n|tel[eé]fono|sitio\s+web|p[aá]gina\s+web)\b/i,
];

const OUT_OF_SCOPE_PATTERNS = [
  /\b(marketing\s+digital|redes\s+sociales|community\s+manager|publicidad|campa[nñ]as\s+de\s+ads|google\s+ads|facebook\s+ads)\b/i,
  /\b(receta|pol[ií]tica|f[uú]tbol|clima|chiste|hor[oó]scopo)\b/i,
];

/**
 * Deterministically detect intent based on regex rules.
 */
export function detectIntentFast(text: string): IntentDetectionResult {
  const normalized = text.trim();

  // 1. Critical priority: Human handoff request
  for (const pattern of HUMAN_HANDOFF_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        intent: 'HUMAN_HANDOFF',
        confidence: 1.0,
        reason: 'Matched deterministic human handoff trigger',
      };
    }
  }

  // 2. Out of scope detection
  for (const pattern of OUT_OF_SCOPE_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        intent: 'OUT_OF_SCOPE',
        confidence: 0.95,
        reason: 'Matched out-of-scope inquiry',
      };
    }
  }

  // 3. Quote & Scoping
  for (const pattern of QUOTE_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        intent: 'QUOTE',
        confidence: 0.9,
        reason: 'Matched quotation / project request pattern',
      };
    }
  }

  // 4. Projects & Portfolio
  for (const pattern of PROJECTS_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        intent: 'PROJECTS',
        confidence: 0.85,
        reason: 'Matched portfolio / projects query',
      };
    }
  }

  // 5. Services
  for (const pattern of SERVICES_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        intent: 'SERVICES',
        confidence: 0.85,
        reason: 'Matched services query',
      };
    }
  }

  // 6. Contact
  for (const pattern of CONTACT_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        intent: 'CONTACT',
        confidence: 0.8,
        reason: 'Matched contact info query',
      };
    }
  }

  // Default to general information exploration
  return {
    intent: 'GENERAL_INFORMATION',
    confidence: 0.5,
    reason: 'Default conversational inquiry',
  };
}
