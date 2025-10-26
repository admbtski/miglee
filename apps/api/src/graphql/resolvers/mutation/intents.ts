import type { Prisma } from '@prisma/client';
import {
  Level as PrismaLevel,
  MeetingKind as PrismaMeetingKind,
  Mode as PrismaMode,
  NotificationKind as PrismaNotificationKind,
  NotificationEntity as PrismaNotificationEntity,
  Visibility as PrismaVisibility,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  Intent as GQLIntent,
  MutationResolvers,
} from '../../__generated__/resolvers-types';
import { mapIntent, mapNotification, pickLocation } from '../helpers';

export const NOTIFICATION_INCLUDE = {
  recipient: true,
  actor: true,
  intent: {
    include: {
      categories: true,
      tags: true,
      members: { include: { user: true, addedBy: true } },
      canceledBy: true, // NEW
    },
  },
} satisfies Prisma.NotificationInclude;

const INTENT_INCLUDE = {
  categories: true,
  tags: true,
  members: {
    include: {
      user: true,
      addedBy: true,
    },
  },
  canceledBy: true, // NEW
} satisfies Prisma.IntentInclude;

function assertCreateInput(input: any) {
  // 1) Kategorie 1..3
  if (
    !input.categorySlugs ||
    input.categorySlugs.length < 1 ||
    input.categorySlugs.length > 3
  ) {
    throw new GraphQLError('You must select between 1 and 3 categories.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'categorySlugs' },
    });
  }
  // 2) Mode ↔ min/max
  if (input.mode === PrismaMode.ONE_TO_ONE) {
    if (input.min !== 2 || input.max !== 2) {
      throw new GraphQLError('For ONE_TO_ONE, min and max must both equal 2.', {
        extensions: { code: 'BAD_USER_INPUT', field: 'min/max' },
      });
    }
  } else if (
    typeof input.min === 'number' &&
    typeof input.max === 'number' &&
    input.min > input.max
  ) {
    throw new GraphQLError('`min` cannot be greater than `max`.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'min/max' },
    });
  }
  // 3) MeetingKind ↔ onlineUrl
  if (
    (input.meetingKind === PrismaMeetingKind.ONLINE ||
      input.meetingKind === PrismaMeetingKind.HYBRID) &&
    !input.onlineUrl
  ) {
    throw new GraphQLError(
      '`onlineUrl` is required for ONLINE or HYBRID meetings.',
      {
        extensions: { code: 'BAD_USER_INPUT', field: 'onlineUrl' },
      }
    );
  }
}

function assertUpdateInput(input: any) {
  if (input.title === null) {
    throw new GraphQLError('`title` cannot be null.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'title' },
    });
  }
  if (input.min === null) {
    throw new GraphQLError('`min` cannot be null.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'min' },
    });
  }
  if (input.max === null) {
    throw new GraphQLError('`max` cannot be null.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'max' },
    });
  }
  // cross-field
  if (
    typeof input.min === 'number' &&
    typeof input.max === 'number' &&
    input.min > input.max
  ) {
    throw new GraphQLError('`min` cannot be greater than `max`.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'min/max' },
    });
  }
  if (input.mode === PrismaMode.ONE_TO_ONE) {
    // jeśli ktoś zmienia tryb na 1:1, wymuś min=max=2 (o ile podał inne)
    if (
      (typeof input.min === 'number' && input.min !== 2) ||
      (typeof input.max === 'number' && input.max !== 2)
    ) {
      throw new GraphQLError('For ONE_TO_ONE, min and max must both equal 2.', {
        extensions: { code: 'BAD_USER_INPUT', field: 'min/max' },
      });
    }
  }
  // MeetingKind ↔ onlineUrl
  if (
    (input.meetingKind === PrismaMeetingKind.ONLINE ||
      input.meetingKind === PrismaMeetingKind.HYBRID) &&
    input.onlineUrl === null
  ) {
    throw new GraphQLError('`onlineUrl` cannot be null for ONLINE/HYBRID.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'onlineUrl' },
    });
  }
}

/**
 * Mutation: Create Intent
 */
