import { IntentMemberRole, IntentMemberStatus } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';

/**
 * Query: intentPermissions
 * Returns permission flags for the current user for a specific intent
 */
export const intentPermissionsQuery: QueryResolvers['intentPermissions'] =
  resolverWithMetrics(
    'Query',
    'intentPermissions',
    async (_parent, { intentId }, ctx) => {
      // Check if user is authenticated
      if (!ctx.user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = ctx.user.id;

      // Check app-level permissions
      const isAppAdmin = ctx.user.role === 'ADMIN';
      const isAppModerator = ctx.user.role === 'MODERATOR';

      // Find user's membership in the intent
      const membership = await prisma.intentMember.findUnique({
        where: {
          intentId_userId: {
            intentId,
            userId,
          },
        },
        select: {
          role: true,
          status: true,
        },
      });

      // Determine intent-level permissions
      const isOwner = membership?.role === IntentMemberRole.OWNER;
      const isModerator = membership?.role === IntentMemberRole.MODERATOR;
      const isParticipant =
        membership?.role === IntentMemberRole.PARTICIPANT &&
        membership?.status === IntentMemberStatus.JOINED;

      // User can manage if they are:
      // - Owner or moderator of the intent
      // - App admin or moderator
      const canManage = isOwner || isModerator || isAppAdmin || isAppModerator;

      return {
        isOwner,
        isModerator,
        isParticipant,
        isAppAdmin,
        isAppModerator,
        canManage,
      };
    }
  );
