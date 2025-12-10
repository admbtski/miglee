/**
 * DM Message Reactions Resolvers
 *
 * Authorization: DM_PARTICIPANT (must be part of thread)
 */

import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { requireAuth } from '../shared/auth-guards';

const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/**
 * Add reaction to DM message
 * Authorization: DM_PARTICIPANT
 */
export const addDmReactionMutation: MutationResolvers['addDmReaction'] =
  resolverWithMetrics(
    'Mutation',
    'addDmReaction',
    async (_p, { messageId, emoji }, ctx) => {
      const userId = requireAuth(ctx);

      // Validate emoji
      if (!ALLOWED_EMOJIS.includes(emoji)) {
        throw new GraphQLError('Invalid emoji. Allowed: 👍 ❤️ 😂 😮 😢 🙏', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Check if message exists and user has access
      const message = await prisma.dmMessage.findUnique({
        where: { id: messageId },
        include: { thread: true },
      });

      if (!message) {
        throw new GraphQLError('Message not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if user is part of the thread
      if (
        message.thread.aUserId !== userId &&
        message.thread.bUserId !== userId
      ) {
        throw new GraphQLError('Access denied.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Upsert reaction (idempotent)
      await prisma.dmMessageReaction.upsert({
        where: {
          messageId_userId_emoji: { messageId, userId, emoji },
        },
        create: { messageId, userId, emoji },
        update: {}, // No-op if already exists
      });

      // Publish to WebSocket
      await ctx.pubsub?.publish({
        topic: `dmReactionAdded:${message.threadId}`,
        payload: {
          dmReactionAdded: { messageId, userId, emoji, action: 'ADD' },
        },
      });

      return true;
    }
  );

/**
 * Remove reaction from DM message
 * Authorization: DM_PARTICIPANT
 */
export const removeDmReactionMutation: MutationResolvers['removeDmReaction'] =
  resolverWithMetrics(
    'Mutation',
    'removeDmReaction',
    async (_p, { messageId, emoji }, ctx) => {
      const userId = requireAuth(ctx);

      // Check if message exists and user has access
      const message = await prisma.dmMessage.findUnique({
        where: { id: messageId },
        include: { thread: true },
      });

      if (!message) {
        throw new GraphQLError('Message not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if user is part of the thread
      if (
        message.thread.aUserId !== userId &&
        message.thread.bUserId !== userId
      ) {
        throw new GraphQLError('Access denied.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Delete reaction (idempotent - no error if doesn't exist)
      await prisma.dmMessageReaction.deleteMany({
        where: { messageId, userId, emoji },
      });

      // Publish to WebSocket
      await ctx.pubsub?.publish({
        topic: `dmReactionAdded:${message.threadId}`,
        payload: {
          dmReactionAdded: { messageId, userId, emoji, action: 'REMOVE' },
        },
      });

      return true;
    }
  );
