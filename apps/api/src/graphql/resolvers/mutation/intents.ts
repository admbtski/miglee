import type {
  AddressVisibility,
  MembersVisibility,
  Prisma,
} from '@prisma/client';
import {
  Level as PrismaLevel,
  MeetingKind as PrismaMeetingKind,
  Mode as PrismaMode,
  NotificationEntity as PrismaNotificationEntity,
  NotificationKind as PrismaNotificationKind,
  Visibility as PrismaVisibility,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import {
  clearReminders,
  enqueueReminders,
  rescheduleReminders,
} from '../../../workers/reminders/queue';
import type {
  CreateIntentInput,
  Intent as GQLIntent,
  MutationResolvers,
} from '../../__generated__/resolvers-types';
import { mapIntent, mapNotification, pickLocation } from '../helpers';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const NOTIFICATION_INCLUDE = {
  recipient: true,
  actor: true,
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
} satisfies Prisma.NotificationInclude;

const INTENT_INCLUDE = {
  categories: true,
  tags: true,
  members: { include: { user: true, addedBy: true } },
  owner: true,
  canceledBy: true,
  deletedBy: true,
} satisfies Prisma.IntentInclude;

function assertCreateInput(input: CreateIntentInput) {
  if (
    !input.categorySlugs ||
    input.categorySlugs.length < 1 ||
    input.categorySlugs.length > 3
  ) {
    throw new GraphQLError('You must select between 1 and 3 categories.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'categorySlugs' },
    });
  }
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

  const hasCoords = !!(
    input?.location &&
    (input.location.lat != null || input.location.lng != null)
  );
  const hasUrl =
    typeof input?.onlineUrl === 'string' && input.onlineUrl.length > 0;

  if (input.meetingKind === PrismaMeetingKind.ONLINE && !hasUrl) {
    throw new GraphQLError('`onlineUrl` is required for ONLINE meetings.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'onlineUrl' },
    });
  }
  if (input.meetingKind === PrismaMeetingKind.ONSITE && !hasCoords) {
    throw new GraphQLError(
      'Location (lat/lng) is required for ONSITE meetings.',
      {
        extensions: { code: 'BAD_USER_INPUT', field: 'location' },
      }
    );
  }
  if (
    input.meetingKind === PrismaMeetingKind.HYBRID &&
    !(hasUrl || hasCoords)
  ) {
    throw new GraphQLError(
      'HYBRID requires either location (lat/lng) or `onlineUrl`.',
      {
        extensions: { code: 'BAD_USER_INPUT', field: 'meetingKind' },
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
    if (
      (typeof input.min === 'number' && input.min !== 2) ||
      (typeof input.max === 'number' && input.max !== 2)
    ) {
      throw new GraphQLError('For ONE_TO_ONE, min and max must both equal 2.', {
        extensions: { code: 'BAD_USER_INPUT', field: 'min/max' },
      });
    }
  }
  if (
    input.meetingKind === PrismaMeetingKind.ONLINE &&
    input.onlineUrl === null
  ) {
    throw new GraphQLError('`onlineUrl` cannot be null for ONLINE.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'onlineUrl' },
    });
  }
  if (input.meetingKind === PrismaMeetingKind.HYBRID) {
    const hasCoords =
      input?.location &&
      ['lat', 'lng'].some((k) =>
        Object.prototype.hasOwnProperty.call(input.location, k)
      );
    const onlineUrlProvided = Object.prototype.hasOwnProperty.call(
      input,
      'onlineUrl'
    );
    const hasAny =
      (onlineUrlProvided &&
        typeof input.onlineUrl === 'string' &&
        input.onlineUrl.length > 0) ||
      hasCoords;
    if (!hasAny) {
      throw new GraphQLError(
        'HYBRID requires either location (lat/lng) or `onlineUrl`.',
        {
          extensions: { code: 'BAD_USER_INPUT', field: 'meetingKind' },
        }
      );
    }
  }
}

function assertNotReadOnly(intent: {
  canceledAt: Date | null;
  deletedAt: Date | null;
}) {
  if (intent.deletedAt) {
    throw new GraphQLError('Intent is deleted.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }
  if (intent.canceledAt) {
    throw new GraphQLError('Intent is canceled and read-only.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }
}

/** Create Intent */
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

            visibility: input.visibility,
            joinMode: (input as any).joinMode ?? 'OPEN',
            mode: input.mode as PrismaMode,
            min: input.min,
            max: input.max,

            startAt: input.startAt as Date,
            endAt: input.endAt as Date,
            allowJoinLate: input.allowJoinLate,

            meetingKind: input.meetingKind as PrismaMeetingKind,
            onlineUrl: input.onlineUrl ?? null,

            levels: (input.levels ?? []) as PrismaLevel[],

            addressVisibility: input.addressVisibility,
            membersVisibility: input.membersVisibility,

            ownerId: ownerId,

            ...loc,
            categories: categoriesData,
            ...(tagsData ? { tags: tagsData } : {}),
          },
        });

        await tx.intentMember.create({
          data: {
            intentId: intent.id,
            userId: ownerId,
            role: 'OWNER',
            status: 'JOINED',
            joinedAt: new Date(),
          },
        });

        const notification = await tx.notification.create({
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

        await pubsub?.publish({
          topic: `NOTIFICATION_ADDED:${notification.recipientId}`,
          payload: { notificationAdded: mapNotification(notification) },
        });

        // Zaplanuj przypomnienia (24h..15m)
        await enqueueReminders(intent.id, intent.startAt);

        const fullIntent = await tx.intent.findUniqueOrThrow({
          where: { id: intent.id },
          include: INTENT_INCLUDE,
        });

        return fullIntent;
      });

      return mapIntent(full, user.id);
    }
  );

