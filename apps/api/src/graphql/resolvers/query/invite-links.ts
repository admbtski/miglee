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
  type IntentInviteLinkWithGraph,
} from '../helpers';

const INVITE_LINK_INCLUDE = {
  intent: true,
} satisfies Prisma.IntentInviteLinkInclude;

/**
 * Query: Get all invite links for an intent (owner/moderator only)
 */
export const intentInviteLinksQuery: QueryResolvers['intentInviteLinks'] =
  resolverWithMetrics(
    'Query',
    'intentInviteLinks',
    async (_p, { intentId }, { user }) => {
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

      const links = await prisma.intentInviteLink.findMany({
        where: { intentId },
        include: INVITE_LINK_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });

      return links.map((link) =>
        mapIntentInviteLink(link as IntentInviteLinkWithGraph)
      );
    }
  );

/**
 * Query: Get invite link by code (public, for joining)
 */
export const intentInviteLinkQuery: QueryResolvers['intentInviteLink'] =
  resolverWithMetrics(
    'Query',
    'intentInviteLink',
    async (_p, { code }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const link = await prisma.intentInviteLink.findUnique({
        where: { code },
        include: INVITE_LINK_INCLUDE,
      });

      if (!link) {
        return null;
      }

      return mapIntentInviteLink(link as IntentInviteLinkWithGraph);
    }
  );
