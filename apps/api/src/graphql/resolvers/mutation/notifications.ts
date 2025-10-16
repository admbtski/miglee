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
    },
  },
} satisfies Prisma.NotificationInclude;

/**
 * addNotification(recipientId, kind, title, body, data, entityType, entityId)
 * - Wymaga zalogowanego użytkownika.
 * - Domyślnie pozwala wysłać TYLKO do siebie (recipientId === user.id).
 *   Jeśli chcesz dopuścić adminów do wysyłania innym – dodaj check roli (user.role === 'ADMIN').
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

      // Prosty model uprawnień: tylko do siebie
      if (recipientId !== user.id) {
        // Jeśli chcesz dopuścić adminów, odkomentuj i sprawdź role:
        // if (user.role !== 'ADMIN') {
        throw new GraphQLError(
          'Not allowed to send notifications to other users.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
        // }
      }

      const created = await prisma.notification.create({
        data: {
          kind: kind ?? NotificationKind.SYSTEM,
          title: title ?? null,
          body: body ?? null,
          data: data ?? Prisma.JsonNull,
          entityType: entityType ?? NotificationEntity.OTHER,
          entityId: entityId ?? null,
          recipientId,
          actorId: user.id, // kto wysłał
          // intentId: dodaj tylko gdy entityType=INTENT i masz id – tutaj pomijamy
        },
        include: NOTIFICATION_INCLUDE,
      });

      await pubsub?.publish({
        topic: `NOTIFICATION_ADDED:${created.recipientId}`,
        payload: { notificationAdded: mapNotification(created) },
      });

      return mapNotification(created);
    }
  );

/**
 * deleteNotification(id)
 * - Tylko właściciel (recipient) może usunąć.
 * - Zwraca true/false; false dla braku rekordu (idempotent).
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
        if (!notif || notif.recipientId !== user.id) {
          // 404 + brak dostępu, ale bez ujawniania istnienia cudzego zasobu
          throw new GraphQLError('Notification not found or access denied.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        await prisma.notification.delete({ where: { id } });
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
      if (!notif || notif.recipientId !== user.id) {
        throw new GraphQLError('Notification not found or access denied.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Idempotencja: jeśli już przeczytana, zwróć true bez update
      if (notif.readAt) return true;

      try {
        await prisma.notification.update({
          where: { id },
          data: { readAt: new Date() },
        });
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
 * - Zgodnie z Twoimi operacjami GQL przyjmuje recipientId, ale dla bezpieczeństwa
 *   wymuszamy zgodność z aktualnie zalogowanym użytkownikiem.
 * - Zwraca liczbę zaktualizowanych rekordów.
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

      return res.count;
    }
  );
