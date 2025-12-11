import rateLimit, { RateLimitPluginOptions } from '@fastify/rate-limit';
import { FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import IORedis from 'ioredis';
import { config, env } from '../env';

/**
 * Production-ready Rate Limit configuration
 * Provides request throttling for both production and development
 */

// Create Redis client for rate limiting (production only)
const createRedisClient = (): IORedis | undefined => {
  if (!config.isProduction) return undefined;

  try {
    return new IORedis({
      host: config.redisHost,
      port: config.redisPort,
      password: config.redisPassword,
      db: config.redisDb,
      tls: config.redisTls ? {} : undefined,
      retryStrategy: (times: number) => Math.min(500 + times * 250, 5000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 5_000,
      lazyConnect: true,
      keyPrefix: 'rl:', // Rate limit prefix
    });
  } catch {
    return undefined;
  }
};

// Key generator - identifies request source
const keyGenerator = (req: FastifyRequest): string => {
  // Prefer user ID for authenticated requests
  const user = req.user as { id?: string } | undefined;
  const userId = user?.id;
  if (userId) return `user:${userId}`;

  // For anonymous requests, use IP + fingerprint
  const ip = req.ip;
  const ua = (req.headers['user-agent'] as string) || 'unknown';
  const uaHash = ua.slice(0, 32);

  return `anon:${ip}:${uaHash}`;
};

// Error response builder
const errorResponseBuilder = (
  _req: unknown,
  context: { ttl: number; max: number; ban?: boolean }
) => ({
  statusCode: 429,
  error: 'Too Many Requests',
  message: context.ban
    ? 'You have been temporarily banned due to excessive requests'
    : `Rate limit exceeded. Retry after ${Math.ceil(context.ttl / 1000)} seconds`,
  retryAfter: Math.ceil(context.ttl / 1000),
});

// Trusted proxies and internal IPs
const ALLOW_LIST = config.isProduction
  ? [] // No allowlist in production - all traffic goes through rate limiting
  : ['127.0.0.1', '::1', 'localhost']; // Allow localhost in development

// Production rate limit options
const productionOptions: RateLimitPluginOptions = {
  global: false, // Apply per-route, not globally
  max: 100, // 100 requests
  timeWindow: '1 minute',
  ban: 5, // Ban after 5 consecutive limit hits
  cache: 10000, // Cache size for local tracking

  // Use Redis for distributed rate limiting across instances
  redis: createRedisClient(),

  allowList: ALLOW_LIST,

  // Skip rate limiting for health checks
  skipOnError: true, // If Redis fails, don't block requests

  // Consistent key generation
  keyGenerator,

  // Rate limit headers
  addHeadersOnExceeding: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  },
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
    'retry-after': true,
  },

  errorResponseBuilder,

  // Enable draft spec headers
  enableDraftSpec: true,
};

// Development rate limit options - more permissive
const developmentOptions: RateLimitPluginOptions = {
  global: false,
  max: 1000, // Higher limit for development
  timeWindow: '1 minute',
  ban: undefined, // No banning in development
  cache: 5000,

  // No Redis in development - use local memory
  redis: undefined,

  allowList: ALLOW_LIST,
  skipOnError: true,

  keyGenerator,

  // Same headers for consistency
  addHeadersOnExceeding: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  },
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
    'retry-after': true,
  },

  errorResponseBuilder,
  enableDraftSpec: true,
};

export const rateLimitPlugin = fastifyPlugin(
  async (fastify) => {
    const options = config.isProduction
      ? productionOptions
      : developmentOptions;

    fastify.log.info(
      `Registering Rate Limit plugin with ${env.NODE_ENV} configuration`
    );

    if (config.isProduction && options.redis) {
      fastify.log.info('Rate limiting using Redis for distributed state');
    } else {
      fastify.log.info('Rate limiting using in-memory store');
    }

    await fastify.register(rateLimit, options);
  },
  {
    name: 'rate-limit-plugin',
  }
);

// Export preset configurations for route-specific limits
export const rateLimitPresets = {
  // Strict limit for sensitive operations (login, register, password reset)
  auth: {
    max: config.isProduction ? 10 : 100,
    timeWindow: '15 minutes',
  },
  // Standard API limit
  api: {
    max: config.isProduction ? 100 : 1000,
    timeWindow: '1 minute',
  },
  // Relaxed limit for read-heavy endpoints (health checks, public reads)
  read: {
    max: config.isProduction ? 300 : 3000,
    timeWindow: '1 minute',
  },
  // Very strict limit for expensive operations (admin endpoints)
  expensive: {
    max: config.isProduction ? 5 : 50,
    timeWindow: '1 minute',
  },
  // Upload limit (expensive I/O operations)
  upload: {
    max: config.isProduction ? 20 : 200,
    timeWindow: '1 hour',
  },
  // Webhook limit (external services calling us - Stripe, etc)
  webhook: {
    max: config.isProduction ? 200 : 2000,
    timeWindow: '1 minute',
  },
} as const;
