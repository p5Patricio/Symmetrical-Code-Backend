/**
 * Validation & Sanitization Helpers
 */

export function sanitizePhoneNumber(phone: string): string {
  // Remove non-digit characters except a leading plus if present
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  return cleaned;
}

export function isValidPhoneNumber(phone: string): boolean {
  // Simple E.164 international phone number format check (+ followed by 7 to 15 digits)
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  return phoneRegex.test(sanitizePhoneNumber(phone));
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text.trim().slice(0, 4000); // limit length to prevent payload flooding
}
