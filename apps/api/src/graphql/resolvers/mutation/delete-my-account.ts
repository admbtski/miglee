import { GraphQLError } from 'graphql';
import { MutationResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/pino';

/**
 * Delete current user's account (soft delete)
 * Sets deletedAt timestamp and optional reason
 */
export const deleteMyAccountMutation: MutationResolvers['deleteMyAccount'] =
  async (_parent, args, ctx) => {
    const { user } = ctx;

    const userId = user?.id;

    if (!userId) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { reason } = args;

    try {
      // Soft delete: set deletedAt and optional reason
      await prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          deletedReason: reason || null,
        },
      });

      logger.info(
        {
          userId: userId,
          reason: reason || 'No reason provided',
        },
        'User account marked for deletion'
      );

      return true;
    } catch (error) {
      logger.error(
        {
          userId: userId,
          error,
        },
        'Failed to delete user account'
      );
      throw new GraphQLError('Failed to delete account', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  };
