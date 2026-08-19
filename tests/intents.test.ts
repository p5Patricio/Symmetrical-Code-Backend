import { describe, it, expect } from 'vitest';
import { detectIntentFast } from '../src/intents/detect';

describe('Intent Detection Suite', () => {
  describe('Human Handoff Detection', () => {
    it('detects explicit human requests in Spanish', () => {
      const inputs = [
        'quiero hablar con una persona',
        'necesito hablar con alguien',
        'me pasas con un humano por favor',
        'quiero contactar a un asesor',
        'quiero hablar con un desarrollador',
        'necesito atencion humana',
      ];

      for (const text of inputs) {
        const result = detectIntentFast(text);
        expect(result.intent).toBe('HUMAN_HANDOFF');
        expect(result.confidence).toBe(1.0);
      }
    });
  });

  describe('Out of Scope Detection', () => {
    it('identifies unoffered services such as marketing/ads', () => {
      const inputs = [
        'hacen marketing digital y manejo de redes?',
        'quiero campanas de google ads',
        'cual es la receta para hacer pizza',
      ];

      for (const text of inputs) {
        const result = detectIntentFast(text);
        expect(result.intent).toBe('OUT_OF_SCOPE');
      }
    });
  });

  describe('Quote and Services Inquiries', () => {
    it('identifies pricing and quotation queries', () => {
      const inputs = [
        'cuanto cuesta desarrollar una app web?',
        'quiero una cotizacion para un ecommerce',
        'cual es el precio de un software?',
      ];

      for (const text of inputs) {
        const result = detectIntentFast(text);
        expect(result.intent).toBe('QUOTE');
      }
    });

    it('identifies general services queries', () => {
      const inputs = [
        'cuales son sus servicios?',
        'que tipo de desarrollo web hacen?',
      ];

      for (const text of inputs) {
        const result = detectIntentFast(text);
        expect(result.intent).toBe('SERVICES');
      }
    });
  });
});
