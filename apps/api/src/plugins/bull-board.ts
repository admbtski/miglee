import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import fastifyPlugin from 'fastify-plugin';
import { config, env } from '../env';
import { feedbackQueue } from '../workers/feedback/queue';
import { remindersQueue } from '../workers/reminders/queue';
import { BULLMQ_CONFIG } from '../lib/bullmq';

/**
 * Bull Board - Queue Monitoring Dashboard
 * Provides a web UI to inspect and manage BullMQ queues
 *
 * Access: /admin/queues (protected in production)
 */

// Base path for the dashboard
const BOARD_PATH = '/admin/queues';

export const bullBoardPlugin = fastifyPlugin(
  async (fastify) => {
    // Skip in production unless explicitly enabled
    if (config.isProduction && process.env.ENABLE_BULL_BOARD !== 'true') {
      fastify.log.info(
        'Bull Board disabled in production (set ENABLE_BULL_BOARD=true to enable)'
      );
      return;
    }

    // Create FastifyAdapter for bull-board
    const serverAdapter = new FastifyAdapter();
    serverAdapter.setBasePath(BOARD_PATH);

    // Dead-letter queue names (for future use when DLQ instances are available)
    // const feedbackDlqName = `event-feedback${BULLMQ_CONFIG.deadLetterSuffix}`;
    // const remindersDlqName = `event-reminders${BULLMQ_CONFIG.deadLetterSuffix}`;
    void BULLMQ_CONFIG.deadLetterSuffix; // Acknowledge config is available

    // Create bull-board with all queues
    createBullBoard({
      queues: [
        new BullMQAdapter(feedbackQueue),
        new BullMQAdapter(remindersQueue),
        // TODO: Add DLQ adapters when queue instances are created
      ],
      serverAdapter,
      options: {
        uiConfig: {
          boardTitle: 'Miglee Queue Monitor',
          boardLogo: {
            path: '/favicon.ico',
            width: '32px',
            height: '32px',
          },
        },
      },
    });

    // Register bull-board routes
    await fastify.register(serverAdapter.registerPlugin(), {
      prefix: BOARD_PATH,
    });

    // Add basic auth protection in production
    if (config.isProduction) {
      fastify.addHook('onRequest', async (request, reply) => {
        if (!request.url.startsWith(BOARD_PATH)) return;

        // Check for admin user (you may want to implement proper auth)
        const user = request.user as { role?: string } | undefined;
        if (!user || user.role !== 'ADMIN') {
          reply.code(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'Admin access required',
          });
        }
      });
    }

    fastify.log.info(
      `Bull Board registered at ${BOARD_PATH} (env: ${env.NODE_ENV})`
    );
  },
  {
    name: 'bull-board-plugin',
    dependencies: ['jwt-plugin'], // Ensure auth is loaded first
  }
);

// =============================================================================
// Queue Stats API Endpoint
// =============================================================================

export const queueStatsPlugin = fastifyPlugin(
  async (fastify) => {
    // API endpoint for queue stats (for custom dashboards or monitoring)
    fastify.get('/admin/queues/stats', async (request, reply) => {
      // Check for admin in production
      if (config.isProduction) {
        const user = request.user as { role?: string } | undefined;
        if (!user || user.role !== 'ADMIN') {
          return reply.code(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'Admin access required',
          });
        }
      }

      try {
        const [feedbackCounts, remindersCounts] = await Promise.all([
          feedbackQueue.getJobCounts(),
          remindersQueue.getJobCounts(),
        ]);

        return {
          queues: [
            {
              name: 'event-feedback',
              ...feedbackCounts,
            },
            {
              name: 'event-reminders',
              ...remindersCounts,
            },
          ],
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        fastify.log.error({ err: error }, 'Failed to get queue stats');
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to get queue stats',
        });
      }
    });
  },
  {
    name: 'queue-stats-plugin',
  }
);
