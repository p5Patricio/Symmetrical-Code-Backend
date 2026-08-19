import { logger } from '../utils/logger';

export interface GeminiMessagePart {
  text: string;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiMessagePart[];
}

export interface GeminiResponsePayload {
  replyText: string;
  intent?: string;
  leadCaptured?: boolean;
  leadData?: {
    name?: string | null;
    company?: string | null;
    projectType?: string | null;
    description?: string | null;
    timeline?: string | null;
    budget?: string | null;
  };
}

export class GeminiClient {
  private apiKey: string;
  private primaryModel = 'gemini-3.1-flash-lite';
  private fallbackModel = 'gemini-2.5-flash-lite';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Calls Gemini REST API
   */
  async generateContent(
    systemInstruction: string,
    history: GeminiContent[],
    userInput: string
  ): Promise<GeminiResponsePayload | null> {
    if (!this.apiKey) {
      logger.error('Gemini API key is not configured');
      return null;
    }

    const contents = [
      ...history,
      {
        role: 'user',
        parts: [{ text: userInput }],
      },
    ];

    const body = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        responseMimeType: 'application/json',
      },
    };

    // Try primary model first, fallback if unavailable
    for (const model of [this.primaryModel, this.fallbackModel]) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          logger.warn(`Gemini API call failed for model ${model}`, { status: response.status, error: errText });
          continue;
        }

        const data: any = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
          logger.warn('Empty response text from Gemini');
          continue;
        }

        try {
          const parsed = JSON.parse(candidateText);
          return {
            replyText: parsed.replyText || '¡Hola! ¿En qué podemos ayudarte en Symmetrical Code?',
            intent: parsed.intent,
            leadCaptured: parsed.leadCaptured,
            leadData: parsed.leadData,
          };
        } catch {
          // If json parsing fails, use the raw text as replyText
          return {
            replyText: candidateText.trim(),
            intent: 'GENERAL_INFORMATION',
            leadCaptured: false,
          };
        }
      } catch (err) {
        logger.error(`Network error calling Gemini model ${model}`, err);
      }
    }

    return null;
  }
}
