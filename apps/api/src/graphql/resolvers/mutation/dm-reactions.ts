/**
 * DM Message Reactions Resolvers
 */

import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';

const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/**
 * Add reaction to DM message
 */
export const addDmReactionMutation: MutationResolvers['addDmReaction'] =
  resolverWithMetrics(
    'Mutation',
    'addDmReaction',
    async (_p, { messageId, emoji }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

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
        message.thread.aUserId !== user.id &&
        message.thread.bUserId !== user.id
      ) {
        throw new GraphQLError('Access denied.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Upsert reaction (idempotent)
      await prisma.dmMessageReaction.upsert({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId: user.id,
            emoji,
          },
        },
        create: {
          messageId,
          userId: user.id,
          emoji,
        },
        update: {}, // No-op if already exists
      });

      // Publish to WebSocket
      await pubsub?.publish({
        topic: `dmReactionAdded:${message.threadId}`,
        payload: {
          dmReactionAdded: {
            messageId,
            userId: user.id,
            emoji,
            action: 'ADD',
          },
        },
      });

      return true;
    }
  );

/**
 * Remove reaction from DM message
 */
export const removeDmReactionMutation: MutationResolvers['removeDmReaction'] =
  resolverWithMetrics(
    'Mutation',
    'removeDmReaction',
    async (_p, { messageId, emoji }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
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
        message.thread.aUserId !== user.id &&
        message.thread.bUserId !== user.id
      ) {
        throw new GraphQLError('Access denied.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Delete reaction (idempotent - no error if doesn't exist)
      await prisma.dmMessageReaction.deleteMany({
        where: {
          messageId,
          userId: user.id,
          emoji,
        },
      });

      // Publish to WebSocket
      await pubsub?.publish({
        topic: `dmReactionAdded:${message.threadId}`,
        payload: {
          dmReactionAdded: {
            messageId,
            userId: user.id,
            emoji,
            action: 'REMOVE',
          },
        },
      });

      return true;
    }
  );
