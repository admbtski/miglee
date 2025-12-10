/**
 * Event Chat Message Reactions Resolvers
 *
 * Authorization: EVENT_PARTICIPANT
 */

import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { requireAuth, requireEventParticipant } from '../shared/auth-guards';

const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/**
 * Add reaction to Event chat message
 * Authorization: EVENT_PARTICIPANT
 */
export const addEventReactionMutation: MutationResolvers['addEventReaction'] =
  resolverWithMetrics(
    'Mutation',
    'addEventReaction',
    async (_p, { messageId, emoji }, ctx) => {
      const userId = requireAuth(ctx);

      // Validate emoji
      if (!ALLOWED_EMOJIS.includes(emoji)) {
        throw new GraphQLError('Invalid emoji. Allowed: 👍 ❤️ 😂 😮 😢 🙏', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Check if message exists
      const message = await prisma.eventChatMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new GraphQLError('Message not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if user is a joined member
      await requireEventParticipant(userId, message.eventId);

      // Upsert reaction (idempotent)
      await prisma.eventChatMessageReaction.upsert({
        where: {
          messageId_userId_emoji: { messageId, userId, emoji },
        },
        create: { messageId, userId, emoji },
        update: {}, // No-op if already exists
      });

      // Publish to WebSocket
      await ctx.pubsub?.publish({
        topic: `eventReactionAdded:${message.eventId}`,
        payload: {
          eventReactionAdded: { messageId, userId, emoji, action: 'ADD' },
        },
      });

      return true;
    }
  );

/**
 * Remove reaction from Event chat message
 * Authorization: EVENT_PARTICIPANT
 */
export const removeEventReactionMutation: MutationResolvers['removeEventReaction'] =
  resolverWithMetrics(
    'Mutation',
    'removeEventReaction',
    async (_p, { messageId, emoji }, ctx) => {
      const userId = requireAuth(ctx);

      // Check if message exists
      const message = await prisma.eventChatMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new GraphQLError('Message not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if user is a joined member
      await requireEventParticipant(userId, message.eventId);

      // Delete reaction (idempotent - no error if doesn't exist)
      await prisma.eventChatMessageReaction.deleteMany({
        where: { messageId, userId, emoji },
      });

      // Publish to WebSocket
      await ctx.pubsub?.publish({
        topic: `eventReactionAdded:${message.eventId}`,
        payload: {
          eventReactionAdded: { messageId, userId, emoji, action: 'REMOVE' },
        },
      });

      return true;
    }
  );
