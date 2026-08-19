import { GeminiClient, GeminiContent, GeminiResponsePayload } from './gemini';
import { buildSystemPrompt } from './prompts';
import { getServicesFromDb } from '../knowledge/services';
import { getProjectsFromDb } from '../knowledge/projects';
import { DbMessage } from '../conversations/repository';
import { TEMPLATES } from '../whatsapp/templates';
import { logger } from '../utils/logger';

export class AIRouter {
  private gemini: GeminiClient;

  constructor(apiKey: string, private db: D1Database) {
    this.gemini = new GeminiClient(apiKey);
  }

  /**
   * Orchestrates prompt creation, context retrieval and Gemini response generation
   */
  async handleConversation(
    userInput: string,
    historyMessages: DbMessage[]
  ): Promise<GeminiResponsePayload> {
    try {
      // 1. Fetch current knowledge
      const [services, projects] = await Promise.all([
        getServicesFromDb(this.db),
        getProjectsFromDb(this.db),
      ]);

      const systemPrompt = buildSystemPrompt(services, projects);

      // 2. Format history for Gemini
      const formattedHistory: GeminiContent[] = historyMessages.map((msg) => ({
        role: msg.direction === 'inbound' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // 3. Request AI completion
      const response = await this.gemini.generateContent(systemPrompt, formattedHistory, userInput);

      if (response) {
        return response;
      }

      // Safe fallback if Gemini fails
      logger.warn('AI response generation returned null, using safe fallback');
      return {
        replyText: TEMPLATES.GENERIC_ERROR_FALLBACK,
        intent: 'GENERAL_INFORMATION',
        leadCaptured: false,
      };
    } catch (error) {
      logger.error('Error during AI orchestration', error);
      return {
        replyText: TEMPLATES.GENERIC_ERROR_FALLBACK,
        intent: 'GENERAL_INFORMATION',
        leadCaptured: false,
      };
    }
  }
}
