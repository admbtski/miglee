import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import {
  QueryResolvers,
  IntentStatus,
  MeetingKind,
  IntentsSortBy,
  SortDir,
} from '../../__generated__/resolvers-types';
import { mapIntent } from '../helpers';

const LOCK_WINDOW_MS = 6 * 60 * 60 * 1000; // 6h

const INTENT_INCLUDE = {
  categories: true,
  tags: true,
  members: { include: { user: true, addedBy: true } },
  owner: true,
  canceledBy: true,
  deletedBy: true,
} satisfies Prisma.IntentInclude;

export const intentsQuery: QueryResolvers['intents'] = resolverWithMetrics(
  'Query',
  'intents',
  async (_p, args) => {
    const take = Math.max(1, Math.min(args.limit ?? 20, 100));
    const skip = Math.max(0, args.offset ?? 0);

    const where: Prisma.IntentWhereInput = {};
    const AND: Prisma.IntentWhereInput[] = [];

    if (args.visibility) where.visibility = args.visibility;
    if (args.joinMode) where.joinMode = args.joinMode as any;

    if (args.ownerId) {
      AND.push({ ownerId: args.ownerId });
    }

    if (args.memberId) {
      AND.push({ members: { some: { userId: args.memberId } } });
      // brak wymuszenia visibility => członek widzi też HIDDEN, jeśli jest członkiem
    }

    if (args.upcomingAfter)
      AND.push({ startAt: { gte: args.upcomingAfter as Date } });
    if (args.endingBefore)
      AND.push({ endAt: { lte: args.endingBefore as Date } });

    if (args.categorySlugs?.length)
      AND.push({ categories: { some: { slug: { in: args.categorySlugs } } } });
    if (args.tagSlugs?.length)
      AND.push({ tags: { some: { slug: { in: args.tagSlugs } } } });

    if (args.levels?.length) AND.push({ levels: { hasSome: args.levels } });
    if (args.kinds?.length)
      AND.push({ meetingKind: { in: args.kinds as MeetingKind[] } });

    if (args.verifiedOnly) {
      AND.push({
        members: { some: { role: 'OWNER', user: { is: { verifiedAt: {} } } } },
      });
    }

    if (args.keywords?.length) {
      for (const kw of args.keywords) {
        const containsCI = { contains: kw, mode: 'insensitive' as const };
        AND.push({
          OR: [
            { title: containsCI },
            { description: containsCI },
            { address: containsCI },
            {
              tags: {
                some: { OR: [{ slug: containsCI }, { label: containsCI }] },
              },
            },
            { categories: { some: { slug: containsCI } } },
          ],
        });
      }
    }

    if (args.status && args.status !== IntentStatus.Any) {
      const now = new Date();
      const lockTo = new Date(now.getTime() + LOCK_WINDOW_MS);
      switch (args.status) {
        case IntentStatus.Canceled:
          AND.push({ canceledAt: { not: null } });
          break;
        case IntentStatus.Deleted:
          AND.push({ deletedAt: { not: null } });
          break;
        case IntentStatus.Ongoing:
          AND.push({ startAt: { lte: now }, endAt: { gte: now } });
          break;
        case IntentStatus.Started:
          // to jest "ENDED" – rozważ zmianę enuma w SDL
          AND.push({ startAt: { lt: now }, endAt: { lt: now } });
          break;
        case IntentStatus.Locked:
          AND.push({ startAt: { gt: now, lte: lockTo } });
          break;
        case IntentStatus.Available:
          AND.push({ startAt: { gt: lockTo } });
          break;
        case IntentStatus.Full:
          // TODO: agregacja/denormalizacja
          break;
      }
    }

    if (
      typeof args.distanceKm === 'number' &&
      Number.isFinite(args.distanceKm) &&
      args.near?.lat != null &&
      args.near?.lng != null
    ) {
      const lat = args.near.lat!;
      const lng = args.near.lng!;
      const km = args.distanceKm;

      const latDelta = km / 111;
      const lonDelta =
        km / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.0001));

      AND.push({ lat: { gte: lat - latDelta, lte: lat + latDelta } });
      AND.push({ lng: { gte: lng - lonDelta, lte: lng + lonDelta } });
    }

    if (AND.length) where.AND = AND;

    // ────────────── SORTOWANIE ──────────────
    const dir: Prisma.SortOrder = args.sortDir === SortDir.Asc ? 'asc' : 'desc';

    let orderBy: Prisma.IntentOrderByWithRelationInput[] = [];

    switch (args.sortBy) {
      case IntentsSortBy.StartAt:
        orderBy = [{ startAt: dir }, { createdAt: 'desc' }, { id: 'desc' }];
        break;

      case IntentsSortBy.CreatedAt:
        orderBy = [{ createdAt: dir }, { id: 'desc' }];
        break;

      case IntentsSortBy.UpdatedAt:
        orderBy = [{ updatedAt: dir }, { createdAt: 'desc' }, { id: 'desc' }];
        break;

      case IntentsSortBy.MembersCount:
        // sortowanie po liczbie członków (wszystkich); jeśli chcesz tylko JOINED,
        // rozważ denormalizację/cachowanie pola joinedCount i sort po nim.
        orderBy = [
          { members: { _count: dir } },
          { startAt: 'asc' },
          { id: 'desc' },
        ];
        break;

      default:
        // backendowy default – jak wcześniej
        orderBy = [{ startAt: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }];
        break;
    }

    const total = await prisma.intent.count({ where });

    const rows = await prisma.intent.findMany({
      where,
      take,
      skip,
      orderBy,
      include: INTENT_INCLUDE,
    });

    return {
      items: rows.map(mapIntent),
      pageInfo: {
        total,
        limit: take,
        offset: skip,
        hasPrev: skip > 0,
        hasNext: skip + take < total,
      },
    };
  }
);

export const intentQuery: QueryResolvers['intent'] = resolverWithMetrics(
  'Query',
  'intent',
  async (_p, { id }) => {
    const row = await prisma.intent.findUnique({
      where: { id },
      include: INTENT_INCLUDE,
    });
    return row ? mapIntent(row) : null;
  }
);
