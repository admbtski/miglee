import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
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

const MINUTE_MS = 60 * 1000;

const INTENT_INCLUDE = {
  categories: true,
  tags: true,
  members: {
    include: {
      user: { include: { profile: true } },
      addedBy: { include: { profile: true } },
    },
  },
  owner: { include: { profile: true } },
  canceledBy: { include: { profile: true } },
  deletedBy: { include: { profile: true } },
  sponsorship: {
    include: {
      sponsor: { include: { profile: true } },
    },
  },
  // jeśli masz relację w Prisma:
  // joinManuallyClosedBy: true,
} satisfies Prisma.IntentInclude;

/* ───────────────────────────── Helpers ───────────────────────────── */

function computeJoinOpenAndFlags(row: {
  startAt: Date;
  endAt: Date;
  allowJoinLate: boolean;
  joinOpensMinutesBeforeStart: number | null;
  joinCutoffMinutesBeforeStart: number | null;
  lateJoinCutoffMinutesAfterStart: number | null;
  joinManuallyClosed: boolean;
  canceledAt: Date | null;
  deletedAt: Date | null;
  joinedCount: number;
  max: number;
}) {
  const now = new Date();
  const { startAt, endAt } = row;

  const beforeStart = now < startAt;
  const during = now >= startAt && now < endAt;
  const ended = now >= endAt;

  // Hard blocks first (deleted, canceled, ended, full)
  if (row.deletedAt || row.canceledAt || ended) {
    return { joinOpen: false, ended, during, beforeStart };
  }

  const isFull =
    typeof row.max === 'number' && row.max > 0 && row.joinedCount >= row.max;
  if (isFull) {
    return { joinOpen: false, ended, during, beforeStart };
  }

  if (row.joinManuallyClosed) {
    return { joinOpen: false, ended, during, beforeStart };
  }

  if (beforeStart) {
    // not-open-yet window
    if (
      row.joinOpensMinutesBeforeStart != null &&
      now <
        new Date(
          startAt.getTime() - row.joinOpensMinutesBeforeStart * MINUTE_MS
        )
    ) {
      return { joinOpen: false, ended, during, beforeStart };
    }
    // pre-start cutoff
    if (
      row.joinCutoffMinutesBeforeStart != null &&
      now >=
        new Date(
          startAt.getTime() - row.joinCutoffMinutesBeforeStart * MINUTE_MS
        )
    ) {
      return { joinOpen: false, ended, during, beforeStart };
    }
    return { joinOpen: true, ended, during, beforeStart };
  }

  if (during) {
    if (!row.allowJoinLate) {
      return { joinOpen: false, ended, during, beforeStart };
    }
    if (
      row.lateJoinCutoffMinutesAfterStart != null &&
      now >=
        new Date(
          startAt.getTime() + row.lateJoinCutoffMinutesAfterStart * MINUTE_MS
        )
    ) {
      return { joinOpen: false, ended, during, beforeStart };
    }
    return { joinOpen: true, ended, during, beforeStart };
  }

  // ended (redundant but explicit)
  return { joinOpen: false, ended: true, during: false, beforeStart: false };
}

