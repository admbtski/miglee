import { Prisma, NotificationKind, NotificationEntity } from '@prisma/client';
import { GraphQLError } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapNotification } from '../helpers';

export const NOTIFICATION_INCLUDE = {
  recipient: true,
  actor: true,
  intent: {
    include: {
      categories: true,
      tags: true,
      members: { include: { user: true, addedBy: true } },
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

      if (recipientId !== user.id) {
        // jeśli chcesz dopuścić adminów – dodaj warunek roli
        throw new GraphQLError(
          'Not allowed to send notifications to other users.',
          { extensions: { code: 'FORBIDDEN' } }
        );
      }

      // Jeśli wskazujesz INTENT – ustaw także intentId (ułatwia zapytania)
      const isIntent =
        (entityType ?? NotificationEntity.OTHER) === NotificationEntity.INTENT;
      const safeIntentId =
        isIntent && typeof entityId === 'string' && entityId.length > 0
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
          intentId: safeIntentId, // jeżeli to INTENT — powiąż
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
    async (_p, { id }, { user, pubsub }: MercuriusContext) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        const notif = await prisma.notification.findUnique({ where: { id } });
        if (!notif || notif.recipientId !== user.id) {
          // 404 + brak dostępu bez ujawniania cudzych rekordów
          throw new GraphQLError('Notification not found or access denied.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const wasUnread = notif.readAt == null;

        await prisma.notification.delete({ where: { id } });

        // if (wasUnread) {
        //   await pubsub?.publish({
        //     topic: `NOTIFICATION_BADGE:${user.id}`,
        //     payload: { notificationBadgeChanged: { recipientId: user.id } },
        //   });
        // }

        return true;
      } catch (e: any) {
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
    async (_p, { id }, { user, pubsub }: MercuriusContext) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const notif = await prisma.notification.findUnique({ where: { id } });
      if (!notif || notif.recipientId !== user.id) {
        throw new GraphQLError('Notification not found or access denied.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Idempotencja: jeśli już przeczytana — nic nie zmieniaj, ale zwróć true
      if (notif.readAt) return true;

      try {
        await prisma.notification.update({
          where: { id },
          data: { readAt: new Date() },
        });

        // Realtime: badge
        // await pubsub?.publish({
        //   topic: `NOTIFICATION_BADGE:${user.id}`,
        //   payload: { notificationBadgeChanged: { recipientId: user.id } },
        // });

        return true;
      } catch (e: any) {
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
    async (_p, { recipientId }, { user, pubsub }: MercuriusContext) => {
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
        where: { recipientId: user.id, readAt: null },
        data: { readAt: new Date() },
      });

      // await pubsub?.publish({
      //   topic: `NOTIFICATION_BADGE:${user.id}`,
      //   payload: { notificationBadgeChanged: { recipientId: user.id } },
      // });

      return res.count;
    }
  );
