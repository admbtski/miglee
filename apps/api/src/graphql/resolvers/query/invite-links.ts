/**
 * Event Invite Links Query Resolvers
 *
 * Authorization levels:
 * - eventInviteLinks: EVENT_MOD_OR_OWNER
 * - eventInviteLink: EVENT_MOD_OR_OWNER
 * - validateInviteLink: ANY
 */

import type { Prisma } from '../../../prisma-client/client';
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
import { requireEventModOrOwner } from '../shared/auth-guards';

const INVITE_LINK_INCLUDE = {
  event: true,
  createdBy: true,
  revokedBy: true,
} satisfies Prisma.EventInviteLinkInclude;

/**
 * Query: Get all invite links for an event
 * Authorization: EVENT_MOD_OR_OWNER
 */
export const eventInviteLinksQuery: QueryResolvers['eventInviteLinks'] =
  resolverWithMetrics(
    'Query',
    'eventInviteLinks',
    async (_p, { eventId, includeRevoked }, ctx) => {
      // Check EVENT_MOD_OR_OWNER (includes app mod/admin bypass)
      await requireEventModOrOwner(ctx.user, eventId);

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
 * Authorization: EVENT_MOD_OR_OWNER
 */
export const eventInviteLinkQuery: QueryResolvers['eventInviteLink'] =
  resolverWithMetrics(
    'Query',
    'eventInviteLink',
    async (_p, { id, code }, ctx) => {
      if (!id && !code) {
        throw new GraphQLError('Either id or code must be provided.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // First fetch link to get eventId
      const link = await prisma.eventInviteLink.findUnique({
        where: id ? { id } : { code: code! },
        include: INVITE_LINK_INCLUDE,
      });

      if (!link) {
        return null;
      }

      // Check EVENT_MOD_OR_OWNER (includes app mod/admin bypass)
      await requireEventModOrOwner(ctx.user, link.eventId);

      return mapEventInviteLink(link as EventInviteLinkWithGraph);
    }
  );

/**
 * Query: Validate invite link before joining
 * Required level: ANY (public validation)
 */
export const validateInviteLinkQuery: QueryResolvers['validateInviteLink'] =
  resolverWithMetrics(
    'Query',
    'validateInviteLink',
    async (_p, { code }, { user }) => {
      // ANY - no auth required for public validation
      // user may be null/undefined

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
              // Only check membership if user is logged in
              ...(user?.id
                ? {
                    members: {
                      where: { userId: user.id },
                      include: {
                        user: { include: { profile: true } },
                        addedBy: true,
                      },
                    },
                  }
                : {}),
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

      // Check if user is already a member (only if logged in)
      if (user?.id) {
        type EventWithMembers = { members?: Array<{ status: string }> };
        const existingMember = (link.event as EventWithMembers).members?.[0];
        if (existingMember) {
          return {
            valid: false,
            reason: `Już jesteś członkiem tego wydarzenia (status: ${existingMember.status})`,
            link: mapEventInviteLink(link as EventInviteLinkWithGraph),
            event: mapEvent(link.event as unknown as EventWithGraph, user.id),
          };
        }
      }

      // Check if event is deleted or canceled
      const eventData = link.event as {
        deletedAt?: Date | null;
        canceledAt?: Date | null;
      };
      if (eventData.deletedAt) {
        return {
          valid: false,
          reason: 'Wydarzenie zostało usunięte',
          link: mapEventInviteLink(link as EventInviteLinkWithGraph),
          event: mapEvent(link.event as unknown as EventWithGraph, user?.id),
        };
      }

      if (eventData.canceledAt) {
        return {
          valid: false,
          reason: 'Wydarzenie zostało anulowane',
          link: mapEventInviteLink(link as EventInviteLinkWithGraph),
          event: mapEvent(link.event as unknown as EventWithGraph, user?.id),
        };
      }

      return {
        valid: true,
        reason: null,
        link: mapEventInviteLink(link as EventInviteLinkWithGraph),
        event: mapEvent(link.event as unknown as EventWithGraph, user?.id),
      };
    }
  );
