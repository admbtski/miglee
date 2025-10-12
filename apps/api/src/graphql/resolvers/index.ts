// apps/api/src/graphql/resolvers/index.ts
import { withFilter } from 'mercurius';
import { prisma } from '../../lib/prisma';
import { resolverWithMetrics } from '../../lib/resolver-metrics';
import type {
  Resolvers,
  Event as GQLEvent,
  Notification as GQLNotification,
  Intent as GQLIntent,
  Visibility,
  Mode,
  MeetingKind,
  CreateIntentInput,
  UpdateIntentInput,
  NotificationKind,
} from '../__generated__/resolvers-types';

import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import { Prisma } from '@prisma/client';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function mapIntent(i: any): GQLIntent {
  return {
    id: i.id,
    title: i.title,
    description: i.description ?? null,
    notes: i.notes ?? null,

    visibility: i.visibility as Visibility,
    mode: i.mode as Mode,
    min: i.min,
    max: i.max,

    startAt: i.startAt,
    endAt: i.endAt,
    allowJoinLate: i.allowJoinLate,

    meetingKind: i.meetingKind as MeetingKind,
    onlineUrl: i.onlineUrl ?? null,

    lat: i.lat ?? null,
    lng: i.lng ?? null,
    address: i.address ?? null,
    radiusKm: i.radiusKm ?? null,

    createdAt: i.createdAt,
    updatedAt: i.updatedAt,

    authorId: i.authorId ?? null,
    author: i.author
      ? {
          id: i.author.id,
          email: i.author.email,
          name: i.author.name ?? null,
          imageUrl: i.author.imageUrl ?? null,
          createdAt: i.author.createdAt,
          updatedAt: i.author.updatedAt,
        }
      : null,

    categories:
      i.categories?.map((c: any) => ({
        id: c.id,
        slug: c.slug,
        names: c.names, // JSON scalar
        icon: c.icon ?? null,
        color: c.color ?? null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })) ?? [],
  };
}

function mapNotification(n: any): GQLNotification {
  return {
    id: n.id,
    kind: n.kind as NotificationKind,
    message: n.message ?? null,
    payload: (n.payload ?? null) as any,
    readAt: n.readAt ?? null,
    createdAt: n.createdAt,

    recipientId: n.recipientId,
    recipient: n.recipient
      ? {
          id: n.recipient.id,
          email: n.recipient.email,
          name: n.recipient.name ?? null,
          imageUrl: n.recipient.imageUrl ?? null,
          createdAt: n.recipient.createdAt,
          updatedAt: n.recipient.updatedAt,
        }
      : null,

    intentId: n.intentId ?? null,
    intent: n.intent ? mapIntent(n.intent) : null,
  };
}

/** Normalizuje input LocationInput -> shape zapisu w Intent */
function pickLocation(
  input?: CreateIntentInput['location'] | UpdateIntentInput['location']
) {
  if (!input) return {};
  const out: Record<string, any> = {};
  if (typeof input.lat === 'number') out.lat = input.lat;
  if (typeof input.lng === 'number') out.lng = input.lng;
  if (typeof input.address === 'string') out.address = input.address;
  if (typeof input.radiusKm === 'number') out.radiusKm = input.radiusKm;
  return out;
}

/* ------------------------------------------------------------------ */
/* Resolvers                                                          */
/* ------------------------------------------------------------------ */

type ResolversType = Pick<
  Resolvers,
  'Query' | 'Mutation' | 'Subscription' | 'JSON' | 'JSONObject'
>;

