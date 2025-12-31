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

/**
 * addNotification(recipientId, kind, title, body, data, entityType, entityId)
 * - Wymaga zalogowanego usera.
 * - Domyślnie pozwalamy wysyłać TYLKO do siebie (recipientId === user.id).
 * - Publikuje:
 *    - NOTIFICATION_ADDED:<recipientId> (z pełnym payloadem)
 *    - NOTIFICATION_BADGE:<recipientId> (dla odświeżenia badge’a)
 */
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

      // Jeśli wskazujesz EVENT – ustaw także eventId (ułatwia zapytania)
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
          eventId: safeEventId, // jeżeli to EVENT — powiąż
          // dedupeKey opcjonalny — jeśli chcesz, rozszerz schema/mutation o pole dedupeKey
        },
        include: NOTIFICATION_INCLUDE,
      });

      // Realtime: lista
      await pubsub?.publish({
        topic: `NOTIFICATION_ADDED:${created.recipientId}`,
        payload: { notificationAdded: mapNotification(created) },
      });

      // Realtime: badge (nowy wpis jest nieprzeczytany)
      await pubsub?.publish({
        topic: `NOTIFICATION_BADGE:${created.recipientId}`,
        payload: {
          notificationBadgeChanged: { recipientId: created.recipientId },
        },
      });

      return mapNotification(created);
    }
  );

/**
 * deleteNotification(id)
 * - Tylko właściciel (recipient).
 * - Zwraca true/false; false dla braku rekordu (idempotent).
 * - Jeżeli rekord był NIEPRZECZYTANY → publikuje NOTIFICATION_BADGE dla przeliczenia licznika.
 */
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
        const notif = await prisma.notification.findUnique({ where: { id } });
        // SELF or ADMIN_ONLY
        const isOwner = notif && notif.recipientId === user.id;
        const isAdmin = user.role === Role.Admin;
        if (!notif || (!isOwner && !isAdmin)) {
          // 404 + brak dostępu bez ujawniania cudzych rekordów
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

/**
 * markNotificationRead(id)
 * - Oznacza pojedynczą notyfikację jako przeczytaną (readAt = now).
 * - Tylko właściciel (recipient).
 * - Publikuje NOTIFICATION_BADGE (licznik mógł się zmienić).
 */
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

      const notif = await prisma.notification.findUnique({ where: { id } });
      // SELF or ADMIN_ONLY
      const isOwner = notif && notif.recipientId === user.id;
      const isAdmin = user.role === Role.Admin;
      if (!notif || (!isOwner && !isAdmin)) {
        throw new GraphQLError('Notification not found or access denied.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Idempotent: if already read, don't change anything but return true
      if (notif.readAt) return true;

      try {
        await prisma.notification.update({
          where: { id },
          data: { readAt: new Date() },
        });

        return true;
      } catch (e: unknown) {
        // Gdyby rekord zniknął pomiędzy find a update
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

/**
 * markAllNotificationsRead(recipientId)
 * - Wymusza recipientId === zalogowany user.
 * - Zwraca liczbę zaktualizowanych rekordów.
 * - Publikuje NOTIFICATION_BADGE (na pewno licznik się zmienił lub powinien zostać odświeżony).
 */
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
      // SELF or ADMIN_ONLY
      const isAdmin = user.role === Role.Admin;
      if (recipientId !== user.id && !isAdmin) {
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

      return res.count;
    }
  );