/** Update Intent (publikacja INTENT_UPDATED) */
export const updateIntentMutation: MutationResolvers['updateIntent'] =
  resolverWithMetrics(
    'Mutation',
    'updateIntent',
    async (_p, { id, input }, { user, pubsub }): Promise<GQLIntent> => {
      assertUpdateInput(input);

      console.dir({ input });

      const current = await prisma.intent.findUnique({
        where: { id },
        select: { canceledAt: true, deletedAt: true, startAt: true },
      });
      if (!current) {
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      assertNotReadOnly(current);

      // Wyciągnij listę odbiorców (JOINED/PENDING/INVITED) przed update
      const members = await prisma.intentMember.findMany({
        where: {
          intentId: id,
          status: { in: ['JOINED', 'PENDING', 'INVITED'] },
        },
        select: { userId: true },
      });
      const recipients = members.map((m) => m.userId);

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

      const categoriesUpdate:
        | Prisma.CategoryUpdateManyWithoutIntentsNestedInput
        | undefined =
        input.categorySlugs != null
          ? { set: input.categorySlugs.map((slug: string) => ({ slug })) }
          : undefined;

      const tagsUpdate:
        | Prisma.TagUpdateManyWithoutIntentsNestedInput
        | undefined =
        input.tagSlugs != null
          ? { set: input.tagSlugs.map((slug) => ({ slug })) }
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
        ...(input.addressVisibility !== undefined
          ? { addressVisibility: input.addressVisibility as AddressVisibility }
          : {}),
        ...(input.membersVisibility !== undefined
          ? { membersVisibility: input.membersVisibility as MembersVisibility }
          : {}),
        ...(input.joinMode !== undefined
          ? { joinMode: (input as any).joinMode }
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
          ? { lat: loc.lat }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'lng')
          ? { lng: loc.lng }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'address')
          ? { address: loc.address }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'placeId')
          ? { placeId: loc.placeId }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'radiusKm')
          ? { radiusKm: loc.radiusKm }
          : {}),

        ...(categoriesUpdate ? { categories: categoriesUpdate } : {}),
        ...(tagsUpdate ? { tags: tagsUpdate } : {}),
      };

      console.dir({ data });
      const updated = await prisma.intent.update({
        where: { id },
        data,
        include: INTENT_INCLUDE,
      });

      console.dir({ updated });
      if (
        updated.mode === 'ONE_TO_ONE' &&
        !(updated.min === 2 && updated.max === 2)
      ) {
        throw new GraphQLError('ONE_TO_ONE intents must have min = max = 2.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      // Reschedule reminders jeśli zmienił się startAt
      if (
        typeof input.startAt !== 'undefined' &&
        current.startAt &&
        new Date(input.startAt as Date).getTime() !==
          new Date(current.startAt).getTime()
      ) {
        await rescheduleReminders(updated.id, updated.startAt);
      }

      // ===== NEW: publikacja INTENT_UPDATED =====
      if (recipients.length > 0) {
        // dedupe po dacie update – żeby przy wielokrotnych update’ach nie spamować
        const dedupeStamp = updated.updatedAt.toISOString();

        await prisma.notification.createMany({
          data: recipients.map((recipientId) => ({
            kind: PrismaNotificationKind.INTENT_UPDATED,
            recipientId,
            actorId: user?.id ?? null,
            entityType: PrismaNotificationEntity.INTENT,
            entityId: id,
            intentId: id,
            title: 'Meeting updated',
            body: 'Organizer updated meeting details.',
            createdAt: new Date(),
            dedupeKey: `intent_updated:${recipientId}:${id}:${dedupeStamp}`,
          })),
          skipDuplicates: true,
        });

        // Push realtime: list + badge
        await Promise.all(
          recipients.map(async (recipientId) => {
            const n = await prisma.notification.findFirst({
              where: {
                recipientId,
                intentId: id,
                kind: PrismaNotificationKind.INTENT_UPDATED,
                dedupeKey: `intent_updated:${recipientId}:${id}:${dedupeStamp}`,
              },
              orderBy: { createdAt: 'desc' },
              include: NOTIFICATION_INCLUDE,
            });
            if (n) {
              await pubsub?.publish({
                topic: `NOTIFICATION_ADDED:${recipientId}`,
                payload: { notificationAdded: mapNotification(n) },
              });
            }
            await pubsub?.publish({
              topic: `NOTIFICATION_BADGE:${recipientId}`,
              payload: { notificationBadgeChanged: { recipientId } },
            });
          })
        );
      }
      // =========================================

      return mapIntent(updated, user?.id);
    }
  );

