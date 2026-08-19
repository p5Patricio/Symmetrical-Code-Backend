import { Env, validateEnv } from './config/env';
import { handleWebhookVerification } from './webhook/verify';
import { handleWebhookPost } from './webhook/handler';
import { ConversationRepository } from './conversations/repository';
import { ConversationService } from './conversations/service';
import { logger } from './utils/logger';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
        },
      });
    }

    // Health check endpoint
    if (pathname === '/health' && method === 'GET') {
      const validation = validateEnv(env);
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'Symmetrical Code Bot',
          environment: env.ENVIRONMENT || 'development',
          configValid: validation.valid,
          missingConfig: validation.missing,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Meta WhatsApp Webhook verification
    if (pathname === '/webhook' && method === 'GET') {
      return handleWebhookVerification(url, env.WHATSAPP_VERIFY_TOKEN);
    }

    // Meta WhatsApp Webhook event intake
    if (pathname === '/webhook' && method === 'POST') {
      return handleWebhookPost(request, env);
    }

    // Administrative endpoint to manually re-enable/disable bot for a phone number
    if (pathname === '/api/admin/bot-state' && method === 'POST') {
      const adminKey = request.headers.get('X-Admin-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');
      if (env.ADMIN_API_KEY && adminKey !== env.ADMIN_API_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      try {
        const body: any = await request.json();
        const { phone, action } = body; // action: 'enable' | 'disable'

        if (!phone || !action) {
          return new Response(JSON.stringify({ error: 'phone and action are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const convRepo = new ConversationRepository(env.DB);
        const convService = new ConversationService(convRepo);
        const conv = await convRepo.findOrCreateConversation(phone);

        if (action === 'enable') {
          await convService.activateBot(conv.id);
        } else if (action === 'disable') {
          await convService.setHumanActive(conv.id);
        }

        return new Response(
          JSON.stringify({
            success: true,
            phone,
            action,
            updatedAt: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (err) {
        logger.error('Admin bot-state error', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not Found', path: pathname }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
