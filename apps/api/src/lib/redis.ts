import MQEmitterRedis from 'mqemitter-redis';
import IORedis, { Redis, RedisOptions } from 'ioredis';
import { config } from '../env';
import { logger } from './pino';

/**
 * Production-ready Redis configuration
 * Centralized Redis connection management with proper retry, timeout, and logging
 */

// =============================================================================
// Configuration
// =============================================================================

const REDIS_CONFIG = {
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword,
  db: config.redisDb,

  // TLS configuration (for production with SSL)
  tls: config.redisTls ? {} : undefined,
};

// Retry configuration
const RETRY_CONFIG = {
  // Max number of retry attempts before giving up
  maxRetries: config.isProduction ? 20 : 10,

  // Initial retry delay (ms)
  initialDelay: 500,

  // Max retry delay (ms) - caps exponential backoff
  maxDelay: config.isProduction ? 30000 : 10000,

  // Backoff multiplier
  multiplier: 1.5,
};

// Timeout configuration
const TIMEOUT_CONFIG = {
  // Connection timeout (ms)
  connectTimeout: config.isProduction ? 10000 : 5000,

  // Command timeout (ms) - how long to wait for a response
  commandTimeout: config.isProduction ? 5000 : 10000,

  // Keep-alive interval (ms)
  keepAlive: 30000,

  // Max retries per request (null = use retryStrategy)
  maxRetriesPerRequest: config.isProduction ? 3 : null,
};

// =============================================================================
// Retry Strategy
// =============================================================================

/**
 * Exponential backoff retry strategy with max retries
 */
function createRetryStrategy(connectionName: string) {
  return (times: number): number | null => {
    if (times > RETRY_CONFIG.maxRetries) {
      logger.error(
        { connection: connectionName, attempts: times },
        'Redis max retries exceeded, giving up'
      );
      return null; // Stop retrying
    }

    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.multiplier, times - 1),
      RETRY_CONFIG.maxDelay
    );

    logger.warn(
      { connection: connectionName, attempt: times, delayMs: delay },
      'Redis reconnecting...'
    );

    return delay;
  };
}

// =============================================================================
// Connection Factory
// =============================================================================

/**
 * Create a configured Redis connection with logging and metrics
 */
export function createRedisConnection(
  name: string,
  options: Partial<RedisOptions> = {}
): Redis {
  const redis = new IORedis({
    ...REDIS_CONFIG,
    ...TIMEOUT_CONFIG,
    retryStrategy: createRetryStrategy(name),
    enableReadyCheck: true,
    lazyConnect: options.lazyConnect ?? false,
    keyPrefix: options.keyPrefix,
    ...options,
  });

  // Connection event logging
  redis.on('connect', () => {
    logger.info({ connection: name }, 'Redis connected');
  });

  redis.on('ready', () => {
    logger.info({ connection: name }, 'Redis ready');
  });

  redis.on('close', () => {
    logger.warn({ connection: name }, 'Redis connection closed');
  });

  redis.on('reconnecting', () => {
    logger.warn({ connection: name }, 'Redis reconnecting...');
  });

  redis.on('end', () => {
    logger.warn({ connection: name }, 'Redis connection ended');
  });

  redis.on('error', (err) => {
    logger.error({ connection: name, err }, 'Redis error');
  });

  redis.on('wait', () => {
    logger.debug({ connection: name }, 'Redis waiting for ready');
  });

  return redis;
}

// =============================================================================
// Shared Connections
// =============================================================================

/**
 * Redis emitter for Mercurius subscriptions (GraphQL pub/sub)
 */
export const redisEmitter = MQEmitterRedis({
  ...REDIS_CONFIG,
  retryStrategy: createRetryStrategy('emitter'),
  maxRetriesPerRequest: null, // Required for pub/sub
  enableReadyCheck: true,
  connectTimeout: TIMEOUT_CONFIG.connectTimeout,
  lazyConnect: false,
  keepAlive: TIMEOUT_CONFIG.keepAlive,
});

// Log emitter events
redisEmitter.on('connect', () => logger.info('Redis emitter connected'));
redisEmitter.on('ready', () => logger.info('Redis emitter ready'));
redisEmitter.on('reconnecting', () =>
  logger.warn('Redis emitter reconnecting')
);
redisEmitter.on('end', () => logger.warn('Redis emitter connection ended'));
redisEmitter.on('error', (err) => logger.error({ err }, 'Redis emitter error'));

/**
 * Redis connection for health checks
 */
export const healthRedis = createRedisConnection('health', {
  lazyConnect: false,
});

/**
 * Redis connection for rate limiting
 */
export const rateLimitRedis = createRedisConnection('rate-limit', {
  keyPrefix: 'rl:',
  lazyConnect: true,
});

/**
 * Redis connection for chat features (rate limiting, typing indicators)
 */
export const chatRedis = createRedisConnection('chat', {
  keyPrefix: 'chat:',
  lazyConnect: true,
});

// =============================================================================
// BullMQ Connections
// =============================================================================

/**
 * Create Redis connection optimized for BullMQ
 * BullMQ requires maxRetriesPerRequest: null for blocking operations
 */
export function createBullMQConnection(name: string): Redis {
  return createRedisConnection(`bullmq-${name}`, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableOfflineQueue: true,
  });
}

// =============================================================================
// Graceful Shutdown
// =============================================================================

const activeConnections: Redis[] = [healthRedis, chatRedis];

/**
 * Register a Redis connection for graceful shutdown
 */
export function registerRedisConnection(connection: Redis): void {
  activeConnections.push(connection);
}

/**
 * Close all Redis connections gracefully
 */
export async function closeAllRedisConnections(): Promise<void> {
  logger.info('Closing all Redis connections...');

  const closePromises: Promise<void>[] = [];

  // Close emitter
  closePromises.push(
    new Promise<void>((resolve) => {
      redisEmitter.close?.(() => {
        logger.info('Redis emitter closed');
        resolve();
      });
    })
  );

  // Close all registered connections
  for (const connection of activeConnections) {
    closePromises.push(
      (async () => {
        try {
          connection.disconnect();
        } catch {
          // Ignore errors during shutdown
        }
      })()
    );
  }

  await Promise.allSettled(closePromises);
  logger.info('All Redis connections closed');
}

// Legacy export for backward compatibility
export const closeRedisEmitter = closeAllRedisConnections;

// =============================================================================
// Health Check
// =============================================================================

/**
 * Check Redis health
 */
export async function checkRedisHealth(
  timeoutMs = 5000
): Promise<{ status: 'ok' | 'fail'; latency?: number; error?: string }> {
  const start = Date.now();

  try {
    const result = await Promise.race([
      healthRedis.ping(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Redis health check timeout')),
          timeoutMs
        )
      ),
    ]);

    return {
      status: result === 'PONG' ? 'ok' : 'fail',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// Exports
// =============================================================================

export { REDIS_CONFIG, RETRY_CONFIG, TIMEOUT_CONFIG };
