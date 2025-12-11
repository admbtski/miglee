/**
 * Domain Rate Limiter
 *
 * Provides business-logic rate limiting using Redis ZSET sliding window algorithm.
 * This is the SECOND LAYER of rate limiting (after HTTP/Fastify layer).
 *
 * Features:
 * - Sliding window algorithm (Redis ZSET)
 * - Burst protection (optional)
 * - Consistent GraphQL errors with retryAfter
 * - Centralized configuration for all domain actions
 *
 * Usage:
 * ```typescript
 * await assertRateLimit('chat:event:send', `${eventId}:${userId}`);
 * ```
 */

import { GraphQLError } from 'graphql';
import { logger } from '../pino';
import { rateLimitRedis } from '../redis';

// =============================================================================
// Configuration Types
// =============================================================================

export interface RateLimitConfig {
  /** Maximum number of requests in the window */
  maxRequests: number;
  /** Window length in seconds */
  windowSeconds: number;
  /** Optional burst limit (max requests in short sub-window) */
  burstLimit?: number;
  /** Burst window in seconds (default: 5s) */
  burstWindowSeconds?: number;
}

/**
 * Available rate limit buckets (domains)
 */
export type RateLimitBucket =
  // Chat operations
  | 'chat:event:send'
  | 'chat:dm:send'
  | 'chat:edit'
  | 'chat:delete'
  // Event membership operations
  | 'gql:event:write'
  // Authentication (if via GraphQL)
  | 'gql:auth'
  // Feedback and reviews
  | 'gql:feedback'
  | 'gql:feedback:send'
  // Reporting abuse
  | 'gql:report'
  // Billing operations
  | 'gql:billing';

// =============================================================================
// Bucket Configuration
// =============================================================================

/**
 * Rate limit configuration per bucket
 *
 * Guidelines:
 * - chat: ~30 msgs/30s, burst 5/5s (spam protection)
 * - event:write: ~30 ops/min (joins, leaves, waitlist)
 * - feedback: ~5/min submit, ~2/hour send (email limits)
 * - report: ~10/10min (abuse reporting)
 * - billing: ~10/10min (Stripe protection)
 * - auth: ~10/5min (brute force protection)
 */
export const BUCKET_CONFIG: Record<RateLimitBucket, RateLimitConfig> = {
  // Chat operations
  'chat:event:send': {
    maxRequests: 30,
    windowSeconds: 30,
    burstLimit: 5,
    burstWindowSeconds: 5,
  },
  'chat:dm:send': {
    maxRequests: 30,
    windowSeconds: 30,
    burstLimit: 5,
    burstWindowSeconds: 5,
  },
  'chat:edit': {
    maxRequests: 5,
    windowSeconds: 60,
  },
  'chat:delete': {
    maxRequests: 5,
    windowSeconds: 60,
  },

  // Event membership operations (join, leave, waitlist, accept invite)
  'gql:event:write': {
    maxRequests: 30,
    windowSeconds: 60,
  },

  // Authentication operations (login, register, reset)
  'gql:auth': {
    maxRequests: 10,
    windowSeconds: 300, // 5 minutes
  },

  // Feedback operations
  'gql:feedback': {
    maxRequests: 5,
    windowSeconds: 60,
  },
  'gql:feedback:send': {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour (email sending limit)
  },

  // Report abuse
  'gql:report': {
    maxRequests: 10,
    windowSeconds: 600, // 10 minutes
  },

  // Billing operations (checkout, cancel, reactivate)
  'gql:billing': {
    maxRequests: 10,
    windowSeconds: 600, // 10 minutes
  },
};

// =============================================================================
// Rate Limit Error Types
// =============================================================================

export type RateLimitErrorCode =
  | 'RATE_LIMIT_EXCEEDED'
  | 'RATE_LIMIT_BURST_EXCEEDED';

/**
 * Create a GraphQL error for rate limit exceeded
 */
function createRateLimitError(
  message: string,
  code: RateLimitErrorCode,
  retryAfter: number,
  additionalInfo?: {
    bucket?: string;
    currentCount?: number;
    maxAllowed?: number;
  }
): GraphQLError {
  return new GraphQLError(message, {
    extensions: {
      code,
      retryAfter,
      ...additionalInfo,
    },
  });
}

// =============================================================================
// Sliding Window Algorithm (Redis ZSET)
// =============================================================================

/**
 * Check and enforce rate limit using sliding window algorithm
 *
 * Algorithm:
 * 1. Calculate current timestamp and window start
 * 2. Remove old entries outside window (ZREMRANGEBYSCORE)
 * 3. Count current entries (ZCARD)
 * 4. Add current request (ZADD)
 * 5. Set TTL (EXPIRE)
 * 6. If count > max, throw error
 * 7. If burst limit defined, check burst window
 *
 * @param bucket - Rate limit bucket (domain)
 * @param identity - Unique identifier for this limit (e.g., userId, eventId:userId)
 * @throws {GraphQLError} When rate limit is exceeded
 */