export const resolvers: ResolversType = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,

  Query: {
    // Events (zostają jak były)
    events: resolverWithMetrics(
      'Query',
      'events',
      async (_parent, args): Promise<GQLEvent[]> => {
        const limit = Math.max(1, Math.min(args.limit ?? 10, 100));
        const events = await prisma.event.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
        });
        return events.map(({ id, title, createdAt }) => ({
          id,
          title,
          createdAt,
        }));
      }
    ),

    // Notifications – opcjonalny filtr po recipientId, domyślnie bierze z auth jeśli jest
    notifications: resolverWithMetrics(
      'Query',
      'notifications',
      async (_p, _a, ctx) => {
        const recipientId =
          (_a as any)?.recipientId ?? (ctx as any)?.auth?.userId ?? null;

        const where = recipientId ? { recipientId } : {};
        const list = await prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            recipient: true,
            intent: { include: { author: true, categories: true } },
          },
        });
        return list.map(mapNotification);
      }
    ),

    // Intents
    intents: resolverWithMetrics('Query', 'intents', async (_p, args) => {
      const take = Math.max(1, Math.min(args.limit ?? 20, 100));
      const skip = Math.max(0, args.offset ?? 0);

      const where: any = {};
      if (args.visibility) where.visibility = args.visibility;
      if (args.authorId) where.authorId = args.authorId;
      if (args.upcomingAfter)
        where.startAt = { gte: args.upcomingAfter as unknown as Date };
      if (args.categoryIds && args.categoryIds.length) {
        where.categories = {
          some: { id: { in: args.categoryIds as string[] } },
        };
      }

      const items = await prisma.intent.findMany({
        where,
        take,
        skip,
        orderBy: [{ startAt: 'asc' }, { createdAt: 'desc' }],
        include: { author: true, categories: true },
      });

      return items.map(mapIntent);
    }),

    intent: resolverWithMetrics('Query', 'intent', async (_p, { id }) => {
      const found = await prisma.intent.findUnique({
        where: { id },
        include: { author: true, categories: true },
      });
      return found ? mapIntent(found) : null;
    }),

    // Categories
    categories: resolverWithMetrics(
      'Query',
      'categories',
      async (_p, { query: queryArg, limit }) => {
        const take = Math.max(1, Math.min(limit ?? 50, 200));
        const query = queryArg?.length ? queryArg.trim() : undefined;
        const where: Prisma.CategoryWhereInput = query
          ? {
              OR: [{ slug: { contains: query, mode: 'insensitive' } }],
            }
          : {};

        const list = await prisma.category.findMany({
          where,
          take,
          orderBy: { slug: 'asc' },
        });

        return list.map((c) => ({
          id: c.id,
          slug: c.slug,
          names: c.names,
          icon: c.icon ?? null,
          color: c.color ?? null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
      }
    ),

    category: resolverWithMetrics(
      'Query',
      'category',
      async (_p, { id, slug }) => {
        const c = await prisma.category.findFirst({
          where: { OR: [{ id: id ?? undefined }, { slug: slug ?? undefined }] },
        });
        return c
          ? {
              id: c.id,
              slug: c.slug,
              names: c.names,
              icon: c.icon ?? null,
              color: c.color ?? null,
              createdAt: c.createdAt,
              updatedAt: c.updatedAt,
            }
          : null;
      }
    ),

    // Users
    users: resolverWithMetrics(
      'Query',
      'users',
      async (_p, { limit = 50, offset = 0 }) => {
        const take = Math.max(1, Math.min(limit, 200));
        const skip = Math.max(0, offset);
        const list = await prisma.user.findMany({
          take,
          skip,
          orderBy: { createdAt: 'desc' },
        });
        return list.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name ?? null,
          imageUrl: u.imageUrl ?? null,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        }));
      }
    ),

    user: resolverWithMetrics('Query', 'user', async (_p, { id }) => {
      const u = await prisma.user.findUnique({ where: { id } });
      return u
        ? {
            id: u.id,
            email: u.email,
            name: u.name ?? null,
            imageUrl: u.imageUrl ?? null,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
          }
        : null;
    }),
  },

  Mutation: {
    // Drobna, ogólna notyfikacja (dalej działa)
    addNotification: resolverWithMetrics(
      'Mutation',
      'addNotification',
      async (_p, { message }, { pubsub, auth }) => {
        // jeśli mamy auth.userId to przypiszemy do niego, inaczej – wymaga recipientId w docelowej mutacji (tu fallback)
        const recipientId = (auth as any)?.userId ?? undefined;
        let created: any;

        if (recipientId) {
          created = await prisma.notification.create({
            data: {
              kind: 'INTENT_CREATED', // placeholder; „inne” typy też mogą używać tej mutacji, w razie czego do rozszerzenia
              message: message ?? null,
              payload: null,
              recipientId,
            },
            include: { recipient: true, intent: true },
          });
        } else {
          // bez recipienta – utwórz „bezpańską” (niezalecane), ale zachowujemy kompatybilność
          created = await prisma.notification.create({
            data: {
              kind: 'INTENT_CREATED',
              message: message ?? null,
              payload: null,
              recipient: {
                // możesz tu wskazać systemowego użytkownika, jeśli masz
                create: {
                  email: `system-${Date.now()}@example.com`,
                  name: 'System',
                },
              },
            },
            include: { recipient: true, intent: true },
          });
        }

        const payload = { notificationAdded: mapNotification(created) };

        await pubsub.publish({
          topic: `NOTIFICATION_ADDED:${created.recipientId}`,
          payload,
        });

        return mapNotification(created);
      }
    ),

    // Categories
    createCategory: resolverWithMetrics(
      'Mutation',
      'createCategory',
      async (_p, { input }) => {
        const created = await prisma.category.create({
          data: {
            slug: input.slug,
            names: input.names as any, // JSON
            icon: input.icon ?? null,
            color: input.color ?? null,
          },
        });
        return {
          id: created.id,
          slug: created.slug,
          names: created.names,
          icon: created.icon ?? null,
          color: created.color ?? null,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      }
    ),

    updateCategory: resolverWithMetrics(
      'Mutation',
      'updateCategory',
      async (_p, { id, input }) => {
        const updated = await prisma.category.update({
          where: { id },
          data: {
            slug: input.slug ?? undefined,
            names: input.names ? (input.names as any) : undefined,
            icon: input.icon ?? undefined,
            color: input.color ?? undefined,
          },
        });
        return {
          id: updated.id,
          slug: updated.slug,
          names: updated.names,
          icon: updated.icon ?? null,
          color: updated.color ?? null,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      }
    ),

    deleteCategory: resolverWithMetrics(
      'Mutation',
      'deleteCategory',
      async (_p, { id }) => {
        await prisma.category.delete({ where: { id } });
        return true;
      }
    ),

    // Intents
    createIntent: resolverWithMetrics(
      'Mutation',
      'createIntent',
      async (_p, { input }, { auth, pubsub }) => {
        // Walidacja 1..3 kategorii
        if (
          !input.interestIds ||
          input.interestIds.length < 1 ||
          input.interestIds.length > 3
        ) {
          throw new Error('Select between 1 and 3 categories (interestIds).');
        }

        const loc = pickLocation(input.location);

        const created = await prisma.intent.create({
          data: {
            title: input.title,
            description: input.description ?? null,
            notes: input.notes ?? null,

            visibility: input.visibility,
            mode: input.mode,
            min: input.min,
            max: input.max,

            startAt: input.startAt as unknown as Date,
            endAt: input.endAt as unknown as Date,
            allowJoinLate: input.allowJoinLate,

            meetingKind: input.meetingKind,
            onlineUrl: input.onlineUrl ?? null,

            authorId: input.authorId ?? (auth as any)?.userId ?? null,
            ...loc,

            categories: {
              connect: input.interestIds.map((id) => ({ id })),
            },
          },
          include: { author: true, categories: true },
        });

        // Notyfikacja „INTENT_CREATED” – wysyłamy do autora (jeśli jest)
        if (created.authorId) {
          const notif = await prisma.notification.create({
            data: {
              kind: 'INTENT_CREATED',
              message: `Your intent "${created.title}" has been created.`,
              payload: {
                intentId: created.id,
                title: created.title,
                startAt: created.startAt,
              } as any,
              recipientId: created.authorId,
              intentId: created.id,
            },
            include: {
              recipient: true,
              intent: { include: { author: true, categories: true } },
            },
          });

          await pubsub.publish({
            topic: `NOTIFICATION_ADDED:${notif.recipientId}`,
            payload: { notificationAdded: mapNotification(notif) },
          });
        }

        return mapIntent(created);
      }
    ),

    updateIntent: resolverWithMetrics(
      'Mutation',
      'updateIntent',
      async (_p, { id, input }) => {
        const loc = pickLocation(input.location);

        // jeżeli przychodzi interestIds – zastępujemy cały zestaw
        const categoriesUpdate =
          input.interestIds != null
            ? {
                set: [],
                connect: input.interestIds.map((cid) => ({ id: cid })),
              }
            : undefined;

        const updated = await prisma.intent.update({
          where: { id },
          data: {
            title: input.title ?? undefined,
            description: input.description ?? undefined,
            notes: input.notes ?? undefined,
            visibility: input.visibility ?? undefined,
            mode: input.mode ?? undefined,
            min: input.min ?? undefined,
            max: input.max ?? undefined,
            startAt: (input.startAt as unknown as Date) ?? undefined,
            endAt: (input.endAt as unknown as Date) ?? undefined,
            allowJoinLate: input.allowJoinLate ?? undefined,
            meetingKind: input.meetingKind ?? undefined,
            onlineUrl: input.onlineUrl ?? undefined,
            ...loc,
            categories: categoriesUpdate,
          },
          include: { author: true, categories: true },
        });

        return mapIntent(updated);
      }
    ),

    deleteIntent: resolverWithMetrics(
      'Mutation',
      'deleteIntent',
      async (_p, { id }) => {
        await prisma.intent.delete({ where: { id } });
        return true;
      }
    ),
  },

  Subscription: {
    // Filtrujemy po recipientId (z args lub z ctx.auth.userId)
    notificationAdded: {
      subscribe: withFilter(
        (_source, args, ctx) => {
          const recipientId =
            (args as any)?.recipientId ?? (ctx as any)?.auth?.userId;
          // jeśli brak recipientId, można zsubować „globalny” – ale tu wymagamy recipientId
          const topic = `NOTIFICATION_ADDED:${recipientId}`;
          return ctx.pubsub.subscribe(topic);
        },
        (payload, args, ctx) => {
          const recipientId =
            (args as any)?.recipientId ?? (ctx as any)?.auth?.userId;
          return (
            payload?.notificationAdded?.recipientId &&
            payload.notificationAdded.recipientId === recipientId
          );
        }
      ),
      // Mercurius wymaga field resolvera lub payloadu z właściwą nazwą – payload już ma { notificationAdded }
    },
  },
};
