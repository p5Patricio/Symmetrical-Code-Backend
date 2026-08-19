import { ConversationStateData, ConversationStatus } from './state';

export interface DbUser {
  id: string;
  phone: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbConversation {
  id: string;
  user_id: string | null;
  phone: string;
  bot_active: number;
  human_requested: number;
  status: ConversationStatus;
  last_intent: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  message_id: string;
  direction: 'inbound' | 'outbound';
  message_type: string;
  content: string;
  raw_payload?: string | null;
  created_at: string;
}

export class ConversationRepository {
  constructor(private db: D1Database) {}

  /**
   * Find or create user by phone number
   */
  async findOrCreateUser(phone: string, name?: string): Promise<DbUser> {
    const existing = await this.db
      .prepare('SELECT * FROM users WHERE phone = ? LIMIT 1')
      .bind(phone)
      .first<DbUser>();

    if (existing) {
      if (name && !existing.name) {
        await this.db
          .prepare('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .bind(name, existing.id)
          .run();
        existing.name = name;
      }
      return existing;
    }

    const newId = crypto.randomUUID();
    await this.db
      .prepare('INSERT INTO users (id, phone, name) VALUES (?, ?, ?)')
      .bind(newId, phone, name || null)
      .run();

    return {
      id: newId,
      phone,
      name: name || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Find active conversation or create a new one
   */
  async findOrCreateConversation(phone: string, userId?: string): Promise<DbConversation> {
    const existing = await this.db
      .prepare('SELECT * FROM conversations WHERE phone = ? ORDER BY created_at DESC LIMIT 1')
      .bind(phone)
      .first<DbConversation>();

    if (existing) {
      return existing;
    }

    const newId = crypto.randomUUID();
    await this.db
      .prepare(
        'INSERT INTO conversations (id, user_id, phone, bot_active, human_requested, status) VALUES (?, ?, ?, 1, 0, ?)'
      )
      .bind(newId, userId || null, phone, 'BOT_ACTIVE')
      .run();

    return {
      id: newId,
      user_id: userId || null,
      phone,
      bot_active: 1,
      human_requested: 0,
      status: 'BOT_ACTIVE',
      last_intent: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Update conversation state and intent
   */
  async updateConversationState(
    conversationId: string,
    updates: {
      status?: ConversationStatus;
      bot_active?: boolean;
      human_requested?: boolean;
      last_intent?: string;
    }
  ): Promise<void> {
    const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const bindings: any[] = [];

    if (updates.status !== undefined) {
      sets.push('status = ?');
      bindings.push(updates.status);
    }
    if (updates.bot_active !== undefined) {
      sets.push('bot_active = ?');
      bindings.push(updates.bot_active ? 1 : 0);
    }
    if (updates.human_requested !== undefined) {
      sets.push('human_requested = ?');
      bindings.push(updates.human_requested ? 1 : 0);
    }
    if (updates.last_intent !== undefined) {
      sets.push('last_intent = ?');
      bindings.push(updates.last_intent);
    }

    bindings.push(conversationId);

    await this.db
      .prepare(`UPDATE conversations SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...bindings)
      .run();
  }

  /**
   * Check if a message_id has already been processed (Idempotency check)
   */
  async isMessageProcessed(messageId: string): Promise<boolean> {
    const res = await this.db
      .prepare('SELECT id FROM messages WHERE message_id = ? LIMIT 1')
      .bind(messageId)
      .first();
    return !!res;
  }

  /**
   * Save a message record in D1
   */
  async saveMessage(
    conversationId: string,
    messageId: string,
    direction: 'inbound' | 'outbound',
    content: string,
    messageType: string = 'text',
    rawPayload?: any
  ): Promise<DbMessage> {
    const id = crypto.randomUUID();
    const raw = rawPayload ? JSON.stringify(rawPayload) : null;

    await this.db
      .prepare(
        'INSERT INTO messages (id, conversation_id, message_id, direction, message_type, content, raw_payload) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, conversationId, messageId, direction, messageType, content, raw)
      .run();

    return {
      id,
      conversation_id: conversationId,
      message_id: messageId,
      direction,
      message_type: messageType,
      content,
      raw_payload: raw,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Get recent conversation history (last N messages)
   */
  async getRecentHistory(conversationId: string, limit: number = 8): Promise<DbMessage[]> {
    const { results } = await this.db
      .prepare(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?'
      )
      .bind(conversationId, limit)
      .all<DbMessage>();

    return (results || []).reverse();
  }

  /**
   * Record a business/system event
   */
  async logEvent(conversationId: string | null, eventType: string, payload?: any): Promise<void> {
    const id = crypto.randomUUID();
    const payloadStr = payload ? JSON.stringify(payload) : null;

    await this.db
      .prepare('INSERT INTO events (id, conversation_id, event_type, payload) VALUES (?, ?, ?, ?)')
      .bind(id, conversationId, eventType, payloadStr)
      .run();
  }
}