function buildBaseWhere(args: Parameters<QueryResolvers['intents']>[1]) {
  const where: Prisma.IntentWhereInput = {};
  const AND: Prisma.IntentWhereInput[] = [];

  // Visibility: jeśli podano memberId, członek może zobaczyć HIDDEN intenty
  if (args.visibility && !args.memberId) {
    where.visibility = args.visibility;
  } else if (args.visibility && args.memberId) {
    // Członek widzi intenty z danym visibility LUB te, w których jest członkiem
    AND.push({
      OR: [
        { visibility: args.visibility },
        { members: { some: { userId: args.memberId } } },
      ],
    });
  }

  // JoinMode filter - support multiple modes
  if (args.joinMode) {
    where.joinMode = args.joinMode;
  } else if (args.joinModes?.length) {
    AND.push({ joinMode: { in: args.joinModes } });
  }

  if (args.ownerId) AND.push({ ownerId: args.ownerId });
  if (args.memberId && !args.visibility) {
    // Jeśli nie ma filtra visibility, po prostu filtruj po członkostwie
    AND.push({ members: { some: { userId: args.memberId } } });
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
    // UWAGA: każde słowo działa jak AND( OR(fields CONTAINS kw) ) – czyli „wszystkie słowa muszą wystąpić”.
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

  if (AND.length) where.AND = AND;
  return where;
}

function buildOrderBy(args: Parameters<QueryResolvers['intents']>[1]) {
  const dir: Prisma.SortOrder = args.sortDir === SortDir.Asc ? 'asc' : 'desc';

  // PRIORITY SYSTEM:
  // 1. boostedAt DESC NULLS LAST - boosted events come first (only if < 24h old)
  // 2. For non-boosted or expired boosts (null or > 24h), sort by requested field
  // NOTE: The 24h filter is applied in the WHERE clause, not here

  switch (args.sortBy) {
    case IntentsSortBy.StartAt:
      return [
        { boostedAt: { sort: 'desc', nulls: 'last' } },
        { startAt: dir },
        { id: 'desc' },
      ] as Prisma.IntentOrderByWithRelationInput[];
    case IntentsSortBy.CreatedAt:
      return [
        { boostedAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: dir },
        { id: 'desc' },
      ] as Prisma.IntentOrderByWithRelationInput[];
    case IntentsSortBy.UpdatedAt:
      return [
        { boostedAt: { sort: 'desc', nulls: 'last' } },
        { updatedAt: dir },
        { id: 'desc' },
      ] as Prisma.IntentOrderByWithRelationInput[];
    case IntentsSortBy.MembersCount:
      return [
        { boostedAt: { sort: 'desc', nulls: 'last' } },
        { members: { _count: dir } },
        { startAt: 'asc' },
        { id: 'desc' },
      ] as Prisma.IntentOrderByWithRelationInput[];
    default:
      return [
        { boostedAt: { sort: 'desc', nulls: 'last' } },
        { startAt: 'asc' },
        { createdAt: 'desc' },
        { id: 'desc' },
      ] as Prisma.IntentOrderByWithRelationInput[];
  }
}

function applyDistanceBox(
  where: Prisma.IntentWhereInput,
  near: { lat?: number | null; lng?: number | null } | null | undefined,
  distanceKm?: number | null
) {
  if (
    typeof distanceKm === 'number' &&
    Number.isFinite(distanceKm) &&
    near?.lat != null &&
    near?.lng != null
  ) {
    const lat = near.lat!;
    const lng = near.lng!;
    const km = distanceKm;

    const latDelta = km / 111;
    const lonDelta =
      km / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.0001));

    const AND: Prisma.IntentWhereInput[] = [
      { lat: { gte: lat - latDelta, lte: lat + latDelta } },
      { lng: { gte: lng - lonDelta, lte: lng + lonDelta } },
    ];
    where.AND = where.AND
      ? [...(where.AND as Prisma.IntentWhereInput[]), ...AND]
      : AND;
  }
}

/* ───────────────────────────── Main Resolver ───────────────────────────── */

