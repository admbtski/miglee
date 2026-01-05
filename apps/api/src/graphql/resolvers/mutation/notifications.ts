import {
  Prisma,
  NotificationKind,
  NotificationEntity,
} from '../../../prisma-client/client';
import { GraphQLError } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import {
  Role,
  type MutationResolvers,
} from '../../__generated__/resolvers-types';
import { mapNotification } from '../helpers';
import {
  trackNotificationCreated,
  trackNotificationRead,
  type NotificationType,
} from '../../../lib/observability';

/**
 * Standard notification include with related entities.
 * Exported for use by other mutation resolvers.
 */
export const NOTIFICATION_INCLUDE = {
  recipient: true,
  actor: true,
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
} satisfies Prisma.NotificationInclude;

export const addNotificationMutation: MutationResolvers['addNotification'] =
  resolverWithMetrics(
    'Mutation',
    'addNotification',
    async (
      _p,
      { recipientId, kind, title, body, data, entityType, entityId },
      { pubsub, user }: MercuriusContext
    ) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      if (user.role === Role.User) {
        throw new GraphQLError(
          'Not allowed to send notifications to other users.',
          { extensions: { code: 'FORBIDDEN' } }
        );
      }

      const isEvent =
        (entityType ?? NotificationEntity.OTHER) === NotificationEntity.EVENT;
      const safeEventId =
        isEvent && typeof entityId === 'string' && entityId.length > 0
          ? entityId
          : null;

      const created = await prisma.notification.create({
        data: {
          kind: kind ?? NotificationKind.SYSTEM,
          title: title ?? null,
          body: body ?? null,
          data: (data as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          entityType: entityType ?? NotificationEntity.OTHER,
          entityId: entityId ?? null,
          recipientId,
          actorId: user.id,
          eventId: safeEventId,
        },
        include: NOTIFICATION_INCLUDE,
      });

      await pubsub?.publish({
        topic: `NOTIFICATION_ADDED:${created.recipientId}`,
        payload: { notificationAdded: mapNotification(created) },
      });

      await pubsub?.publish({
        topic: `NOTIFICATION_BADGE:${created.recipientId}`,
        payload: {
          notificationBadgeChanged: { recipientId: created.recipientId },
        },
      });

      // Track notification creation
      trackNotificationCreated({
        notificationId: created.id,
        recipientId: created.recipientId,
        type: (kind?.toLowerCase() || 'system') as NotificationType,
        entityType: entityType || undefined,
        entityId: entityId || undefined,
      });

      return mapNotification(created);
    }
  );

export const deleteNotificationMutation: MutationResolvers['deleteNotification'] =
  resolverWithMetrics(
    'Mutation',
    'deleteNotification',
    async (_p, { id }, { user }: MercuriusContext) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        const notification = await prisma.notification.findUnique({
          where: { id },
        });

        const isOwner = notification && notification.recipientId === user.id;
        if (!notification || !isOwner) {
          throw new GraphQLError('Notification not found or access denied.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        await prisma.notification.delete({ where: { id } });

        return true;
      } catch (e: unknown) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2025'
        ) {
          return false;
        }
        throw e;
      }
    }
  );

export const markNotificationReadMutation: MutationResolvers['markNotificationRead'] =
  resolverWithMetrics(
    'Mutation',
    'markNotificationRead',
    async (_p, { id }, { user }: MercuriusContext) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      const isOwner = notification && notification.recipientId === user.id;
      if (!notification || !isOwner) {
        throw new GraphQLError('Notification not found or access denied.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Idempotent: if already read, don't change anything but return true
      if (notification.readAt) return true;

      try {
        await prisma.notification.update({
          where: { id },
          data: { readAt: new Date() },
        });

        // Track notification read
        trackNotificationRead({
          userId: user.id,
          notificationIds: [id],
          markAll: false,
          count: 1,
        });

        return true;
      } catch (e: unknown) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2025'
        ) {
          return false;
        }
        throw e;
      }
    }
  );

export const markAllNotificationsReadMutation: MutationResolvers['markAllNotificationsRead'] =
  resolverWithMetrics(
    'Mutation',
    'markAllNotificationsRead',
    async (_p, { recipientId }, { user }: MercuriusContext) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      if (recipientId !== user.id) {
        throw new GraphQLError(
          'Cannot mark notifications read for another user.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      const res = await prisma.notification.updateMany({
        where: { recipientId, readAt: null },
        data: { readAt: new Date() },
      });

      // Track notifications marked as read
      trackNotificationRead({
        userId: user.id,
        markAll: true,
        count: res.count,
      });

      return res.count;
    }
  );
