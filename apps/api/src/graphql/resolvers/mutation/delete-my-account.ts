import { MutationResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/pino';

/**
 * Delete current user's account (soft delete)
 * Sets deletedAt timestamp and optional reason
 */
export const deleteMyAccountMutation: MutationResolvers['deleteMyAccount'] =
  async (_parent, args, ctx) => {
    const { session } = ctx;

    if (!session?.userId) {
      throw new Error('Authentication required');
    }

    const { reason } = args;

    try {
      // Soft delete: set deletedAt and optional reason
      await prisma.user.update({
        where: { id: session.userId },
        data: {
          deletedAt: new Date(),
          deletedReason: reason || null,
        },
      });

      logger.info(
        {
          userId: session.userId,
          reason: reason || 'No reason provided',
        },
        'User account marked for deletion'
      );

      return true;
    } catch (error) {
      logger.error(
        {
          userId: session.userId,
          error,
        },
        'Failed to delete user account'
      );
      throw new Error('Failed to delete account');
    }
  };
