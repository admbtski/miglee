/**
 * Chat Typing Indicators
 *
 * Ephemeral typing state stored in Redis with 3-second TTL.
 * Uses dedicated chatRedis connection for chat-specific features.
 */

import { chatRedis } from './redis';

// =============================================================================
// Typing Indicator (Ephemeral, Redis TTL)
// =============================================================================

const TYPING_TTL_SECONDS = 3;

/**
 * Set typing indicator for event chat (expires in 3 seconds)
 */
export async function setEventChatTyping(
  userId: string,
  eventId: string,
  isTyping: boolean
): Promise<void> {
  const key = `chat:event:typing:${eventId}:${userId}`;

  if (isTyping) {
    await chatRedis.setex(key, TYPING_TTL_SECONDS, '1');
  } else {
    await chatRedis.del(key);
  }
}

/**
 * Get all users currently typing in event chat
 */
export async function getEventChatTypingUsers(
  eventId: string
): Promise<string[]> {
  const pattern = `chat:event:typing:${eventId}:*`;
  const keys = await chatRedis.keys(pattern);

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
    await chatRedis.setex(key, TYPING_TTL_SECONDS, '1');
  } else {
    await chatRedis.del(key);
  }
}

/**
 * Get all users currently typing in DM thread
 */
export async function getDmTypingUsers(threadId: string): Promise<string[]> {
  const pattern = `chat:dm:typing:${threadId}:*`;
  const keys = await chatRedis.keys(pattern);

  return keys
    .map((key) => {
      const parts = key.split(':');
      return parts[parts.length - 1] || '';
    })
    .filter(Boolean);
}
