import fastifyPlugin from 'fastify-plugin';
import { config, env } from '../env';
import { closeAllQueues } from '../lib/bullmq';
import { prisma } from '../lib/prisma';
import { closeAllRedisConnections } from '../lib/redis';

/**
 * Production-ready Graceful Shutdown plugin
 * Ensures all connections are properly closed before the process exits
 */

// Shutdown configuration
const SHUTDOWN_TIMEOUT = config.isProduction ? 30000 : 10000; // 30s prod, 10s dev
const FORCE_SHUTDOWN_TIMEOUT = config.isProduction ? 45000 : 15000; // Force after this

// Track shutdown state
let isShuttingDown = false;

// Active connections counter
let activeConnections = 0;

export const gracefulShutdownPlugin = fastifyPlugin(
  async (fastify) => {
    // Track active connections
    fastify.addHook('onRequest', async () => {
      activeConnections++;
    });

    fastify.addHook('onResponse', async () => {
      activeConnections--;
    });

    // Health check returns 503 during shutdown
    fastify.addHook('onRequest', async (req, reply) => {
      if (isShuttingDown) {
        // Allow health checks to pass through (they return appropriate status)
        if (req.url.startsWith('/health')) {
          return;
        }

        // Reject new requests during shutdown
        reply.code(503).header('Connection', 'close').send({
          statusCode: 503,
          error: 'Service Unavailable',
          message: 'Server is shutting down',
        });
      }
    });

    /**
     * Graceful shutdown handler
     */
    const shutdown = async (signal: string) => {
      if (isShuttingDown) {
        fastify.log.warn(`${signal} received again, already shutting down...`);
        return;
      }

      isShuttingDown = true;
      fastify.log.info(`${signal} received, starting graceful shutdown...`);
      fastify.log.info(`Active connections: ${activeConnections}`);

      // Force shutdown timer
      const forceShutdownTimer = setTimeout(() => {
        fastify.log.error(
          `Force shutdown after ${FORCE_SHUTDOWN_TIMEOUT}ms - some connections may be dropped`
        );
        process.exit(1);
      }, FORCE_SHUTDOWN_TIMEOUT);

      try {
        // Step 1: Stop accepting new connections
        fastify.log.info('Stopping HTTP server...');
        await Promise.race([
          fastify.close(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Server close timeout')),
              SHUTDOWN_TIMEOUT
            )
          ),
        ]);
        fastify.log.info('HTTP server stopped');

        // Step 2: Wait for in-flight requests to complete
        if (activeConnections > 0) {
          fastify.log.info(
            `Waiting for ${activeConnections} active connections to complete...`
          );

          const waitStart = Date.now();
          while (
            activeConnections > 0 &&
            Date.now() - waitStart < SHUTDOWN_TIMEOUT
          ) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          if (activeConnections > 0) {
            fastify.log.warn(
              `Timeout waiting for connections, ${activeConnections} still active`
            );
          }
        }

        // Step 3: Close database connection
        fastify.log.info('Closing database connection...');
        try {
          await Promise.race([
            prisma.$disconnect(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Prisma disconnect timeout')),
                5000
              )
            ),
          ]);
          fastify.log.info('Database connection closed');
        } catch (err) {
          fastify.log.error({ err }, 'Error closing database connection');
        }

        // Step 4: Close BullMQ queues
        fastify.log.info('Closing BullMQ queues...');
        try {
          await Promise.race([
            closeAllQueues(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('BullMQ close timeout')), 10000)
            ),
          ]);
          fastify.log.info('BullMQ queues closed');
        } catch (err) {
          fastify.log.error({ err }, 'Error closing BullMQ queues');
        }

        // Step 5: Close Redis connections
        fastify.log.info('Closing Redis connections...');
        try {
          await Promise.race([
            closeAllRedisConnections(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Redis close timeout')), 5000)
            ),
          ]);
          fastify.log.info('Redis connections closed');
        } catch (err) {
          fastify.log.error({ err }, 'Error closing Redis connections');
        }

        // Clear force shutdown timer
        clearTimeout(forceShutdownTimer);

        fastify.log.info('Graceful shutdown completed');
        process.exit(0);
      } catch (err) {
        fastify.log.error({ err }, 'Error during graceful shutdown');
        clearTimeout(forceShutdownTimer);
        process.exit(1);
      }
    };

    // Register signal handlers
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, () => {
        shutdown(signal).catch((err) => {
          fastify.log.error({ err }, `Error handling ${signal}`);
          process.exit(1);
        });
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      fastify.log.fatal({ err }, 'Uncaught exception');
      shutdown('uncaughtException').catch(() => process.exit(1));
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      fastify.log.error({ reason, promise }, 'Unhandled promise rejection');
      // Don't shutdown on unhandled rejection in development
      if (config.isProduction) {
        shutdown('unhandledRejection').catch(() => process.exit(1));
      }
    });

    fastify.log.info(
      `Graceful shutdown registered (timeout: ${SHUTDOWN_TIMEOUT}ms, env: ${env.NODE_ENV})`
    );
  },
  {
    name: 'graceful-shutdown-plugin',
  }
);

// Export for manual shutdown (e.g., from tests)
export const isServerShuttingDown = () => isShuttingDown;
export const getActiveConnections = () => activeConnections;
