import type { Prisma } from '@prisma/client';
import {
  Level as PrismaLevel,
  MeetingKind as PrismaMeetingKind,
  Mode as PrismaMode,
  NotificationKind as PrismaNotificationKind,
  Visibility as PrismaVisibility,
} from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  Intent as GQLIntent,
  MutationResolvers,
} from '../../__generated__/resolvers-types';
import { mapIntent, mapNotification, pickLocation } from '../helpers';

export const createIntentMutation: MutationResolvers['createIntent'] =
  resolverWithMetrics(
    'Mutation',
    'createIntent',
    async (_p, { input }, { user, pubsub }): Promise<GQLIntent> => {
      // 1..3 categories
      if (
        !input.categoryIds ||
        input.categoryIds.length < 1 ||
        input.categoryIds.length > 3
      ) {
        throw new Error('Select between 1 and 3 categories (categoryIds).');
      }

      const loc = pickLocation(input.location);
      const authorId: string | undefined =
        input.authorId ?? user?.id ?? undefined;

      const categoriesData: Prisma.CategoryCreateNestedManyWithoutIntentsInput =
        {
          connect: input.categoryIds.map((id) => ({
            id,
          })),
        };

      const tagsData:
        | Prisma.TagCreateNestedManyWithoutIntentsInput
        | undefined =
        input.tagIds && input.tagIds.length
          ? {
              connect: input.tagIds.map((id) => ({ id })),
            }
          : undefined;

      const data: Prisma.IntentCreateInput = {
        title: input.title,
        description: input.description,
        notes: input.notes,

        visibility: input.visibility,
        mode: input.mode,
        min: input.min,
        max: input.max,

        startAt: input.startAt as Date,
        endAt: input.endAt as Date,
        allowJoinLate: input.allowJoinLate,

        meetingKind: input.meetingKind,
        onlineUrl: input.onlineUrl,

        levels: input.levels ?? [],

        ...loc,

        categories: categoriesData,
        ...(tagsData ? { tags: tagsData } : {}),
        ...(authorId ? { author: { connect: { id: authorId } } } : {}),
      };

      const created = await prisma.intent.create({
        data,
        include: { author: true, categories: true, tags: true },
      });

      if (created.authorId) {
        const notif = await prisma.notification.create({
          data: {
            kind: PrismaNotificationKind.INTENT_CREATED,
            message: `Your intent "${created.title}" has been created.`,
            payload: {
              intentId: created.id,
              title: created.title,
              startAt: created.startAt,
            },
            intent: { connect: { id: created.id } },
            recipient: { connect: { id: created.authorId } },
          },
          include: {
            recipient: true,
            intent: { include: { author: true, categories: true, tags: true } },
          },
        });

        await pubsub.publish({
          topic: `NOTIFICATION_ADDED:${notif.recipientId}`,
          payload: { notificationAdded: mapNotification(notif) },
        });
      }

      return mapIntent(created);
    }
  );

export const updateIntentMutation: MutationResolvers['updateIntent'] =
  resolverWithMetrics(
    'Mutation',
    'updateIntent',
    async (_p, { id, input }): Promise<GQLIntent> => {
      // walidacje non-nullable: jeśli przyjdzie null -> błąd (inaczej Prisma błąka się o typ)
      if (input.title === null) {
        throw new Error('title cannot be null');
      }
      if (input.min === null) {
        throw new Error('min cannot be null');
      }
      if (input.max === null) {
        throw new Error('max cannot be null');
      }

      // location: pickLocation zwraca tylko values != undefined, ale tu dopuśćmy również null do czyszczenia
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
            ...(Object.prototype.hasOwnProperty.call(input.location, 'radiusKm')
              ? { radiusKm: input.location.radiusKm }
              : {}),
          }
        : {};

      const categoriesUpdate:
        | Prisma.CategoryUpdateManyWithoutIntentsNestedInput
        | undefined =
        input.categoryIds != null
          ? {
              set: input.categoryIds.map((cid) => ({
                id: cid,
              })),
            }
          : undefined;

      const tagsUpdate:
        | Prisma.TagUpdateManyWithoutIntentsNestedInput
        | undefined =
        input.tagIds != null
          ? {
              set: input.tagIds.map((tid) => ({
                id: tid,
              })),
            }
          : undefined;

      const data: Prisma.IntentUpdateInput = {
        ...(typeof input.title === 'string' ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),

        ...(input.visibility !== undefined
          ? { visibility: input.visibility as unknown as PrismaVisibility }
          : {}),
        ...(input.mode !== undefined
          ? { mode: input.mode as unknown as PrismaMode }
          : {}),
        ...(typeof input.min === 'number' ? { min: input.min } : {}),
        ...(typeof input.max === 'number' ? { max: input.max } : {}),

        ...(input.startAt !== undefined
          ? { startAt: input.startAt as unknown as Date }
          : {}),
        ...(input.endAt !== undefined
          ? { endAt: input.endAt as unknown as Date }
          : {}),
        ...(typeof input.allowJoinLate === 'boolean'
          ? { allowJoinLate: input.allowJoinLate }
          : {}),

        ...(input.meetingKind !== undefined
          ? { meetingKind: input.meetingKind as unknown as PrismaMeetingKind }
          : {}),
        ...(input.onlineUrl !== undefined
          ? { onlineUrl: input.onlineUrl }
          : {}),
        ...(input.levels !== undefined
          ? { levels: input.levels as PrismaLevel[] }
          : {}),

        // location (nullable)
        ...(Object.prototype.hasOwnProperty.call(loc, 'lat')
          ? { lat: (loc as any).lat }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'lng')
          ? { lng: (loc as any).lng }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(loc, 'address')
          ? { address: (loc as any).address }
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
        include: { author: true, categories: true, tags: true },
      });

      return mapIntent(updated);
    }
  );

export const deleteIntentMutation: MutationResolvers['deleteIntent'] =
  resolverWithMetrics('Mutation', 'deleteIntent', async (_p, { id }) => {
    await prisma.intent.delete({ where: { id } });
    return true;
  });
