/**
 * Safe Structured Logger
 * Sanitizes tokens, keys, and phone numbers to prevent credential leakage.
 */

const SENSITIVE_PATTERNS = [
  /(?:Bearer\s+)([A-Za-z0-9_\-\.]{15,})/gi,
  /(?:key=)([A-Za-z0-9_\-\.]{15,})/gi,
  /(?:token=)([A-Za-z0-9_\-\.]{15,})/gi,
  /(?:bot\d+:)([A-Za-z0-9_\-\.]{25,})/gi,
];

function sanitize(message: string): string {
  let clean = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    clean = clean.replace(pattern, '[REDACTED_SECRET]');
  }
  return clean;
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'INFO', message: sanitize(msg), ...(meta || {}), timestamp: new Date().toISOString() }));
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'WARN', message: sanitize(msg), ...(meta || {}), timestamp: new Date().toISOString() }));
  },
  error: (msg: string, error?: unknown, meta?: Record<string, unknown>) => {
    const errorDetails = error instanceof Error ? { errorName: error.name, errorMessage: error.message, stack: error.stack } : { rawError: String(error) };
    console.error(JSON.stringify({ level: 'ERROR', message: sanitize(msg), ...errorDetails, ...(meta || {}), timestamp: new Date().toISOString() }));
  },
};
