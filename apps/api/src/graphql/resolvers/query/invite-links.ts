/**
 * Event Invite Links Query Resolvers
 */

import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import {
  mapEventInviteLink,
  mapEvent,
  type EventInviteLinkWithGraph,
  type EventWithGraph,
} from '../helpers';

const INVITE_LINK_INCLUDE = {
  event: true,
  createdBy: true,
  revokedBy: true,
} satisfies Prisma.EventInviteLinkInclude;

/**
 * Query: Get all invite links for an event (owner/moderator only)
 */
export const eventInviteLinksQuery: QueryResolvers['eventInviteLinks'] =
  resolverWithMetrics(
    'Query',
    'eventInviteLinks',
    async (_p, { eventId, includeRevoked }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Check if user is owner or moderator
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          ownerId: true,
          members: {
            where: {
              userId: user.id,
              status: 'JOINED',
            },
            select: { role: true },
          },
        },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const isOwner = event.ownerId === user.id;
      const isModerator = event.members.some(
        (m) => m.role === 'MODERATOR' || m.role === 'OWNER'
      );
      const isAdmin = user.role === 'ADMIN';

      if (!isOwner && !isModerator && !isAdmin) {
        throw new GraphQLError(
          'Only event owner, moderators, or admins can view invite links.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      const where: Prisma.EventInviteLinkWhereInput = { eventId };
      if (!includeRevoked) {
        where.revokedAt = null;
      }

      const links = await prisma.eventInviteLink.findMany({
        where,
        include: INVITE_LINK_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });

      return links.map((link) =>
        mapEventInviteLink(link as EventInviteLinkWithGraph)
      );
    }
  );

/**
 * Query: Get invite link by id or code
 */
export const eventInviteLinkQuery: QueryResolvers['eventInviteLink'] =
  resolverWithMetrics(
    'Query',
    'eventInviteLink',
    async (_p, { id, code }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      if (!id && !code) {
        throw new GraphQLError('Either id or code must be provided.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const link = await prisma.eventInviteLink.findUnique({
        where: id ? { id } : { code: code! },
        include: INVITE_LINK_INCLUDE,
      });

      if (!link) {
        return null;
      }

      return mapEventInviteLink(link as EventInviteLinkWithGraph);
    }
  );

/**
 * Query: Validate invite link before joining
 */
export const validateInviteLinkQuery: QueryResolvers['validateInviteLink'] =
  resolverWithMetrics(
    'Query',
    'validateInviteLink',
    async (_p, { code }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const link = await prisma.eventInviteLink.findUnique({
        where: { code },
        include: {
          ...INVITE_LINK_INCLUDE,
          event: {
            include: {
              categories: true,
              tags: true,
              owner: true,
              canceledBy: true,
              deletedBy: true,
              joinManuallyClosedBy: true,
              members: {
                where: { userId: user.id },
                include: {
                  user: { include: { profile: true } },
                  addedBy: true,
                },
              },
            },
          },
        },
      });

      if (!link) {
        return {
          valid: false,
          reason: 'Link nie istnieje',
          link: null,
          event: null,
        };
      }

      // Check if revoked
      if (link.revokedAt) {
        return {
          valid: false,
          reason: 'Link został odwołany',
          link: mapEventInviteLink(link as EventInviteLinkWithGraph),
          event: null,
        };
      }

      // Check if expired
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return {
          valid: false,
          reason: 'Link wygasł',
          link: mapEventInviteLink(link as EventInviteLinkWithGraph),
          event: null,
        };
      }

      // Check if maxed out
      if (link.maxUses && link.usedCount >= link.maxUses) {
        return {
          valid: false,
          reason: 'Link osiągnął limit użyć',
          link: mapEventInviteLink(link as EventInviteLinkWithGraph),
          event: null,
        };
      }

      // Check if user is already a member
      const existingMember = (link.event as any).members[0];
      if (existingMember) {
        return {
          valid: false,
          reason: `Już jesteś członkiem tego wydarzenia (status: ${existingMember.status})`,
          link: mapEventInviteLink(link as EventInviteLinkWithGraph),
          event: mapEvent(link.event as EventWithGraph, user.id),
        };
      }

      // Check if event is deleted or canceled
      if ((link.event as any).deletedAt) {
        return {
          valid: false,
          reason: 'Wydarzenie zostało usunięte',
          link: mapEventInviteLink(link as EventInviteLinkWithGraph),
          event: mapEvent(link.event as EventWithGraph, user.id),
        };
      }

      if ((link.event as any).canceledAt) {
        return {
          valid: false,
          reason: 'Wydarzenie zostało anulowane',
          link: mapEventInviteLink(link as EventInviteLinkWithGraph),
          event: mapEvent(link.event as EventWithGraph, user.id),
        };
      }

      return {
        valid: true,
        reason: null,
        link: mapEventInviteLink(link as EventInviteLinkWithGraph),
        event: mapEvent(link.event as EventWithGraph, user.id),
      };
    }
  );