export const createIntentMutation: MutationResolvers['createIntent'] =
  resolverWithMetrics(
    'Mutation',
    'createIntent',
    async (_p, { input }, { user, pubsub }): Promise<GQLIntent> => {
      assertCreateInput(input);

      const ownerId = user?.id;
      if (!ownerId) {
        throw new GraphQLError(
          'ownerId is required or an authenticated user must be present.',
          {
            extensions: { code: 'UNAUTHENTICATED' },
          }
        );
      }

      // Lokalizacja (opcjonalna, dopuszcza placeId)
      const loc = pickLocation(input.location) ?? {};

      const categoriesData: Prisma.CategoryCreateNestedManyWithoutIntentsInput =
        {
          connect: input.categorySlugs.map((slug: string) => ({ slug })),
        };
      const tagsData:
        | Prisma.TagCreateNestedManyWithoutIntentsInput
        | undefined = input.tagSlugs?.length
        ? { connect: input.tagSlugs.map((slug: string) => ({ slug })) }
        : undefined;

      const full = await prisma.$transaction(async (tx) => {
        const intent = await tx.intent.create({
          data: {
            title: input.title,
            description: input.description ?? null,
            notes: input.notes ?? null,

            visibility: input.visibility as PrismaVisibility,
            mode: input.mode as PrismaMode,
            min: input.min,
            max: input.max,

            startAt: input.startAt as Date,
            endAt: input.endAt as Date,
            allowJoinLate: input.allowJoinLate,

            meetingKind: input.meetingKind as PrismaMeetingKind,
            onlineUrl: input.onlineUrl ?? null,

            levels: (input.levels ?? []) as PrismaLevel[],

            ...loc,
            categories: categoriesData,
            ...(tagsData ? { tags: tagsData } : {}),
          },
        });

        // OWNER (JOINED)
        await tx.intentMember.create({
          data: {
            intentId: intent.id,
            userId: ownerId,
            role: 'OWNER',
            status: 'JOINED',
            joinedAt: new Date(),
          },
        });

        // Notyfikacja do ownera
        const notif = await tx.notification.create({
          data: {
            kind: PrismaNotificationKind.INTENT_CREATED,
            title: 'Intent created',
            body: `Your intent "${intent.title}" has been successfully created.`,
            entityType: PrismaNotificationEntity.INTENT,
            entityId: intent.id,
            intentId: intent.id,
            recipientId: ownerId,
            actorId: ownerId,
            data: {
              intentId: intent.id,
              title: intent.title,
              startAt: intent.startAt,
            } as Prisma.InputJsonValue,
            dedupeKey: `intent_created:${ownerId}:${intent.id}`,
          },
          include: NOTIFICATION_INCLUDE,
        });

        // PubSub
        await pubsub.publish({
          topic: `NOTIFICATION_ADDED:${notif.recipientId}`,
          payload: { notificationAdded: mapNotification(notif as any) },
        });

        // Odczyt pełnego grafu
        const fullIntent = await tx.intent.findUniqueOrThrow({
          where: { id: intent.id },
          include: INTENT_INCLUDE,
        });

        return fullIntent;
      });

      return mapIntent(full as any);
    }
  );

/**
 * Mutation: Update Intent
 */
export const updateIntentMutation: MutationResolvers['updateIntent'] =
  resolverWithMetrics(
    'Mutation',
    'updateIntent',
    async (_p, { id, input }): Promise<GQLIntent> => {
      assertUpdateInput(input);

      // Partial location update
      const loc = input.location
        ? {
            ...(Object.prototype.hasOwnProperty.call(input.location, 'lat')
              ? { lat: input.location.lat }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(input.location, 'lng')
              ? { lng: input.location.lng }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(input.location, 'address')
              ? { address: input.location.address }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(input.location, 'placeId')
              ? { placeId: input.location.placeId }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(input.location, 'radiusKm')
              ? { radiusKm: input.location.radiusKm }
              : {}),
          }
        : {};

      // M:N replace semantics
      const categoriesUpdate:
        | Prisma.CategoryUpdateManyWithoutIntentsNestedInput
        | undefined =
        input.categorySlugs != null
          ? { set: input.categorySlugs.map((cid) => ({ id: cid })) }
          : undefined;

      const tagsUpdate:
        | Prisma.TagUpdateManyWithoutIntentsNestedInput
        | undefined =
        input.tagSlugs != null
          ? { set: input.tagSlugs.map((slug) => ({ slug: slug })) }
          : undefined;

      const data: Prisma.IntentUpdateInput = {
        ...(typeof input.title === 'string' ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),

        ...(input.visibility !== undefined
          ? { visibility: input.visibility as PrismaVisibility }
          : {}),
        ...(input.mode !== undefined ? { mode: input.mode as PrismaMode } : {}),
        ...(typeof input.min === 'number' ? { min: input.min } : {}),
        ...(typeof input.max === 'number' ? { max: input.max } : {}),

        ...(input.startAt !== undefined
          ? { startAt: input.startAt as Date }
          : {}),
        ...(input.endAt !== undefined ? { endAt: input.endAt as Date } : {}),
        ...(typeof input.allowJoinLate === 'boolean'
          ? { allowJoinLate: input.allowJoinLate }
          : {}),

        ...(input.meetingKind !== undefined
          ? { meetingKind: input.meetingKind as PrismaMeetingKind }
          : {}),
        ...(input.onlineUrl !== undefined
          ? { onlineUrl: input.onlineUrl }
          : {}),
        ...(input.levels !== undefined
          ? { levels: input.levels as PrismaLevel[] }
          : {}),

        ...(Object.prototype.hasOwnProperty.call(loc, 'lat')
          ? { lat: (loc as any).lat }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'lng')
          ? { lng: (loc as any).lng }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'address')
          ? { address: (loc as any).address }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'placeId')
          ? { placeId: (loc as any).placeId }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'radiusKm')
          ? { radiusKm: (loc as any).radiusKm }
          : {}),

        ...(categoriesUpdate ? { categories: categoriesUpdate } : {}),
        ...(tagsUpdate ? { tags: tagsUpdate } : {}),
      };

      const updated = await prisma.intent.update({
        where: { id },
        data,
        include: INTENT_INCLUDE,
      });

      // Dodatkowa walidacja po zmianie: ONE_TO_ONE -> min/max = 2
      if (
        updated.mode === 'ONE_TO_ONE' &&
        !(updated.min === 2 && updated.max === 2)
      ) {
        throw new GraphQLError('ONE_TO_ONE intents must have min = max = 2.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      return mapIntent(updated as any);
    }
  );

