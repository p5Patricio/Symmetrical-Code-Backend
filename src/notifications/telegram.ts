import { logger } from '../utils/logger';

export interface TelegramNotificationConfig {
  botToken?: string;
  chatId?: string;
}

export class TelegramNotifier {
  constructor(private config: TelegramNotificationConfig) {}

  /**
   * Sends a formatted markdown or HTML message to the team's Telegram chat
   */
  async sendMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
    if (!this.config.botToken || !this.config.chatId) {
      logger.warn('Telegram notifications skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured');
      return false;
    }

    const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text,
          parse_mode: parseMode,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.error('Telegram API error response', undefined, { status: response.status, error: errText });
        return false;
      }

      logger.info('Telegram alert delivered successfully');
      return true;
    } catch (error) {
      logger.error('Failed to send Telegram alert', error);
      return false;
    }
  }

  /**
   * Send structured alert when a new lead is captured or quote completed
   */
  async notifyLeadCaptured(lead: {
    name?: string | null;
    phone: string;
    company?: string | null;
    projectType?: string | null;
    description?: string | null;
    timeline?: string | null;
    budget?: string | null;
  }): Promise<boolean> {
    const timestamp = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    const message = `🚨 <b>NUEVO LEAD / SOLICITUD DE COTIZACIÓN</b>\n\n` +
      `👤 <b>Nombre:</b> ${lead.name || 'No especificado'}\n` +
      `📱 <b>WhatsApp:</b> ${lead.phone}\n` +
      `🏢 <b>Empresa:</b> ${lead.company || 'No especificada'}\n` +
      `🛠️ <b>Tipo de Proyecto:</b> ${lead.projectType || 'No especificado'}\n` +
      `📝 <b>Descripción:</b>\n${lead.description || 'Sin descripción adicional'}\n\n` +
      `⏳ <b>Timeline:</b> ${lead.timeline || 'Flexible / No especificado'}\n` +
      `💰 <b>Presupuesto:</b> ${lead.budget || 'A cotizar'}\n\n` +
      `📅 <b>Fecha:</b> ${timestamp}`;

    return this.sendMessage(message, 'HTML');
  }

  /**
   * Send alert when a user explicitly requests human attention
   */
  async notifyHumanHandoff(params: {
    phone: string;
    name?: string | null;
    reason?: string;
  }): Promise<boolean> {
    const timestamp = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    const message = `👤 <b>SOLICITUD DE ATENCIÓN HUMANA</b>\n\n` +
      `📱 <b>WhatsApp:</b> ${params.phone}\n` +
      `👤 <b>Nombre:</b> ${params.name || 'No especificado'}\n` +
      `❓ <b>Motivo:</b> ${params.reason || 'El cliente solicitó hablar con un asesor/humano'}\n\n` +
      `⚠️ <i>La conversación fue marcada como HUMAN_REQUESTED y el bot ha pausado sus respuestas automáticas.</i>\n\n` +
      `📅 <b>Fecha:</b> ${timestamp}`;

    return this.sendMessage(message, 'HTML');
  }
}
