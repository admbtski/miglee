import { GraphQLError } from 'graphql';
import { MutationResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/pino';
import {
  trackAccountDeleted,
  traceAccountOperation,
} from '../../../lib/observability';

/**
 * Delete current user's account (soft delete)
 * Sets deletedAt timestamp and optional reason
 *
 * CRITICAL for observability: Most expensive "operationally" - tickets, rollbacks, security.
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

    return traceAccountOperation(
      'delete_self',
      { userId },
      async (span) => {
        span.setAttribute('account.deletion_type', 'self');
        if (reason) span.setAttribute('account.has_reason', true);

        try {
          // Soft delete: set deletedAt and optional reason
          await prisma.user.update({
            where: { id: userId },
            data: {
              deletedAt: new Date(),
              deletedReason: reason || null,
            },
          });

          // Track account deletion
          trackAccountDeleted({
            userId,
            deletionType: 'self',
            actorId: userId,
            anonymize: false,
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
      }
    );
  };
