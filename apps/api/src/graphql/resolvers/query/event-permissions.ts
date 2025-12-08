import { EventMemberRole, EventMemberStatus } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';

/**
 * Query: eventPermissions
 * Returns permission flags for the current user for a specific event
 */
export const eventPermissionsQuery: QueryResolvers['eventPermissions'] =
  resolverWithMetrics(
    'Query',
    'eventPermissions',
    async (_parent, { eventId }, ctx) => {
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

      // Find user's membership in the event
      const membership = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        select: {
          role: true,
          status: true,
        },
      });

      // Determine event-level permissions
      const isOwner = membership?.role === EventMemberRole.OWNER;
      const isModerator = membership?.role === EventMemberRole.MODERATOR;
      const isParticipant =
        membership?.role === EventMemberRole.PARTICIPANT &&
        membership?.status === EventMemberStatus.JOINED;

      // User can manage if they are:
      // - Owner or moderator of the event
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
