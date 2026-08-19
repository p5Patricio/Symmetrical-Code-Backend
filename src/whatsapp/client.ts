import { logger } from '../utils/logger';
import {
  createTextMessagePayload,
  createInteractiveButtonsPayload,
  WhatsAppTextMessagePayload,
  WhatsAppInteractiveButtonsPayload,
} from './messages';

export interface WhatsAppClientConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion?: string;
}

export class WhatsAppClient {
  private baseUrl: string;

  constructor(private config: WhatsAppClientConfig) {
    const version = config.apiVersion || 'v21.0';
    this.baseUrl = `https://graph.facebook.com/${version}/${config.phoneNumberId}`;
  }

  /**
   * Sends generic payload to WhatsApp Graph API
   */
  private async sendRaw(payload: WhatsAppTextMessagePayload | WhatsAppInteractiveButtonsPayload | any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resJson: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        logger.error('WhatsApp API request failed', undefined, {
          status: response.status,
          error: resJson?.error || 'Unknown WhatsApp API error',
        });
        return { success: false, error: JSON.stringify(resJson) };
      }

      const messageId = resJson?.messages?.[0]?.id;
      logger.info('WhatsApp message sent successfully', { messageId, recipient: payload.to });
      return { success: true, messageId };
    } catch (error) {
      logger.error('WhatsApp API network error', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Sends a simple text message
   */
  async sendTextMessage(to: string, body: string): Promise<{ success: boolean; messageId?: string }> {
    const payload = createTextMessagePayload(to, body);
    return this.sendRaw(payload);
  }

  /**
   * Sends interactive reply buttons (up to 3 buttons)
   */
  async sendButtons(
    to: string,
    body: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<{ success: boolean; messageId?: string }> {
    const payload = createInteractiveButtonsPayload(to, body, buttons);
    return this.sendRaw(payload);
  }

  /**
   * Marks a message as read in WhatsApp
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
