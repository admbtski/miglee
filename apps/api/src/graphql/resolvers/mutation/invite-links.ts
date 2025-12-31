/**
 * Event Invite Links Mutation Resolvers
 */

import type { Prisma } from '../../../prisma-client/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import {
  mapEventInviteLink,
  mapEvent,
  type EventInviteLinkWithGraph,
  type EventWithGraph,
} from '../helpers';
import { nanoid } from 'nanoid';
import { createAuditLog, type CreateAuditLogInput } from '../../../lib/audit';

// Temporary type aliases until prisma generate is run
type AuditScope = CreateAuditLogInput['scope'];
type AuditAction = CreateAuditLogInput['action'];

const INVITE_LINK_INCLUDE = {
  event: true,
  createdBy: true,
  revokedBy: true,
} satisfies Prisma.EventInviteLinkInclude;

/**
 * Mutation: Create invite link
 */
export const createEventInviteLinkMutation: MutationResolvers['createEventInviteLink'] =
  resolverWithMetrics(
    'Mutation',
    'createEventInviteLink',
    async (_p, { input }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { eventId, maxUses, expiresAt, label } = input;

      // Check ownership/moderator
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          ownerId: true,
          members: {
            where: { userId: user.id, status: 'JOINED' },
            select: { role: true },
          },
        },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Global ADMIN or MODERATOR always has access
      const isGlobalMod = user.role === 'ADMIN' || user.role === 'MODERATOR';
      const isOwner = event.ownerId === user.id;
      const isEventModerator = event.members.some(
        (m) => m.role === 'MODERATOR' || m.role === 'OWNER'
      );

      if (!isGlobalMod && !isOwner && !isEventModerator) {
        throw new GraphQLError(
          'Only owner, moderators, or admins can create invite links.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      // Generate unique code
      const code = nanoid(10);

      const link = await prisma.eventInviteLink.create({
        data: {
          eventId,
          code,
          label: label ?? null,
          maxUses: maxUses ?? null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          createdById: user.id,
        },
        include: INVITE_LINK_INCLUDE,
      });

      // Audit log: INVITE_LINK/CREATE (severity 3)
      await createAuditLog(prisma, {
        eventId,
        actorId: user.id,
        actorRole: isOwner
          ? 'OWNER'
          : isEventModerator
            ? 'MODERATOR'
            : user.role,
        scope: 'INVITE_LINK' as AuditScope,
        action: 'CREATE' as AuditAction,
        entityType: 'EventInviteLink',
        entityId: link.id,
        meta: { maxUses, expiresAt, label },
        severity: 3,
      });

      return mapEventInviteLink(link as EventInviteLinkWithGraph);
    }
  );

/**
 * Mutation: Update invite link
 */
export const updateEventInviteLinkMutation: MutationResolvers['updateEventInviteLink'] =
  resolverWithMetrics(
    'Mutation',
    'updateEventInviteLink',
    async (_p, { id, input }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const link = await prisma.eventInviteLink.findUnique({
        where: { id },
        select: {
          eventId: true,
          event: {
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
        throw new GraphQLError('Invite link not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Global ADMIN or MODERATOR always has access
      const isGlobalMod = user.role === 'ADMIN' || user.role === 'MODERATOR';
      const isOwner = link.event.ownerId === user.id;
      const isEventModerator = link.event.members.some(
        (m) => m.role === 'MODERATOR' || m.role === 'OWNER'
      );

      if (!isGlobalMod && !isOwner && !isEventModerator) {
        throw new GraphQLError(
          'Only owner, moderators, or admins can update invite links.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      const updated = await prisma.eventInviteLink.update({
        where: { id },
        data: {
          label: input.label ?? undefined,
          maxUses: input.maxUses ?? undefined,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        },
        include: INVITE_LINK_INCLUDE,
      });

      // Audit log: INVITE_LINK/UPDATE (severity 3)
      await createAuditLog(prisma, {
        eventId: link.eventId,
        actorId: user.id,
        actorRole: isOwner
          ? 'OWNER'
          : isEventModerator
            ? 'MODERATOR'
            : user.role,
        scope: 'INVITE_LINK' as AuditScope,
        action: 'UPDATE' as AuditAction,
        entityType: 'EventInviteLink',
        entityId: id,
        diff: {
          ...(input.label !== undefined && {
            label: { from: null, to: input.label },
          }),
          ...(input.maxUses !== undefined && {
            maxUses: { from: null, to: input.maxUses },
          }),
          ...(input.expiresAt !== undefined && {
            expiresAt: { from: null, to: input.expiresAt },
          }),
        },
        severity: 3,
      });

      return mapEventInviteLink(updated as EventInviteLinkWithGraph);
    }
  );

/**
 * Mutation: Revoke invite link (soft delete)
 */
export const revokeEventInviteLinkMutation: MutationResolvers['revokeEventInviteLink'] =
  resolverWithMetrics(
    'Mutation',
    'revokeEventInviteLink',
    async (_p, { id }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const link = await prisma.eventInviteLink.findUnique({
        where: { id },
        select: {
          eventId: true,
          event: {
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
        throw new GraphQLError('Invite link not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Global ADMIN or MODERATOR always has access
      const isGlobalMod = user.role === 'ADMIN' || user.role === 'MODERATOR';
      const isOwner = link.event.ownerId === user.id;
      const isEventModerator = link.event.members.some(
        (m) => m.role === 'MODERATOR' || m.role === 'OWNER'
      );

      if (!isGlobalMod && !isOwner && !isEventModerator) {
        throw new GraphQLError(
          'Only owner, moderators, or admins can revoke invite links.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      const revoked = await prisma.eventInviteLink.update({
        where: { id },
        data: {
          revokedAt: new Date(),
          revokedById: user.id,
        },
        include: INVITE_LINK_INCLUDE,
      });

      // Audit log: INVITE_LINK/DELETE (severity 4) - revoked
      await createAuditLog(prisma, {
        eventId: link.eventId,
        actorId: user.id,
        actorRole: isOwner
          ? 'OWNER'
          : isEventModerator
            ? 'MODERATOR'
            : user.role,
        scope: 'INVITE_LINK' as AuditScope,
        action: 'DELETE' as AuditAction,
        entityType: 'EventInviteLink',
        entityId: id,
        meta: { revoked: true },
        severity: 4,
      });

      return mapEventInviteLink(revoked as EventInviteLinkWithGraph);
    }
  );

/**
 * Mutation: Delete invite link (hard delete)
 */
export const deleteEventInviteLinkMutation: MutationResolvers['deleteEventInviteLink'] =
  resolverWithMetrics(
    'Mutation',
    'deleteEventInviteLink',
    async (_p, { id }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const link = await prisma.eventInviteLink.findUnique({
        where: { id },
        select: {
          eventId: true,
          event: {
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

      // Global ADMIN or MODERATOR always has access
      const isGlobalMod = user.role === 'ADMIN' || user.role === 'MODERATOR';
      const isOwner = link.event.ownerId === user.id;
      const isEventModerator = link.event.members.some(
        (m) => m.role === 'MODERATOR' || m.role === 'OWNER'
      );

      if (!isGlobalMod && !isOwner && !isEventModerator) {
        throw new GraphQLError(
          'Only owner, moderators, or admins can delete invite links.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      // Audit log: INVITE_LINK/DELETE (severity 4) - hard delete
      await createAuditLog(prisma, {
        eventId: link.eventId,
        actorId: user.id,
        actorRole: isOwner
          ? 'OWNER'
          : isEventModerator
            ? 'MODERATOR'
            : user.role,
        scope: 'INVITE_LINK' as AuditScope,
        action: 'DELETE' as AuditAction,
        entityType: 'EventInviteLink',
        entityId: id,
        meta: { hard: true },
        severity: 4,
      });

      await prisma.eventInviteLink.delete({ where: { id } });
      return true;
    }
  );

/**
 * Mutation: Join event using invite link
 */
export const joinByInviteLinkMutation: MutationResolvers['joinByInviteLink'] =
  resolverWithMetrics(
    'Mutation',
    'joinByInviteLink',
    async (_p, { code }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const link = await prisma.eventInviteLink.findUnique({
        where: { code },
        include: {
          event: {
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

      // Check if revoked
      if (link.revokedAt) {
        throw new GraphQLError('Invite link has been revoked.', {
          extensions: { code: 'FAILED_PRECONDITION' },
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

      // Check if event is deleted or canceled
      if (link.event.deletedAt) {
        throw new GraphQLError('This event has been deleted.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      if (link.event.canceledAt) {
        throw new GraphQLError('This event has been canceled.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      // Check if already a member
      const existing = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: {
            eventId: link.eventId,
            userId: user.id,
          },
        },
      });

      if (existing && existing.status === 'JOINED') {
        // Already joined, just return event
        return mapEvent(link.event as EventWithGraph);
      }

      // Create or update membership
      await prisma.eventMember.upsert({
        where: {
          eventId_userId: {
            eventId: link.eventId,
            userId: user.id,
          },
        },
        create: {
          eventId: link.eventId,
          userId: user.id,
          status: 'JOINED',
          role: 'PARTICIPANT',
          joinedAt: new Date(),
        },
        update: {
          status: 'JOINED',
          role: 'PARTICIPANT',
          joinedAt: new Date(),
        },
      });

      // Record link usage (upsert to handle duplicate attempts)
      await prisma.eventInviteLinkUsage.upsert({
        where: {
          linkId_userId: {
            linkId: link.id,
            userId: user.id,
          },
        },
        create: {
          linkId: link.id,
          userId: user.id,
          usedAt: new Date(),
        },
        update: {
          usedAt: new Date(), // Update timestamp if already exists
        },
      });

      // Increment usedCount
      await prisma.eventInviteLink.update({
        where: { id: link.id },
        data: { usedCount: { increment: 1 } },
      });

      // Update event joinedCount
      await prisma.event.update({
        where: { id: link.eventId },
        data: { joinedCount: { increment: 1 } },
      });

      // Audit log: MEMBER/STATUS_CHANGE (severity 3) - joined via invite link
      await createAuditLog(prisma, {
        eventId: link.eventId,
        actorId: user.id,
        scope: 'MEMBER' as AuditScope,
        action: 'STATUS_CHANGE' as AuditAction,
        entityType: 'EventMember',
        entityId: user.id,
        meta: {
          viaInviteLink: true,
          from: existing?.status || null,
          to: 'JOINED',
        },
        severity: 3,
      });

      return mapEvent(link.event as EventWithGraph);
    }
  );
