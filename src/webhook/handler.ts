import { Env } from '../config/env';
import { logger } from '../utils/logger';
import { sanitizePhoneNumber, sanitizeText } from '../utils/validation';
import { ConversationRepository } from '../conversations/repository';
import { ConversationService } from '../conversations/service';
import { LeadRepository } from '../leads/repository';
import { LeadService } from '../leads/service';
import { WhatsAppClient } from '../whatsapp/client';
import { TelegramNotifier } from '../notifications/telegram';
import { AIRouter } from '../ai/router';
import { detectIntentFast } from '../intents/detect';
import { TEMPLATES } from '../whatsapp/templates';

export async function handleWebhookPost(
  request: Request,
  env: Env
): Promise<Response> {
  let body: any;

  try {
    body = await request.json();
  } catch (err) {
    logger.error('Failed to parse webhook JSON body', err);
    return new Response('Bad Request', { status: 400 });
  }

  // Handle WhatsApp message status updates (sent, delivered, read) without processing
  if (body?.entry?.[0]?.changes?.[0]?.value?.statuses) {
    return new Response('EVENT_RECEIVED', { status: 200 });
  }

  const changeValue = body?.entry?.[0]?.changes?.[0]?.value;
  const messages = changeValue?.messages;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response('NO_MESSAGES', { status: 200 });
  }

  const rawMessage = messages[0];
  const messageId = rawMessage.id;
  const rawSenderPhone = rawMessage.from;
  const senderPhone = sanitizePhoneNumber(rawSenderPhone);
  const senderName = changeValue?.contacts?.[0]?.profile?.name || undefined;

  // Extract text content from normal text message or interactive button reply
  let messageContent = '';
  if (rawMessage.type === 'text') {
    messageContent = rawMessage.text?.body || '';
  } else if (rawMessage.type === 'interactive') {
    messageContent =
      rawMessage.interactive?.button_reply?.title ||
      rawMessage.interactive?.list_reply?.title ||
      '';
  } else {
    // Unhandled media or sticker type
    messageContent = `[${rawMessage.type}]`;
  }

  messageContent = sanitizeText(messageContent);

  logger.info('Processing incoming WhatsApp message', {
    messageId,
    phone: senderPhone,
    type: rawMessage.type,
  });

  // Initialize service dependencies
  const convRepo = new ConversationRepository(env.DB);
  const convService = new ConversationService(convRepo);
  const leadRepo = new LeadRepository(env.DB);
  const leadService = new LeadService(leadRepo);
  const waClient = new WhatsAppClient({
    accessToken: env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
  });
  const telegram = new TelegramNotifier({
    botToken: env.TELEGRAM_BOT_TOKEN,
    chatId: env.TELEGRAM_CHAT_ID,
  });
  const aiRouter = new AIRouter(env.GEMINI_API_KEY, env.DB);

  // 1. Process inbound message & idempotency check
  const { conversation, isDuplicate, canBotReply } = await convService.processInboundMessage(
    senderPhone,
    messageId,
    messageContent,
    senderName,
    rawMessage
  );

  if (isDuplicate) {
    return new Response('DUPLICATE_MESSAGE_IGNORED', { status: 200 });
  }

  // 2. If human is in control, bot stays silent
  if (!canBotReply) {
    logger.info('Bot is paused for this conversation (Human in control)', {
      conversationId: conversation.id,
      status: conversation.status,
    });
    return new Response('BOT_PAUSED', { status: 200 });
  }

  // 3. Fast Intent Detection (Rule-based)
  const fastIntent = detectIntentFast(messageContent);

  // 4. Handle Human Handoff trigger immediately
  if (fastIntent.intent === 'HUMAN_HANDOFF') {
    await convService.requestHumanHandoff(conversation.id, senderPhone, fastIntent.reason);
    await telegram.notifyHumanHandoff({
      phone: senderPhone,
      name: senderName,
      reason: messageContent,
    });

    const handoffReply = TEMPLATES.HUMAN_HANDOFF_ACK;
    const sent = await waClient.sendTextMessage(senderPhone, handoffReply);
    if (sent.success && sent.messageId) {
      await convRepo.saveMessage(conversation.id, sent.messageId, 'outbound', handoffReply);
    }
    return new Response('HANDOFF_PROCESSED', { status: 200 });
  }

  // 5. Normal AI Conversational Flow
  const history = await convRepo.getRecentHistory(conversation.id, 6);
  const aiResult = await aiRouter.handleConversation(messageContent, history);

  // 6. Check if AI detected Lead Data or Lead Completion
  if (aiResult.leadData || aiResult.leadCaptured) {
    const leadDataToSave = {
      phone: senderPhone,
      name: aiResult.leadData?.name || senderName,
      company: aiResult.leadData?.company || undefined,
      projectType: aiResult.leadData?.projectType || undefined,
      description: aiResult.leadData?.description || messageContent,
      timeline: aiResult.leadData?.timeline || undefined,
      budget: aiResult.leadData?.budget || undefined,
    };

    const { lead, isComplete } = await leadService.processLeadDetails(
      conversation.id,
      leadDataToSave
    );

    if (isComplete || aiResult.leadCaptured) {
      await telegram.notifyLeadCaptured(lead);
      await convRepo.logEvent(conversation.id, 'lead_created', lead);
    }
  }

  // 7. Check if AI detected Human Handoff intent during conversation
  if (aiResult.intent === 'HUMAN_HANDOFF') {
    await convService.requestHumanHandoff(conversation.id, senderPhone, 'AI detected handoff intent');
    await telegram.notifyHumanHandoff({
      phone: senderPhone,
      name: senderName,
      reason: 'AI detected human assistance required',
    });
  }

  // 8. Send WhatsApp reply
  const replyText = aiResult.replyText;
  const sent = await waClient.sendTextMessage(senderPhone, replyText);

  if (sent.success && sent.messageId) {
    await convRepo.saveMessage(conversation.id, sent.messageId, 'outbound', replyText);
  }

  return new Response('OK', { status: 200 });
}
