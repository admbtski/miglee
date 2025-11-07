/**
 * Intent Invite Links Mutation Resolvers
 */

import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import {
  mapIntentInviteLink,
  mapIntent,
  type IntentInviteLinkWithGraph,
  type IntentWithGraph,
} from '../helpers';
import { nanoid } from 'nanoid';

const INVITE_LINK_INCLUDE = {
  intent: true,
} satisfies Prisma.IntentInviteLinkInclude;

/**
 * Mutation: Create invite link
 */
export const createIntentInviteLinkMutation: MutationResolvers['createIntentInviteLink'] =
  resolverWithMetrics(
    'Mutation',
    'createIntentInviteLink',
    async (_p, { input }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { intentId, maxUses, expiresAt } = input;

      // Check ownership/moderator
      const intent = await prisma.intent.findUnique({
        where: { id: intentId },
        select: {
          ownerId: true,
          members: {
            where: { userId: user.id, status: 'JOINED' },
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
          'Only owner/moderators can create invite links.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      // Generate unique code
      const code = nanoid(10);

      const link = await prisma.intentInviteLink.create({
        data: {
          intentId,
          code,
          maxUses: maxUses ?? null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
        include: INVITE_LINK_INCLUDE,
      });

      return mapIntentInviteLink(link as IntentInviteLinkWithGraph);
    }
  );

/**
 * Mutation: Delete invite link
 */
export const deleteIntentInviteLinkMutation: MutationResolvers['deleteIntentInviteLink'] =
  resolverWithMetrics(
    'Mutation',
    'deleteIntentInviteLink',
    async (_p, { id }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const link = await prisma.intentInviteLink.findUnique({
        where: { id },
        select: {
          intentId: true,
          intent: {
            select: {
              ownerId: true,
              members: {
                where: { userId: user.id, status: 'JOINED' },
                select: { role: true },
              },
            },
          },
        },
      });

      if (!link) {
        return false;
      }

      const isOwner = link.intent.ownerId === user.id;
      const isModerator = link.intent.members.some(
        (m) => m.role === 'MODERATOR' || m.role === 'OWNER'
      );

      if (!isOwner && !isModerator) {
        throw new GraphQLError(
          'Only owner/moderators can delete invite links.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      await prisma.intentInviteLink.delete({ where: { id } });
      return true;
    }
  );

/**
 * Mutation: Use invite link to join intent
 */
export const useIntentInviteLinkMutation: MutationResolvers['useIntentInviteLink'] =
  resolverWithMetrics(
    'Mutation',
    'useIntentInviteLink',
    async (_p, { code }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const link = await prisma.intentInviteLink.findUnique({
        where: { code },
        include: {
          intent: {
            include: {
              categories: true,
              tags: true,
              members: { include: { user: true, addedBy: true } },
              owner: true,
              canceledBy: true,
              deletedBy: true,
            },
          },
        },
      });

      if (!link) {
        throw new GraphQLError('Invalid invite code.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if expired
      if (link.expiresAt && link.expiresAt < new Date()) {
        throw new GraphQLError('Invite link has expired.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      // Check if maxed out
      if (link.maxUses && link.usedCount >= link.maxUses) {
        throw new GraphQLError('Invite link has reached maximum uses.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      // Check if already a member
      const existing = await prisma.intentMember.findUnique({
        where: {
          intentId_userId: {
            intentId: link.intentId,
            userId: user.id,
          },
        },
      });

      if (existing && existing.status === 'JOINED') {
        // Already joined, just return intent
        return mapIntent(link.intent);
      }

      // Create or update membership
      await prisma.intentMember.upsert({
        where: {
          intentId_userId: {
            intentId: link.intentId,
            userId: user.id,
          },
        },
        create: {
          intentId: link.intentId,
          userId: user.id,
          status: 'JOINED',
          role: 'PARTICIPANT',
        },
        update: {
          status: 'JOINED',
          role: 'PARTICIPANT',
        },
      });

      // Increment usedCount
      await prisma.intentInviteLink.update({
        where: { id: link.id },
        data: { usedCount: { increment: 1 } },
      });

      // Update intent joinedCount
      await prisma.intent.update({
        where: { id: link.intentId },
        data: { joinedCount: { increment: 1 } },
      });

      return mapIntent(link.intent);
    }
  );
