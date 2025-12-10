/**
 * Admin Event Management Mutations
 */

import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma.js';
import { resolverWithMetrics } from '../../../lib/resolver-metrics.js';
import type { MutationResolvers } from '../../__generated__/resolvers-types.js';
import { requireAdmin } from '../shared/auth-guards.js';

/**
 * Mutation: Admin update event
 */
export const adminUpdateEventMutation: MutationResolvers['adminUpdateEvent'] =
  resolverWithMetrics(
    'Mutation',
    'adminUpdateEvent',
    async (_p, { id, input }, { user }) => {
      requireAdmin(user);

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Update event
      const updated = await prisma.event.update({
        where: { id },
        data: {
          ...input,
          categorySlugs: input.categorySlugs
            ? { set: input.categorySlugs }
            : undefined,
          tagIds: input.tagIds ? { set: input.tagIds } : undefined,
          levels: input.levels ? { set: input.levels } : undefined,
        },
        include: {
          owner: true,
          members: {
            where: { status: 'JOINED' },
          },
        },
      });

      return updated as any;
    }
  );

/**
 * Mutation: Admin delete event (soft delete)
 */
export const adminDeleteEventMutation: MutationResolvers['adminDeleteEvent'] =
  resolverWithMetrics(
    'Mutation',
    'adminDeleteEvent',
    async (_p, { id }, { user }) => {
      requireAdmin(user);

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Soft delete
      await prisma.event.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: user.id,
        },
      });

      return true;
    }
  );

/**
 * Mutation: Admin cancel event
 */
export const adminCancelEventMutation: MutationResolvers['adminCancelEvent'] =
  resolverWithMetrics(
    'Mutation',
    'adminCancelEvent',
    async (_p, { id, reason }, { user }) => {
      requireAdmin(user);

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Cancel event
      const updated = await prisma.event.update({
        where: { id },
        data: {
          canceledAt: new Date(),
          canceledById: user.id,
          cancelReason: reason || 'Canceled by admin',
        },
        include: {
          owner: true,
          members: {
            where: { status: 'JOINED' },
          },
        },
      });

      return updated as any;
    }
  );

/**
 * Mutation: Admin restore event
 */
export const adminRestoreEventMutation: MutationResolvers['adminRestoreEvent'] =
  resolverWithMetrics(
    'Mutation',
    'adminRestoreEvent',
    async (_p, { id }, { user }) => {
      requireAdmin(user);

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Restore event
      const updated = await prisma.event.update({
        where: { id },
        data: {
          canceledAt: null,
          canceledById: null,
          cancelReason: null,
          deletedAt: null,
          deletedById: null,
        },
        include: {
          owner: true,
          members: {
            where: { status: 'JOINED' },
          },
        },
      });

      return updated as any;
    }
  );

/**
 * Mutation: Admin change event owner
 */
export const adminChangeEventOwnerMutation: MutationResolvers['adminChangeEventOwner'] =
  resolverWithMetrics(
    'Mutation',
    'adminChangeEventOwner',
    async (_p, { eventId, newOwnerId }, { user }) => {
      requireAdmin(user);

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          owner: true,
        },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if new owner exists
      const newOwner = await prisma.user.findUnique({
        where: { id: newOwnerId },
      });

      if (!newOwner) {
        throw new GraphQLError('New owner not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Update owner
      const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
          ownerId: newOwnerId,
        },
        include: {
          owner: true,
          members: {
            where: { status: 'JOINED' },
          },
        },
      });

      // Ensure new owner has a membership record
      await prisma.eventMember.upsert({
        where: {
          eventId_userId: {
            eventId,
            userId: newOwnerId,
          },
        },
        create: {
          eventId,
          userId: newOwnerId,
          status: 'JOINED',
          role: 'MODERATOR',
        },
        update: {
          status: 'JOINED',
          role: 'MODERATOR',
        },
      });

      return updated as any;
    }
  );

/**
 * Mutation: Admin bulk update events
 */
export const adminBulkUpdateEventsMutation: MutationResolvers['adminBulkUpdateEvents'] =
  resolverWithMetrics(
    'Mutation',
    'adminBulkUpdateEvents',
    async (_p, { ids, input }, { user }) => {
      requireAdmin(user);

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const id of ids) {
        try {
          await prisma.event.update({
            where: { id },
            data: {
              visibility: input.visibility || undefined,
              joinManuallyClosed: input.joinManuallyClosed ?? undefined,
              joinManualCloseReason: input.joinManualCloseReason || undefined,
            },
          });
          success++;
        } catch (error: any) {
          failed++;
          errors.push(`Event ${id}: ${error.message}`);
        }
      }

      return {
        success,
        failed,
        errors,
      };
    }
  );

/**
 * Mutation: Admin update member role
 */
export const adminUpdateMemberRoleMutation: MutationResolvers['adminUpdateMemberRole'] =
  resolverWithMetrics(
    'Mutation',
    'adminUpdateMemberRole',
    async (_p, { input }, { user }) => {
      requireAdmin(user);

      const { eventId, userId, role } = input;

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if member exists
      const member = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      });

      if (!member) {
        throw new GraphQLError('Member not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Prevent changing owner role
      if (member.role === 'OWNER') {
        throw new GraphQLError('Cannot change owner role.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Update member role
      await prisma.eventMember.update({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        data: {
          role,
        },
      });

      return event as any;
    }
  );

/**
 * Mutation: Admin kick member
 */
export const adminKickMemberMutation: MutationResolvers['adminKickMember'] =
  resolverWithMetrics(
    'Mutation',
    'adminKickMember',
    async (_p, { input }, { user }) => {
      requireAdmin(user);

      const { eventId, userId } = input;

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if member exists
      const member = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      });

      if (!member) {
        throw new GraphQLError('Member not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Prevent kicking owner
      if (member.role === 'OWNER') {
        throw new GraphQLError('Cannot kick the owner.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Update member status to LEFT with leftAt timestamp
      await prisma.eventMember.update({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        data: {
          status: 'LEFT',
          leftAt: new Date(),
        },
      });

      return event as any;
    }
  );

/**
 * Mutation: Admin ban member
 */
export const adminBanMemberMutation: MutationResolvers['adminBanMember'] =
  resolverWithMetrics(
    'Mutation',
    'adminBanMember',
    async (_p, { input }, { user }) => {
      requireAdmin(user);

      const { eventId, userId } = input;

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if member exists
      const member = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      });

      if (!member) {
        throw new GraphQLError('Member not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Prevent banning owner
      if (member.role === 'OWNER') {
        throw new GraphQLError('Cannot ban the owner.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Update member status to BANNED
      await prisma.eventMember.update({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        data: {
          status: 'BANNED',
          leftAt: new Date(),
        },
      });

      return event as any;
    }
  );

/**
 * Mutation: Admin unban member
 */
export const adminUnbanMemberMutation: MutationResolvers['adminUnbanMember'] =
  resolverWithMetrics(
    'Mutation',
    'adminUnbanMember',
    async (_p, { input }, { user }) => {
      requireAdmin(user);

      const { eventId, userId } = input;

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if member exists
      const member = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      });

      if (!member) {
        throw new GraphQLError('Member not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Update member status to LEFT (they can rejoin if they want)
      await prisma.eventMember.update({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        data: {
          status: 'LEFT',
          leftAt: new Date(),
        },
      });

      return event as any;
    }
  );
