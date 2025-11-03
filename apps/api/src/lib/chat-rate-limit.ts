/**
 * Chat-specific rate limiting using Redis
 */

import { GraphQLError } from 'graphql';
import { healthRedis } from './redis';

// =============================================================================
// Rate Limit Configuration
// =============================================================================

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  burstLimit?: number;
}

const RATE_LIMITS = {
  // Event chat: 10 messages per 30 seconds per (user, intent)
  eventChatSend: {
    maxRequests: 10,
    windowSeconds: 30,
    burstLimit: 5,
  },
  // DM: 10 messages per 30 seconds per user per thread
  dmSend: {
    maxRequests: 10,
    windowSeconds: 30,
    burstLimit: 5,
  },
  // Edit: 5 per minute
  edit: {
    maxRequests: 5,
    windowSeconds: 60,
  },
  // Delete: 5 per minute
  delete: {
    maxRequests: 5,
    windowSeconds: 60,
  },
} as const;

// =============================================================================
// Rate Limit Functions
// =============================================================================

/**
 * Check and increment rate limit for event chat send
 */
export async function checkEventChatSendRateLimit(
  userId: string,
  intentId: string
): Promise<void> {
  const key = `chat:event:send:${intentId}:${userId}`;
  await checkRateLimit(key, RATE_LIMITS.eventChatSend);
}

/**
 * Check and increment rate limit for DM send
 */
export async function checkDmSendRateLimit(
  userId: string,
  threadId: string
): Promise<void> {
  const key = `chat:dm:send:${threadId}:${userId}`;
  await checkRateLimit(key, RATE_LIMITS.dmSend);
}

/**
 * Check and increment rate limit for message edit
 */
export async function checkEditRateLimit(userId: string): Promise<void> {
  const key = `chat:edit:${userId}`;
  await checkRateLimit(key, RATE_LIMITS.edit);
}

/**
 * Check and increment rate limit for message delete
 */
export async function checkDeleteRateLimit(userId: string): Promise<void> {
  const key = `chat:delete:${userId}`;
  await checkRateLimit(key, RATE_LIMITS.delete);
}

/**
 * Generic rate limit checker using sliding window counter
 */
async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<void> {
  try {
    const now = Date.now();
    const windowStart = now - config.windowSeconds * 1000;

    // Use Redis sorted set for sliding window
    const multi = healthRedis.multi();

    // Remove old entries outside the window
    multi.zremrangebyscore(key, 0, windowStart);

    // Count current requests in window
    multi.zcard(key);

    // Add current request
    multi.zadd(key, now, `${now}`);

    // Set expiry
    multi.expire(key, config.windowSeconds);

    const results = await multi.exec();

    if (!results) {
      throw new Error('Redis multi exec failed');
    }

    // results[1] is the ZCARD result
    const currentCount = results[1]?.[1] as number;

    if (currentCount >= config.maxRequests) {
      throw new GraphQLError(
        'Rate limit exceeded. Please slow down and try again later.',
        {
          extensions: {
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: config.windowSeconds,
          },
        }
      );
    }
  } catch (error) {
    // If it's already a GraphQLError, rethrow
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Log Redis errors but don't block the request
    console.error('Rate limit check failed:', error);
    // In production, you might want to fail open or closed depending on requirements
  }
}

// =============================================================================
// Typing Indicator (Ephemeral, Redis TTL)
// =============================================================================

const TYPING_TTL_SECONDS = 3;

/**
 * Set typing indicator for event chat (expires in 3 seconds)
 */
export async function setEventChatTyping(
  userId: string,
  intentId: string,
  isTyping: boolean
): Promise<void> {
  const key = `chat:event:typing:${intentId}:${userId}`;

  if (isTyping) {
    await healthRedis.setex(key, TYPING_TTL_SECONDS, '1');
  } else {
    await healthRedis.del(key);
  }
}

/**
 * Get all users currently typing in event chat
 */
export async function getEventChatTypingUsers(
  intentId: string
): Promise<string[]> {
  const pattern = `chat:event:typing:${intentId}:*`;
  const keys = await healthRedis.keys(pattern);

  return keys
    .map((key) => {
      const parts = key.split(':');
      return parts[parts.length - 1] || '';
    })
    .filter(Boolean);
}

/**
 * Set typing indicator for DM (expires in 3 seconds)
 */
export async function setDmTyping(
  userId: string,
  threadId: string,
  isTyping: boolean
): Promise<void> {
  const key = `chat:dm:typing:${threadId}:${userId}`;

  if (isTyping) {
    await healthRedis.setex(key, TYPING_TTL_SECONDS, '1');
  } else {
    await healthRedis.del(key);
  }
}

/**
 * Get all users currently typing in DM thread
 */
export async function getDmTypingUsers(threadId: string): Promise<string[]> {
  const pattern = `chat:dm:typing:${threadId}:*`;
  const keys = await healthRedis.keys(pattern);

  return keys
    .map((key) => {
      const parts = key.split(':');
      return parts[parts.length - 1] || '';
    })
    .filter(Boolean);
}