export async function assertRateLimit(
  bucket: RateLimitBucket,
  identity: string
): Promise<void> {
  const config = BUCKET_CONFIG[bucket];

  if (!config) {
    logger.error({ bucket }, 'Unknown rate limit bucket');
    // Fail open - don't block on misconfiguration
    return;
  }

  const key = `domain:${bucket}:${identity}`;
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  try {
    // Execute sliding window algorithm
    const multi = rateLimitRedis.multi();

    // 1. Remove old entries outside window
    multi.zremrangebyscore(key, 0, windowStart);

    // 2. Count current entries in window
    multi.zcard(key);

    // 3. Add current request
    multi.zadd(key, now, `${now}`);

    // 4. Set TTL (cleanup old keys)
    multi.expire(key, config.windowSeconds + 60); // +60s grace period

    const results = await multi.exec();

    if (!results) {
      throw new Error('Redis multi exec failed');
    }

    // Extract count from ZCARD result
    const currentCount = results[1]?.[1] as number;

    // Check main window limit
    if (currentCount >= config.maxRequests) {
      logger.warn(
        {
          bucket,
          identity,
          currentCount,
          maxRequests: config.maxRequests,
        },
        'Rate limit exceeded'
      );

      throw createRateLimitError(
        'Rate limit exceeded. Please slow down and try again later.',
        'RATE_LIMIT_EXCEEDED',
        config.windowSeconds,
        {
          bucket,
          currentCount,
          maxAllowed: config.maxRequests,
        }
      );
    }

    // Check burst limit (if configured)
    if (config.burstLimit && config.burstWindowSeconds) {
      const burstWindowStart = now - config.burstWindowSeconds * 1000;
      const burstCount = await rateLimitRedis.zcount(
        key,
        burstWindowStart,
        now
      );

      if (burstCount > config.burstLimit) {
        logger.warn(
          {
            bucket,
            identity,
            burstCount,
            burstLimit: config.burstLimit,
          },
          'Burst rate limit exceeded'
        );

        throw createRateLimitError(
          'Too many requests in a short time. Please wait a moment and try again.',
          'RATE_LIMIT_BURST_EXCEEDED',
          config.burstWindowSeconds,
          {
            bucket,
            currentCount: burstCount,
            maxAllowed: config.burstLimit,
          }
        );
      }
    }

    // Rate limit check passed
    logger.debug(
      {
        bucket,
        identity,
        currentCount,
        maxRequests: config.maxRequests,
      },
      'Rate limit check passed'
    );
  } catch (error) {
    // If it's already a GraphQLError (rate limit exceeded), rethrow
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Log Redis errors but fail open (don't block requests)
    logger.error(
      {
        error,
        bucket,
        identity,
      },
      'Rate limit check failed due to Redis error - failing open'
    );

    // FAIL OPEN: Don't block requests on Redis errors
    // For critical operations (billing), consider FAIL CLOSED
    return;
  }
}

// =============================================================================
// Convenience Helpers
// =============================================================================

/**
 * Check rate limit for event chat send
 */
export async function assertEventChatSendRateLimit(
  eventId: string,
  userId: string
): Promise<void> {
  return assertRateLimit('chat:event:send', `${eventId}:${userId}`);
}

/**
 * Check rate limit for DM send
 */
export async function assertDmSendRateLimit(
  threadId: string,
  userId: string
): Promise<void> {
  return assertRateLimit('chat:dm:send', `${threadId}:${userId}`);
}

/**
 * Check rate limit for message edit
 */
export async function assertEditRateLimit(userId: string): Promise<void> {
  return assertRateLimit('chat:edit', userId);
}

/**
 * Check rate limit for message delete
 */
export async function assertDeleteRateLimit(userId: string): Promise<void> {
  return assertRateLimit('chat:delete', userId);
}

/**
 * Check rate limit for event membership operations (join, leave, waitlist)
 */
export async function assertEventWriteRateLimit(userId: string): Promise<void> {
  return assertRateLimit('gql:event:write', userId);
}

/**
 * Check rate limit for feedback submission
 */
export async function assertFeedbackRateLimit(userId: string): Promise<void> {
  return assertRateLimit('gql:feedback', userId);
}

/**
 * Check rate limit for sending feedback requests (email)
 */
export async function assertFeedbackSendRateLimit(
  userId: string
): Promise<void> {
  return assertRateLimit('gql:feedback:send', userId);
}

/**
 * Check rate limit for report creation
 */
export async function assertReportRateLimit(userId: string): Promise<void> {
  return assertRateLimit('gql:report', userId);
}

/**
 * Check rate limit for billing operations
 */
export async function assertBillingRateLimit(userId: string): Promise<void> {
  return assertRateLimit('gql:billing', userId);
}

/**
 * Check rate limit for auth operations (login, register, reset)
 */
export async function assertAuthRateLimit(identity: string): Promise<void> {
  return assertRateLimit('gql:auth', identity);
}

// =============================================================================
// Exports
// =============================================================================

export { assertRateLimit as default };
