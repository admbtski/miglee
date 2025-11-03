import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapComment } from '../helpers';

const COMMENT_INCLUDE = {
  author: true,
  intent: true,
  parent: true,
  replies: {
    include: {
      author: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: {
    select: {
      replies: true,
    },
  },
} satisfies Prisma.CommentInclude;

/**
 * Mutation: Create a comment
 */
export const createCommentMutation: MutationResolvers['createComment'] =
  resolverWithMetrics(
    'Mutation',
    'createComment',
    async (_p, { input }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { intentId, content, parentId } = input;

      // Validate content
      if (!content || content.trim().length === 0) {
        throw new GraphQLError('Comment content cannot be empty.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'content' },
        });
      }

      if (content.length > 5000) {
        throw new GraphQLError(
          'Comment content too long (max 5000 characters).',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'content' },
          }
        );
      }

      // Verify intent exists
      const intent = await prisma.intent.findUnique({
        where: { id: intentId },
        select: { id: true, deletedAt: true },
      });

      if (!intent || intent.deletedAt) {
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // If parentId provided, verify parent exists and belongs to same intent
      let threadId = intentId; // Default thread is the intent itself
      if (parentId) {
        const parent = await prisma.comment.findUnique({
          where: { id: parentId },
          select: { intentId: true, threadId: true, deletedAt: true },
        });

        if (!parent || parent.deletedAt) {
          throw new GraphQLError('Parent comment not found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        if (parent.intentId !== intentId) {
          throw new GraphQLError(
            'Parent comment belongs to different intent.',
            {
              extensions: { code: 'BAD_USER_INPUT' },
            }
          );
        }

        threadId = parent.threadId;
      }

      const comment = await prisma.comment.create({
        data: {
          intentId,
          authorId: user.id,
          content: content.trim(),
          parentId: parentId || null,
          threadId, // Set threadId to parent's thread or intent id
        },
        include: COMMENT_INCLUDE,
      });

      // Update intent commentsCount
      await prisma.intent.update({
        where: { id: intentId },
        data: { commentsCount: { increment: 1 } },
      });

      return mapComment(comment as any);
    }
  );

/**
 * Mutation: Update a comment
 */
export const updateCommentMutation: MutationResolvers['updateComment'] =
  resolverWithMetrics(
    'Mutation',
    'updateComment',
    async (_p, { id, input }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { content } = input;

      // Validate content
      if (!content || content.trim().length === 0) {
        throw new GraphQLError('Comment content cannot be empty.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'content' },
        });
      }

      if (content.length > 5000) {
        throw new GraphQLError(
          'Comment content too long (max 5000 characters).',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'content' },
          }
        );
      }

      // Verify ownership
      const existing = await prisma.comment.findUnique({
        where: { id },
        select: { authorId: true, deletedAt: true },
      });

      if (!existing) {
        throw new GraphQLError('Comment not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (existing.authorId !== user.id) {
        throw new GraphQLError('Cannot edit comments from other users.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (existing.deletedAt) {
        throw new GraphQLError('Cannot edit deleted comment.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      const updated = await prisma.comment.update({
        where: { id },
        data: { content: content.trim() },
        include: COMMENT_INCLUDE,
      });

      return mapComment(updated as any);
    }
  );

/**
 * Mutation: Delete a comment (soft delete)
 */
export const deleteCommentMutation: MutationResolvers['deleteComment'] =
  resolverWithMetrics(
    'Mutation',
    'deleteComment',
    async (_p, { id }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const existing = await prisma.comment.findUnique({
        where: { id },
        select: { authorId: true, deletedAt: true, intentId: true },
      });

      if (!existing) {
        return false; // Idempotent
      }

      if (existing.authorId !== user.id) {
        throw new GraphQLError('Cannot delete comments from other users.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (existing.deletedAt) {
        return true; // Already deleted
      }

      await prisma.comment.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Decrement intent commentsCount
      await prisma.intent.update({
        where: { id: existing.intentId },
        data: { commentsCount: { decrement: 1 } },
      });

      return true;
    }
  );
