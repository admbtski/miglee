/**
 * Intent Invite Links Query Resolvers
 */

import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import {
  mapIntentInviteLink,
  mapIntent,
  type IntentInviteLinkWithGraph,
  type IntentWithGraph,
} from '../helpers';

const INVITE_LINK_INCLUDE = {
  intent: true,
  createdBy: true,
  revokedBy: true,
} satisfies Prisma.IntentInviteLinkInclude;

/**
 * Query: Get all invite links for an intent (owner/moderator only)
 */
export const intentInviteLinksQuery: QueryResolvers['intentInviteLinks'] =
  resolverWithMetrics(
    'Query',
    'intentInviteLinks',
    async (_p, { intentId, includeRevoked }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Check if user is owner or moderator
      const intent = await prisma.intent.findUnique({
        where: { id: intentId },
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

      if (!intent) {
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const isOwner = intent.ownerId === user.id;
      const isModerator = intent.members.some(
        (m) => m.role === 'MODERATOR' || m.role === 'OWNER'
      );

      if (!isOwner && !isModerator) {
        throw new GraphQLError(
          'Only intent owner or moderators can view invite links.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      const where: Prisma.IntentInviteLinkWhereInput = { intentId };
      if (!includeRevoked) {
        where.revokedAt = null;
      }

      const links = await prisma.intentInviteLink.findMany({
        where,
        include: INVITE_LINK_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });

      return links.map((link) =>
        mapIntentInviteLink(link as IntentInviteLinkWithGraph)
      );
    }
  );

/**
 * Query: Get invite link by id or code
 */
export const intentInviteLinkQuery: QueryResolvers['intentInviteLink'] =
  resolverWithMetrics(
    'Query',
    'intentInviteLink',
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

      const link = await prisma.intentInviteLink.findUnique({
        where: id ? { id } : { code: code! },
        include: INVITE_LINK_INCLUDE,
      });

      if (!link) {
        return null;
      }

      return mapIntentInviteLink(link as IntentInviteLinkWithGraph);
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

      const link = await prisma.intentInviteLink.findUnique({
        where: { code },
        include: {
          ...INVITE_LINK_INCLUDE,
          intent: {
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
          intent: null,
        };
      }

      // Check if revoked
      if (link.revokedAt) {
        return {
          valid: false,
          reason: 'Link został odwołany',
          link: mapIntentInviteLink(link as IntentInviteLinkWithGraph),
          intent: null,
        };
      }

      // Check if expired
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return {
          valid: false,
          reason: 'Link wygasł',
          link: mapIntentInviteLink(link as IntentInviteLinkWithGraph),
          intent: null,
        };
      }

      // Check if maxed out
      if (link.maxUses && link.usedCount >= link.maxUses) {
        return {
          valid: false,
          reason: 'Link osiągnął limit użyć',
          link: mapIntentInviteLink(link as IntentInviteLinkWithGraph),
          intent: null,
        };
      }

      // Check if user is already a member
      const existingMember = (link.intent as any).members[0];
      if (existingMember) {
        return {
          valid: false,
          reason: `Już jesteś członkiem tego wydarzenia (status: ${existingMember.status})`,
          link: mapIntentInviteLink(link as IntentInviteLinkWithGraph),
          intent: mapIntent(link.intent as IntentWithGraph, user.id),
        };
      }

      // Check if intent is deleted or canceled
      if ((link.intent as any).deletedAt) {
        return {
          valid: false,
          reason: 'Wydarzenie zostało usunięte',
          link: mapIntentInviteLink(link as IntentInviteLinkWithGraph),
          intent: mapIntent(link.intent as IntentWithGraph, user.id),
        };
      }

      if ((link.intent as any).canceledAt) {
        return {
          valid: false,
          reason: 'Wydarzenie zostało anulowane',
          link: mapIntentInviteLink(link as IntentInviteLinkWithGraph),
          intent: mapIntent(link.intent as IntentWithGraph, user.id),
        };
      }

      return {
        valid: true,
        reason: null,
        link: mapIntentInviteLink(link as IntentInviteLinkWithGraph),
        intent: mapIntent(link.intent as IntentWithGraph, user.id),
      };
    }
  );
