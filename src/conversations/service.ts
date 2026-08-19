import { ConversationRepository, DbConversation } from './repository';
import { ConversationStatus, isBotResponseAllowed } from './state';
import { logger } from '../utils/logger';

export class ConversationService {
  constructor(private repo: ConversationRepository) {}

  /**
   * Initializes or loads the context of an incoming message
   */
  async processInboundMessage(
    phone: string,
    messageId: string,
    content: string,
    senderName?: string,
    rawPayload?: any
  ): Promise<{
    conversation: DbConversation;
    isDuplicate: boolean;
    canBotReply: boolean;
  }> {
    // 1. Idempotency check
    const isDuplicate = await this.repo.isMessageProcessed(messageId);
    if (isDuplicate) {
      logger.info('Duplicate message received, skipping processing', { messageId, phone });
      const conversation = await this.repo.findOrCreateConversation(phone);
      return { conversation, isDuplicate: true, canBotReply: false };
    }

    // 2. Resolve User & Conversation
    const user = await this.repo.findOrCreateUser(phone, senderName);
    const conversation = await this.repo.findOrCreateConversation(phone, user.id);

    // 3. Persist incoming message
    await this.repo.saveMessage(conversation.id, messageId, 'inbound', content, 'text', rawPayload);

    // 4. Check if bot response is permitted
    const canBotReply = isBotResponseAllowed(conversation.status, conversation.bot_active === 1);

    return {
      conversation,
      isDuplicate: false,
      canBotReply,
    };
  }

  /**
   * Transition conversation to HUMAN_REQUESTED state
   */
  async requestHumanHandoff(conversationId: string, phone: string, reason?: string): Promise<void> {
    logger.info('Transitioning conversation to HUMAN_REQUESTED', { conversationId, phone, reason });
    await this.repo.updateConversationState(conversationId, {
      status: 'HUMAN_REQUESTED',
      bot_active: false,
      human_requested: true,
      last_intent: 'HUMAN_HANDOFF',
    });

    await this.repo.logEvent(conversationId, 'human_requested', {
      phone,
      reason: reason || 'User requested human support',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Resume bot for a conversation (manual or admin action)
   */
  async activateBot(conversationId: string): Promise<void> {
    await this.repo.updateConversationState(conversationId, {
      status: 'BOT_ACTIVE',
      bot_active: true,
      human_requested: false,
    });
    await this.repo.logEvent(conversationId, 'bot_enabled', { timestamp: new Date().toISOString() });
  }

  /**
   * Pause bot manually (when a human takes over directly on WhatsApp)
   */
  async setHumanActive(conversationId: string): Promise<void> {
    await this.repo.updateConversationState(conversationId, {
      status: 'HUMAN_ACTIVE',
      bot_active: false,
      human_requested: true,
    });
    await this.repo.logEvent(conversationId, 'bot_disabled', { timestamp: new Date().toISOString() });
  }
}
