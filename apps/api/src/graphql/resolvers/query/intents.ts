import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import {
  QueryResolvers,
  IntentStatus,
  MeetingKind,
} from '../../__generated__/resolvers-types';
import { mapIntent } from '../helpers';

const LOCK_WINDOW_MS = 6 * 60 * 60 * 1000; // 6h – jak w kliencie

export const intentsQuery: QueryResolvers['intents'] = resolverWithMetrics(
  'Query',
  'intents',
  async (_p, args) => {
    const take = Math.max(1, Math.min(args.limit ?? 20, 100));
    const skip = Math.max(0, args.offset ?? 0);

    const where: Prisma.IntentWhereInput = {};
    const AND: Prisma.IntentWhereInput[] = [];

    // ── proste pola
    if (args.visibility) where.visibility = args.visibility;
    if (args.authorId) where.authorId = args.authorId;

    if (args.upcomingAfter) {
      AND.push({ startAt: { gte: args.upcomingAfter as Date } });
    }
    if (args.endingBefore) {
      AND.push({ endAt: { lte: args.endingBefore as Date } });
    }

    // Kategorie / tagi / poziomy
    if (args.categoryIds?.length) {
      AND.push({ categories: { some: { id: { in: args.categoryIds } } } });
    }
    if (args.tagIds?.length) {
      AND.push({ tags: { some: { id: { in: args.tagIds } } } });
    }
    if (args.levels?.length) {
      // Postgres enum[] contains-any
      AND.push({ levels: { hasSome: args.levels } });
    }
    // Kinds (MeetingKind[])
    if (args.kinds?.length) {
      AND.push({ meetingKind: { in: args.kinds as MeetingKind[] } });
    }

    // ONLY verified authors
    if (args.verifiedOnly) {
      AND.push({
        author: {
          // Prisma relacja: user może być null, więc filtrujemy tylko tych z verifiedAt != null
          is: { verifiedAt: { not: null } },
        },
      });
    }

    // Keywords (AND-logic jak w kliencie: każdy keyword musi wystąpić gdzieś)
    // Szukamy case-insensitive w: title, description, address, tags.slug/label, categories.slug
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

    // Status (bez "FULL" – backend nie zna zajętości; LOCK okno 6h jak w kliencie)
    if (args.status && args.status !== IntentStatus.Any) {
      const now = new Date();
      const lockFrom = new Date(now.getTime());
      const lockTo = new Date(now.getTime() + LOCK_WINDOW_MS);

      switch (args.status) {
        case IntentStatus.Ongoing:
          AND.push({
            startAt: { lte: now },
            endAt: { gte: now },
          });
          break;

        case IntentStatus.Started:
          // "Started" w UI = rozpoczęte (ale już NIE trwa), dlatego wykluczamy Ongoing
          AND.push({
            startAt: { lt: now },
            endAt: { lt: now },
          });
          break;

        case IntentStatus.Locked:
          // Start w ciągu najbliższych 6h (i jeszcze się nie zaczął)
          AND.push({
            startAt: { gt: now, lte: lockTo },
          });
          break;

        case IntentStatus.Available:
          // Start później niż okno lock (czyli > now + 6h)
          AND.push({
            startAt: { gt: lockTo },
          });
          break;

        case IntentStatus.Full:
          // Brak danych o zapisach/obłożeniu w schemacie -> nie da się odfiltrować.
          // Zostawiamy bez filtra (alternatywnie można dodać AND.push({ id: '__no_match__' }) by zwrócić pusty zbiór).
          break;

        default:
          break;
      }
    }

    // Ewentualny filtr na "distanceKm":
    // W schemacie nie przekazujesz punktu odniesienia (lat/lng użytkownika lub miasta),
    // więc serwer nie jest w stanie policzyć dystansu haversine.
    // Jeżeli chcesz, można tu ograniczyć po samym "radiusKm <= distanceKm".
    if (
      typeof args.distanceKm === 'number' &&
      Number.isFinite(args.distanceKm)
    ) {
      AND.push({
        OR: [
          // brak radiusu traktujemy jako pasujące (serwer nie wie, czy jest daleko/ blisko)
          { radiusKm: null },
          { radiusKm: { lte: args.distanceKm } },
        ],
      });
    }

    if (AND.length) where.AND = AND;

    const items = await prisma.intent.findMany({
      where,
      take,
      skip,
      orderBy: [{ startAt: 'asc' }, { createdAt: 'desc' }],
      include: { author: true, categories: true, tags: true },
    });

    return items.map(mapIntent);
  }
);

export const intentQuery: QueryResolvers['intent'] = resolverWithMetrics(
  'Query',
  'intent',
  async (_p, { id }) => {
    const row = await prisma.intent.findUnique({
      where: { id },
      include: { author: true, categories: true, tags: true },
    });
    return row ? mapIntent(row) : null;
  }
);
