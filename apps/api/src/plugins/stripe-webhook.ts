/**
 * Stripe Webhook Plugin
 * Handles Stripe webhook events
 *
 * Uses fastify-raw-body plugin to access raw request body
 * for Stripe signature verification
 */

import type { FastifyInstance } from 'fastify';
import { verifyWebhookSignature, handleStripeWebhook } from '../lib/billing';
import { logger } from '../lib/pino';
import { config } from '../env';

export async function stripeWebhookPlugin(fastify: FastifyInstance) {
  fastify.post('/webhooks/stripe', async (request, reply) => {
    try {
      const signature = request.headers['stripe-signature'];

      // Get raw body from fastify-raw-body plugin
      const rawBody = (request as any).rawBody as Buffer;

      if (!rawBody) {
        logger.error(
          'rawBody is not available - fastify-raw-body plugin may not be configured'
        );
        return reply.code(500).send({ error: 'Server configuration error' });
      }

      // DEVELOPMENT MODE: Skip signature verification if no webhook secret configured
      const isDevelopment = config.isDevelopment && !config.stripeWebhookSecret;

      let event;

      if (isDevelopment) {
        // ⚠️ ONLY FOR LOCAL DEVELOPMENT - DO NOT USE IN PRODUCTION
        logger.warn(
          '⚠️  DEVELOPMENT MODE: Skipping Stripe signature verification'
        );

        // Parse body as event directly
        const bodyString = rawBody.toString('utf-8');
        event = JSON.parse(bodyString);
      } else {
        // PRODUCTION: Verify signature
        if (!signature) {
          logger.warn('Missing stripe-signature header');
          return reply
            .code(400)
            .send({ error: 'Missing stripe-signature header' });
        }

        event = verifyWebhookSignature(rawBody, signature as string);
      }

      // Process webhook
      await handleStripeWebhook(event);

      return reply.code(200).send({ received: true });
    } catch (err: any) {
      logger.error({ err }, 'Webhook processing failed');
      return reply.code(400).send({ error: err.message });
    }
  });

  logger.info('Stripe webhook endpoint registered at POST /webhooks/stripe');
}