/**
 * Mutation: Cancel Intent (NEW)
 * - Oznacza intent jako anulowany i wysyła powiadomienia do członków
 * - Domyślnie idempotentne (ponowne wywołanie zwraca aktualny stan)
 */
export const cancelIntentMutation: MutationResolvers['cancelIntent'] =
  resolverWithMetrics(
    'Mutation',
    'cancelIntent',
    async (_p, { id, reason }, { user, pubsub }) => {
      const actorId = user?.id;
      if (!actorId) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const intent = await prisma.intent.findUnique({
        where: { id },
        include: {
          members: { select: { userId: true, status: true } },
        },
      });
      if (!intent) {
        throw new GraphQLError('Intent not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const membership = await prisma.intentMember.findFirst({
        where: {
          intentId: id,
          userId: actorId,
          role: { in: ['OWNER', 'MODERATOR'] },
        },
        select: { id: true },
      });
      if (!membership) {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (intent.canceledAt) {
        const full = await prisma.intent.findUniqueOrThrow({
          where: { id },
          include: INTENT_INCLUDE,
        });
        return mapIntent(full);
      }

      const recipients = intent.members
        .filter((m) => ['JOINED', 'PENDING', 'INVITED'].includes(m.status))
        .map((m) => m.userId);

      const full = await prisma.$transaction(async (tx) => {
        const updated = await tx.intent.update({
          where: { id },
          data: {
            canceledAt: new Date(),
            canceledById: actorId,
            cancelReason: reason ?? null,
          },
          include: INTENT_INCLUDE,
        });

        if (recipients.length > 0) {
          const created = await tx.notification.createMany({
            data: recipients.map((recipientId) => ({
              kind: PrismaNotificationKind.INTENT_CANCELED,
              recipientId,
              actorId,
              entityType: PrismaNotificationEntity.INTENT,
              entityId: id,
              intentId: id,
              title: 'Meeting canceled',
              body:
                reason && reason.trim().length > 0
                  ? `Organizer’s note: ${reason}`
                  : null,
              createdAt: new Date(),
              dedupeKey: `intent_canceled:${recipientId}:${id}`,
            })),
          });

          if (created.count > 0) {
            await Promise.all(
              recipients.map((recipientId) =>
                pubsub?.publish({
                  topic: `NOTIFICATION_BADGE:${recipientId}`,
                  payload: { notificationBadgeChanged: { recipientId } },
                })
              )
            );
          }
        }

        return updated;
      });

      return mapIntent(full);
    }
  );

/**
 * Mutation: Delete Intent
 */
export const deleteIntentMutation: MutationResolvers['deleteIntent'] =
  resolverWithMetrics('Mutation', 'deleteIntent', async (_p, { id }) => {
    try {
      await prisma.intent.delete({ where: { id } });
      return true;
    } catch (e: any) {
      throw e;
    }
  });