export const intentsQuery: QueryResolvers['intents'] = resolverWithMetrics(
  'Query',
  'intents',
  async (_p, args, { user }) => {
    const take = Math.max(1, Math.min(args.limit ?? 20, 100));
    const skip = Math.max(0, args.offset ?? 0);
    const now = new Date();

    // Validate near/distanceKm: if distanceKm is provided, near.lat and near.lng are required
    if (args.distanceKm != null && (!args.near?.lat || !args.near?.lng)) {
      throw new GraphQLError(
        'When `distanceKm` is provided, `near.lat` and `near.lng` are required.',
        {
          extensions: { code: 'BAD_USER_INPUT', field: 'near' },
        }
      );
    }

    // Bazowy where/sort
    const baseWhere = buildBaseWhere(args);
    applyDistanceBox(baseWhere, args.near ?? null, args.distanceKm ?? null);
    const orderBy = buildOrderBy(args);

    // Szybkie statusy w SQL (CANCELED, DELETED, ONGOING, PAST)
    const wantsCanceled = args.status === IntentStatus.Canceled;
    const wantsDeleted = args.status === IntentStatus.Deleted;
    const wantsOngoing = args.status === IntentStatus.Ongoing;
    const wantsPast = args.status === IntentStatus.Past;

    if (wantsCanceled) {
      const existing = Array.isArray(baseWhere.AND) ? baseWhere.AND : [];
      baseWhere.AND = [...existing, { canceledAt: { not: null } }];
    }
    if (wantsDeleted) {
      const existing = Array.isArray(baseWhere.AND) ? baseWhere.AND : [];
      baseWhere.AND = [...existing, { deletedAt: { not: null } }];
    }
    if (wantsOngoing) {
      const existing = Array.isArray(baseWhere.AND) ? baseWhere.AND : [];
      baseWhere.AND = [
        ...existing,
        { startAt: { lte: now } },
        { endAt: { gt: now } },
        { canceledAt: null },
        { deletedAt: null },
      ];
    }
    if (wantsPast) {
      const existing = Array.isArray(baseWhere.AND) ? baseWhere.AND : [];
      baseWhere.AND = [
        ...existing,
        { endAt: { lt: now } },
        { canceledAt: null },
        { deletedAt: null },
      ];
    }

    const statusNeedsPostFilter =
      args.status &&
      ![
        IntentStatus.Any,
        IntentStatus.Canceled,
        IntentStatus.Deleted,
        IntentStatus.Ongoing,
        IntentStatus.Past,
      ].includes(args.status);

    // Gałąź A: status nie wymaga post-filtra → standardowe count + findMany
    if (!statusNeedsPostFilter) {
      const total = await prisma.intent.count({ where: baseWhere });

      // Fetch all candidates for manual sorting (boost expiration logic)
      const allRows = await prisma.intent.findMany({
        where: baseWhere,
        orderBy,
        include: INTENT_INCLUDE,
      });

      // Apply 24h boost expiration: treat boostedAt older than 24h as null
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const rowsWithEffectiveBoost = allRows.map((row) => ({
        ...row,
        effectiveBoostedAt:
          row.boostedAt && row.boostedAt >= twentyFourHoursAgo
            ? row.boostedAt
            : null,
      }));

      // Manual sort with effective boost
      const dir = args.sortDir === SortDir.Asc ? 1 : -1;
      rowsWithEffectiveBoost.sort((a, b) => {
        // 1. Sort by effectiveBoostedAt (most recent first, nulls last)
        if (a.effectiveBoostedAt && !b.effectiveBoostedAt) return -1;
        if (!a.effectiveBoostedAt && b.effectiveBoostedAt) return 1;
        if (a.effectiveBoostedAt && b.effectiveBoostedAt) {
          const boostDiff =
            b.effectiveBoostedAt.getTime() - a.effectiveBoostedAt.getTime();
          if (boostDiff !== 0) return boostDiff;
        }

        // 2. Sort by requested field
        switch (args.sortBy) {
          case IntentsSortBy.StartAt:
            return dir * (a.startAt.getTime() - b.startAt.getTime());
          case IntentsSortBy.CreatedAt:
            return dir * (a.createdAt.getTime() - b.createdAt.getTime());
          case IntentsSortBy.UpdatedAt:
            return dir * (a.updatedAt.getTime() - b.updatedAt.getTime());
          case IntentsSortBy.MembersCount:
            // Note: members count would need to be calculated or denormalized
            return 0;
          default:
            return dir * (a.startAt.getTime() - b.startAt.getTime());
        }
      });

      // Apply pagination
      const paginatedRows = rowsWithEffectiveBoost.slice(skip, skip + take);

      return {
        items: paginatedRows.map((r) => mapIntent(r, user?.id)),
        pageInfo: {
          total,
          limit: take,
          offset: skip,
          hasPrev: skip > 0,
          hasNext: skip + take < total,
        },
      };
    }

    // Gałąź B: status wymaga wyliczenia (FULL / LOCKED / AVAILABLE)
    // Wstępnie ograniczamy kandydatów do przyszłości (endAt > now), by uniknąć zbędnych rekordów.
    const preFilterForComputed: Prisma.IntentWhereInput = {
      endAt: { gt: now },
      canceledAt: null,
      deletedAt: null,
    };
    const computedWhere: Prisma.IntentWhereInput = baseWhere.AND
      ? {
          AND: [
            ...(baseWhere.AND as Prisma.IntentWhereInput[]),
            preFilterForComputed,
          ],
        }
      : preFilterForComputed;

    const candidateSelect = {
      id: true,
      startAt: true,
      endAt: true,
      allowJoinLate: true,
      joinOpensMinutesBeforeStart: true,
      joinCutoffMinutesBeforeStart: true,
      lateJoinCutoffMinutesAfterStart: true,
      joinManuallyClosed: true,
      canceledAt: true,
      deletedAt: true,
      joinedCount: true,
      max: true,
      boostedAt: true, // For 24h boost expiration logic
      createdAt: true, // For sorting
      updatedAt: true, // For sorting
    } satisfies Prisma.IntentSelect;

    // UWAGA: dla bardzo dużych zbiorów rozważ queryRaw + window functions / materializację.
    const allCandidateRows = await prisma.intent.findMany({
      where: computedWhere,
      select: candidateSelect,
      orderBy,
    });

    // Apply 24h boost expiration
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const candidatesWithEffectiveBoost = allCandidateRows.map((row) => ({
      ...row,
      effectiveBoostedAt:
        row.boostedAt && row.boostedAt >= twentyFourHoursAgo
          ? row.boostedAt
          : null,
    }));

    // Manual sort with effective boost
    const dir = args.sortDir === SortDir.Asc ? 1 : -1;
    candidatesWithEffectiveBoost.sort((a, b) => {
      // 1. Sort by effectiveBoostedAt (most recent first, nulls last)
      if (a.effectiveBoostedAt && !b.effectiveBoostedAt) return -1;
      if (!a.effectiveBoostedAt && b.effectiveBoostedAt) return 1;
      if (a.effectiveBoostedAt && b.effectiveBoostedAt) {
        const boostDiff =
          b.effectiveBoostedAt.getTime() - a.effectiveBoostedAt.getTime();
        if (boostDiff !== 0) return boostDiff;
      }

      // 2. Sort by requested field
      switch (args.sortBy) {
        case IntentsSortBy.StartAt:
          return dir * (a.startAt.getTime() - b.startAt.getTime());
        case IntentsSortBy.CreatedAt:
          return dir * (a.createdAt.getTime() - b.createdAt.getTime());
        case IntentsSortBy.UpdatedAt:
          return dir * (a.updatedAt.getTime() - b.updatedAt.getTime());
        default:
          return dir * (a.startAt.getTime() - b.startAt.getTime());
      }
    });

    const filteredIds: string[] = [];
    for (const r of candidatesWithEffectiveBoost) {
      if (r.canceledAt || r.deletedAt) continue;

      const { joinOpen, ended } = computeJoinOpenAndFlags({
        startAt: r.startAt,
        endAt: r.endAt,
        allowJoinLate: r.allowJoinLate,
        joinOpensMinutesBeforeStart: r.joinOpensMinutesBeforeStart,
        joinCutoffMinutesBeforeStart: r.joinCutoffMinutesBeforeStart,
        lateJoinCutoffMinutesAfterStart: r.lateJoinCutoffMinutesAfterStart,
        joinManuallyClosed: r.joinManuallyClosed,
        canceledAt: r.canceledAt,
        deletedAt: r.deletedAt,
        joinedCount: r.joinedCount,
        max: r.max,
      });

      const isFull =
        typeof r.max === 'number' && r.max > 0 && r.joinedCount >= r.max;

      switch (args.status) {
        case IntentStatus.Full:
          if (!ended && isFull) filteredIds.push(r.id);
          break;
        case IntentStatus.Locked:
          // locked = joinOpen === false i event nie zakończony
          if (!ended && !joinOpen) filteredIds.push(r.id);
          break;
        case IntentStatus.Available:
          // available = joinOpen === true (w tym late-join, jeśli dozwolony)
          if (!ended && joinOpen) filteredIds.push(r.id);
          break;
        default:
          break;
      }
    }

    const total = filteredIds.length;

    // Paginate na ID (stabilny porządek wg orderBy z fetchu kandydatów)
    const pageIds = filteredIds.slice(skip, skip + take);

    if (pageIds.length === 0) {
      return {
        items: [],
        pageInfo: {
          total,
          limit: take,
          offset: skip,
          hasPrev: skip > 0,
          hasNext: skip + take < total,
        },
      };
    }

    // Dociągnij pełne rekordy (zachowaj order wg pageIds)
    const pageRows = await prisma.intent.findMany({
      where: { id: { in: pageIds } },
      include: INTENT_INCLUDE,
    });

    const byId = new Map(pageRows.map((r) => [r.id, r]));
    const ordered = pageIds.map((id) => byId.get(id)!).filter(Boolean);

    return {
      items: ordered.map((r) => mapIntent(r, user?.id)),
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
  async (_p, { id }, { user }) => {
    const row = await prisma.intent.findUnique({
      where: { id },
      include: INTENT_INCLUDE,
    });

    console.dir({ row });

    return row ? mapIntent(row, user?.id) : null;
  }
);
