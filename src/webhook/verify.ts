import { logger } from '../utils/logger';

/**
 * Handles Meta Webhook Verification (GET /webhook)
 */
export function handleWebhookVerification(
  url: URL,
  expectedVerifyToken: string
): Response {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === expectedVerifyToken) {
    logger.info('Meta Webhook verification succeeded');
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  logger.warn('Meta Webhook verification failed: invalid token or mode', { mode });
  return new Response('Forbidden', { status: 403 });
}
