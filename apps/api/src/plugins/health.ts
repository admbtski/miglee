import fastifyPlugin from 'fastify-plugin';
import { config, env } from '../env';
import { prisma } from '../lib/prisma';
import { healthRedis } from '../lib/redis';
import { rateLimitPresets } from './rate-limit';

/**
 * Production-ready Health Check plugin
 * Provides Kubernetes-style liveness and readiness probes
 */

// Health check timeouts (in milliseconds)
const HEALTH_CHECK_TIMEOUT = config.isProduction ? 5000 : 10000;

// Service start time for uptime calculation
const startTime = Date.now();

// Types for health check responses
interface HealthStatus {
  status: 'ok' | 'degraded' | 'fail';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
  };
}

interface ComponentHealth {
  status: 'ok' | 'fail';
  latency?: number;
  message?: string;
}

// Helper to run health check with timeout
const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  name: string
): Promise<{ result: T | null; latency: number; error?: string }> => {
  const start = Date.now();

  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`${name} health check timeout`)),
          timeoutMs
        )
      ),
    ]);
    return { result, latency: Date.now() - start };
  } catch (err) {
    return {
      result: null,
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
};

// Check database health
const checkDatabase = async (): Promise<ComponentHealth> => {
  const { result, latency, error } = await withTimeout(
    prisma.$queryRaw`SELECT 1`,
    HEALTH_CHECK_TIMEOUT,
    'Database'
  );

  if (error) {
    return { status: 'fail', latency, message: error };
  }

  return { status: result ? 'ok' : 'fail', latency };
};

// Check Redis health
const checkRedis = async (): Promise<ComponentHealth> => {
  const { result, latency, error } = await withTimeout(
    healthRedis.ping(),
    HEALTH_CHECK_TIMEOUT,
    'Redis'
  );

  if (error) {
    return { status: 'fail', latency, message: error };
  }

  return { status: result === 'PONG' ? 'ok' : 'fail', latency };
};

export const healthPlugin = fastifyPlugin(
  async (fastify) => {
    /**
     * Liveness probe - indicates if the application is running
     * Used by Kubernetes to determine if the container should be restarted
     * Should return 200 if the process is alive (even if dependencies are down)
     */
    fastify.get(
      '/health/live',
      {
        config: {
          rateLimit: rateLimitPresets.read, // High limit for K8s polling
        },
      },
      async (_req, reply) => {
        reply.code(200);
        return {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: Math.floor((Date.now() - startTime) / 1000),
        };
      }
    );

    /**
     * Readiness probe - indicates if the application is ready to receive traffic
     * Used by Kubernetes to determine if the pod should receive traffic
     * Should return 200 only if all dependencies are healthy
     */
    fastify.get(
      '/health/ready',
      {
        config: {
          rateLimit: rateLimitPresets.read, // High limit for K8s polling
        },
      },
      async (req, reply) => {
        const [database, redis] = await Promise.all([
          checkDatabase(),
          checkRedis(),
        ]);

        const allHealthy = database.status === 'ok' && redis.status === 'ok';
        const anyHealthy = database.status === 'ok' || redis.status === 'ok';

        // Determine overall status
        let status: 'ok' | 'degraded' | 'fail';
        if (allHealthy) {
          status = 'ok';
        } else if (anyHealthy) {
          status = 'degraded';
        } else {
          status = 'fail';
        }

        // Log health issues in production
        if (!allHealthy) {
          req.log.warn(
            { database, redis },
            `Health check ${status}: some components are unhealthy`
          );
        }

        const response: HealthStatus = {
          status,
          timestamp: new Date().toISOString(),
          uptime: Math.floor((Date.now() - startTime) / 1000),
          version: process.env.npm_package_version ?? '0.0.0',
          environment: env.NODE_ENV,
          checks: {
            database,
            redis,
          },
        };

        // Return 503 if not ready, 200 if ready
        reply.code(status === 'fail' ? 503 : 200);
        return response;
      }
    );

    /**
     * Legacy health endpoint - combines liveness and readiness
     * Kept for backwards compatibility
     */
    fastify.get(
      '/health',
      {
        config: {
          rateLimit: rateLimitPresets.read, // High limit for monitoring tools
        },
      },
      async (req, reply) => {
        const [database, redis] = await Promise.all([
          checkDatabase(),
          checkRedis(),
        ]);

        const allHealthy = database.status === 'ok' && redis.status === 'ok';

        if (!allHealthy) {
          req.log.warn(
            { database, redis },
            'Health check failed: some components are unhealthy'
          );
        }

        reply.code(allHealthy ? 200 : 503);
        return {
          ok: allHealthy,
          db: database.status,
          redis: redis.status,
          // Include latency in development for debugging
          ...(config.isDevelopment && {
            latency: {
              db: database.latency,
              redis: redis.latency,
            },
          }),
        };
      }
    );

    fastify.log.info(
      'Registered health check endpoints: /health, /health/live, /health/ready'
    );
  },
  {
    name: 'health-plugin',
  }
);
