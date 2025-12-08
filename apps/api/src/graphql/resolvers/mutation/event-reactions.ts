/**
 * Event Chat Message Reactions Resolvers
 */

import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { requireJoinedMember } from '../chat-guards';

const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/**
 * Add reaction to Event chat message
 */
export const addEventReactionMutation: MutationResolvers['addEventReaction'] =
  resolverWithMetrics(
    'Mutation',
    'addEventReaction',
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
      await requireJoinedMember(user.id, message.eventId);

      // Upsert reaction (idempotent)
      await prisma.eventChatMessageReaction.upsert({
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
        topic: `eventReactionAdded:${message.eventId}`,
        payload: {
          eventReactionAdded: {
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
 * Remove reaction from Event chat message
 */
export const removeEventReactionMutation: MutationResolvers['removeEventReaction'] =
  resolverWithMetrics(
    'Mutation',
    'removeEventReaction',
    async (_p, { messageId, emoji }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
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
      await requireJoinedMember(user.id, message.eventId);

      // Delete reaction (idempotent - no error if doesn't exist)
      await prisma.eventChatMessageReaction.deleteMany({
        where: {
          messageId,
          userId: user.id,
          emoji,
        },
      });

      // Publish to WebSocket
      await pubsub?.publish({
        topic: `eventReactionAdded:${message.eventId}`,
        payload: {
          eventReactionAdded: {
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