/** Cancel Intent – jak było (sprzątanie reminders + publikacje) */
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
        include: { members: { select: { userId: true, status: true } } },
      });
      if (!intent) {
        throw new GraphQLError('Intent not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      if (intent.deletedAt) {
        throw new GraphQLError('Intent is deleted.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      if (intent.canceledAt) {
        const full = await prisma.intent.findUniqueOrThrow({
          where: { id },
          include: INTENT_INCLUDE,
        });
        return mapIntent(full, user.id);
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

        try {
          await clearReminders(id);
        } catch {}

        if (recipients.length > 0) {
          await tx.notification.createMany({
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
            skipDuplicates: true,
          });

          await Promise.all(
            recipients.map(async (recipientId) => {
              const notification = await prisma.notification.findFirst({
                where: {
                  recipientId,
                  intentId: id,
                  kind: PrismaNotificationKind.INTENT_CANCELED,
                },
                orderBy: { createdAt: 'desc' },
                include: NOTIFICATION_INCLUDE,
              });
              if (notification) {
                await pubsub?.publish({
                  topic: `NOTIFICATION_ADDED:${recipientId}`,
                  payload: { notificationAdded: mapNotification(notification) },
                });
                await pubsub?.publish({
                  topic: `NOTIFICATION_BADGE:${recipientId}`,
                  payload: { notificationBadgeChanged: { recipientId } },
                });
              }
            })
          );
        }

        return updated;
      });

      return mapIntent(full, user.id);
    }
  );

/** Delete Intent (SOFT) — teraz z publikacją INTENT_UPDATED: "Meeting deleted" */
export const deleteIntentMutation: MutationResolvers['deleteIntent'] =
  resolverWithMetrics(
    'Mutation',
    'deleteIntent',
    async (_p, { id }, { user, pubsub }) => {
      const actorId = user?.id ?? null;

      const row = await prisma.intent.findUnique({
        where: { id },
        select: { canceledAt: true, deletedAt: true },
      });
      if (!row)
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      if (row.deletedAt) return true;
      if (!row.canceledAt) {
        throw new GraphQLError('Intent must be canceled before deletion.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }
      const age = Date.now() - new Date(row.canceledAt).getTime();
      if (age < THIRTY_DAYS_MS) {
        throw new GraphQLError(
          'Intent can be deleted 30 days after cancellation.',
          {
            extensions: { code: 'FAILED_PRECONDITION' },
          }
        );
      }

      // pobierz odbiorców
      const members = await prisma.intentMember.findMany({
        where: {
          intentId: id,
          status: { in: ['JOINED', 'PENDING', 'INVITED'] },
        },
        select: { userId: true },
      });
      const recipients = members.map((m) => m.userId);

      await prisma.intent.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: actorId,
          deleteReason: null,
        },
      });

      if (recipients.length > 0) {
        const dedupe = `intent_deleted:${Date.now()}`; // wystarczy na jednorazowe zdarzenie

        await prisma.notification.createMany({
          data: recipients.map((recipientId) => ({
            kind: PrismaNotificationKind.INTENT_DELETED,
            recipientId,
            actorId,
            entityType: PrismaNotificationEntity.INTENT,
            entityId: id,
            intentId: id,
            title: 'Meeting deleted',
            body: null,
            createdAt: new Date(),
            dedupeKey: `${dedupe}:${recipientId}:${id}`,
          })),
          skipDuplicates: true,
        });

        await Promise.all(
          recipients.map(async (recipientId) => {
            const n = await prisma.notification.findFirst({
              where: {
                recipientId,
                intentId: id,
                kind: PrismaNotificationKind.INTENT_DELETED,
                dedupeKey: `${dedupe}:${recipientId}:${id}`,
              },
              orderBy: { createdAt: 'desc' },
              include: NOTIFICATION_INCLUDE,
            });
            if (n) {
              await pubsub?.publish({
                topic: `NOTIFICATION_ADDED:${recipientId}`,
                payload: { notificationAdded: mapNotification(n) },
              });
            }
            await pubsub?.publish({
              topic: `NOTIFICATION_BADGE:${recipientId}`,
              payload: { notificationBadgeChanged: { recipientId } },
            });
          })
        );
      }

      return true;
    }
  );
