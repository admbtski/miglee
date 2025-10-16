import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import {
  QueryResolvers,
  IntentStatus,
  MeetingKind,
} from '../../__generated__/resolvers-types';
import { mapIntent } from '../helpers';

const LOCK_WINDOW_MS = 6 * 60 * 60 * 1000; // 6h

const INTENT_INCLUDE = {
  categories: true,
  tags: true,
  members: { include: { user: true, addedBy: true } },
} satisfies Prisma.IntentInclude;

export const intentsQuery: QueryResolvers['intents'] = resolverWithMetrics(
  'Query',
  'intents',
  async (_p, args) => {
    console.dir({ args });
    const take = Math.max(1, Math.min(args.limit ?? 20, 100));
    const skip = Math.max(0, args.offset ?? 0);

    const where: Prisma.IntentWhereInput = {};
    const AND: Prisma.IntentWhereInput[] = [];

    if (args.visibility) {
      where.visibility = args.visibility;
    }

    if (args.ownerId)
      AND.push({
        members: {
          some: { role: 'OWNER', userId: args.ownerId },
        },
      });

    if (args.upcomingAfter)
      AND.push({ startAt: { gte: args.upcomingAfter as Date } });
    if (args.endingBefore)
      AND.push({ endAt: { lte: args.endingBefore as Date } });

    if (args.categoryIds?.length) {
      AND.push({ categories: { some: { slug: { in: args.categoryIds } } } });
    }
    if (args.tagIds?.length) {
      AND.push({ tags: { some: { slug: { in: args.tagIds } } } });
    }
    if (args.levels?.length) {
      AND.push({ levels: { hasSome: args.levels } });
    }
    if (args.kinds?.length) {
      AND.push({ meetingKind: { in: args.kinds as MeetingKind[] } });
    }

    if (args.verifiedOnly) {
      AND.push({
        members: {
          some: {
            role: 'OWNER',
            user: { is: { verifiedAt: {} } },
          },
        },
      });
    }

    // Keywords – AND-logic
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

    // Status (FULL wymaga agregacji – patrz uwagi niżej)
    if (args.status && args.status !== IntentStatus.Any) {
      const now = new Date();
      const lockTo = new Date(now.getTime() + LOCK_WINDOW_MS);

      switch (args.status) {
        case IntentStatus.Ongoing:
          AND.push({ startAt: { lte: now }, endAt: { gte: now } });
          break;
        case IntentStatus.Started:
          AND.push({ startAt: { lt: now }, endAt: { lt: now } });
          break;
        case IntentStatus.Locked:
          AND.push({ startAt: { gt: now, lte: lockTo } });
          break;
        case IntentStatus.Available:
          AND.push({ startAt: { gt: lockTo } });
          break;
        case IntentStatus.Full:
          // Bez kolumny licznikowej/SQL agregacji nie przefiltrujemy tu wiarygodnie.
          // Rozważ materiał widok / kolumnę denormalizowaną lub osobne zapytanie agregujące.
          break;
        default:
          break;
      }
    }

    // Prosta heurystyka distanceKm (bez punktu odniesienia `near` nie policzymy dystansu)
    if (
      typeof args.distanceKm === 'number' &&
      Number.isFinite(args.distanceKm) &&
      args.near?.lat != null &&
      args.near?.lng != null
    ) {
      const lat = args.near.lat!;
      const lng = args.near.lng!;
      const km = args.distanceKm;

      // bbox ~1 deg lat ~ 111km; lon zależy od szerokości geograficznej
      const latDelta = km / 111;
      const lonDelta =
        km / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.0001));

      AND.push({
        lat: { gte: lat - latDelta, lte: lat + latDelta },
      });
      AND.push({
        lng: { gte: lng - lonDelta, lte: lng + lonDelta },
      });
      // Uwaga: to tylko filtr wstępny (bbox). Dokładny dystans (haversine) można zweryfikować w kodzie
      // po pobraniu wyników lub przez widok SQL/extension.
    }

    if (AND.length) where.AND = AND;

    const items = await prisma.intent.findMany({
      where,
      take,
      skip,
      orderBy: [{ startAt: 'asc' }, { createdAt: 'desc' }],
      include: INTENT_INCLUDE,
    });

    // Jeżeli potrzebujesz realnego filtra "FULL", zrób dodatkowy krok tu (po fetchu) i odfiltruj
    // wg joinedCount vs max, lub zastosuj materiał widok/denormalizację.
    return items.map(mapIntent);
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
