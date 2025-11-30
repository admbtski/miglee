import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import {
  IntentsSortBy,
  IntentStatus,
  MeetingKind,
  QueryIntentsArgs,
  QueryResolvers,
  SortDir,
} from '../../__generated__/resolvers-types';
import { mapIntent } from '../helpers';

const BOOST_DURATION_MS = 24 * 60 * 60 * 1000;

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
  // If you have a relation in Prisma:
  // joinManuallyClosedBy: true,
} satisfies Prisma.IntentInclude;

/* ───────────────────────────── Helpers ───────────────────────────── */

function getAndArray(
  where: Prisma.IntentWhereInput
): Prisma.IntentWhereInput[] {
  if (!where.AND) where.AND = [];
  return where.AND as Prisma.IntentWhereInput[];
}

function buildBaseWhere(args: QueryIntentsArgs): Prisma.IntentWhereInput {
  const where: Prisma.IntentWhereInput = {};
  const AND = getAndArray(where);

  /* ───────────────────────── Default: Hide canceled & deleted ─────────────────
     Unless explicitly filtering by CANCELED or DELETED status, we hide them by default.
  ------------------------------------------------------------------------------ */
  const status = args.status;
  const shouldHideCanceledAndDeleted =
    !status ||
    (status !== IntentStatus.Canceled && status !== IntentStatus.Deleted);

  if (shouldHideCanceledAndDeleted) {
    AND.push({ canceledAt: null }, { deletedAt: null });
  }

  /* ───────────────────────── Visibility & Membership ─────────────────────────
     Rules:
     - If visibility is provided AND no memberId → strict visibility filter.
     - If visibility is provided AND memberId → visible if (visibility matches OR user is a member).
     - If no visibility but memberId → filter by membership only.
  --------------------------------------------------------------------------- */
  if (args.visibility) {
    if (!args.memberId) {
      where.visibility = args.visibility;
    } else {
      AND.push({
        OR: [
          { visibility: args.visibility },
          { members: { some: { userId: args.memberId } } },
        ],
      });
    }
  } else if (args.memberId) {
    AND.push({ members: { some: { userId: args.memberId } } });
  }

  /* ───────────────────────── JoinMode ─────────────────────────
     Supports both singular joinMode and multi-value joinModes.
  ---------------------------------------------------------------- */
  if (args.joinMode) {
    where.joinMode = args.joinMode;
  } else if (args.joinModes?.length) {
    AND.push({ joinMode: { in: args.joinModes } });
  }

  /* ───────────────────────── Owner filter ───────────────────────── */
  if (args.ownerId) {
    AND.push({ ownerId: args.ownerId });
  }

  /* ───────────────────────── Time filters ───────────────────────── */
  if (args.upcomingAfter) {
    AND.push({ startAt: { gte: args.upcomingAfter as Date } });
  }

  if (args.endingBefore) {
    AND.push({ endAt: { lte: args.endingBefore as Date } });
  }

  /* ───────────────────────── Category / Tag filters ───────────────────────── */
  if (args.categorySlugs?.length) {
    AND.push({
      categories: { some: { slug: { in: args.categorySlugs } } },
    });
  }

  if (args.tagSlugs?.length) {
    AND.push({
      tags: { some: { slug: { in: args.tagSlugs } } },
    });
  }

  /* ───────────────────────── Level / MeetingKind filters ─────────────────── */
  if (args.levels?.length) {
    AND.push({ levels: { hasSome: args.levels } });
  }

  if (args.kinds?.length) {
    AND.push({ meetingKind: { in: args.kinds as MeetingKind[] } });
  }

  /* ───────────────────────── Verified Owner filter ─────────────────────────
     Matches intents where OWNER's user.verifiedAt is not null.
  -------------------------------------------------------------------------- */
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

  /* ───────────────────────── Keyword search ─────────────────────────
     Behavior: every keyword must match (AND),
               but each keyword matches OR across multiple fields.
  --------------------------------------------------------------------- */
  if (args.keywords?.length) {
    for (const rawKw of args.keywords) {
      const kw = rawKw.trim();
      if (!kw) continue;

      const containsCI = { contains: kw, mode: 'insensitive' as const };

      AND.push({
        OR: [
          { title: containsCI },
          { description: containsCI },
          { address: containsCI },
          {
            tags: {
              some: {
                OR: [{ slug: containsCI }, { label: containsCI }],
              },
            },
          },
          { categories: { some: { slug: containsCI } } },
        ],
      });
    }
  }

  /* ───────────────────────── Cleanup ─────────────────────────
     Remove AND if it ended up empty — makes debugging cleaner.
  ---------------------------------------------------------------- */
  if (!AND.length) {
    delete where.AND;
  }

  return where;
}

function buildOrderBy(args: QueryIntentsArgs) {
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
    const lat = near.lat;
    const lng = near.lng;
    const km = distanceKm;

    const latDelta = km / 111;
    const lonDelta =
      km / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.0001));

    const AND = getAndArray(where);
    AND.push(
      { lat: { gte: lat - latDelta, lte: lat + latDelta } },
      { lng: { gte: lng - lonDelta, lte: lng + lonDelta } }
    );
  }
}

/* ───────────────────────── Status & sorting helpers ───────────────────────── */

/**
 * Applies status filters that can be fully resolved in SQL:
 * - UPCOMING: startAt > NOW (canceledAt/deletedAt already filtered in buildBaseWhere)
 * - ONGOING: startAt <= NOW < endAt (canceledAt/deletedAt already filtered)
 * - PAST: endAt < NOW (canceledAt/deletedAt already filtered)
 * - CANCELED: canceledAt is not null (overrides base filter)
 * - DELETED: deletedAt is not null (overrides base filter)
 * - ANY: no additional filter (base filter still applies)
 *
 * Note: canceledAt/deletedAt filters are handled in buildBaseWhere for most statuses.
 */
function applyStatusWhere(
  where: Prisma.IntentWhereInput,
  status: IntentStatus | null | undefined,
  now: Date
) {
  if (!status || status === IntentStatus.Any) return;

  const AND = getAndArray(where);

  switch (status) {
    case IntentStatus.Upcoming:
      AND.push({ startAt: { gt: now } });
      // canceledAt/deletedAt already null from buildBaseWhere
      break;
    case IntentStatus.Ongoing:
      AND.push({ startAt: { lte: now } }, { endAt: { gt: now } });
      // canceledAt/deletedAt already null from buildBaseWhere
      break;
    case IntentStatus.Past:
      AND.push({ endAt: { lt: now } });
      // canceledAt/deletedAt already null from buildBaseWhere
      break;
    case IntentStatus.Canceled:
      // Override base filter: show ONLY canceled
      // Remove the base canceledAt: null filter
      const andArray = where.AND as Prisma.IntentWhereInput[];
      const canceledIndex = andArray.findIndex(
        (cond) => cond.canceledAt === null
      );
      if (canceledIndex !== -1) {
        andArray.splice(canceledIndex, 1);
      }
      AND.push({ canceledAt: { not: null } });
      break;
    case IntentStatus.Deleted:
      // Override base filter: show ONLY deleted
      // Remove the base deletedAt: null filter
      const andArray2 = where.AND as Prisma.IntentWhereInput[];
      const deletedIndex = andArray2.findIndex(
        (cond) => cond.deletedAt === null
      );
      if (deletedIndex !== -1) {
        andArray2.splice(deletedIndex, 1);
      }
      AND.push({ deletedAt: { not: null } });
      break;
    default:
      // ANY - no status filter
      break;
  }
}

/**
 * Comparator for boost-aware sorting.
 *
 * Behavior:
 * 1. If boostedAt is within last 24h → treat as "active boost"
 *    and sort boosted events first (most recent boost first).
 * 2. Then sort by requested field (startAt / createdAt / updatedAt / membersCount).
 *
 * NOTE: membersCount is not implemented yet (returns 0 to keep existing behavior).
 */
function buildBoostAwareComparator<
  T extends {
    boostedAt: Date | null;
    startAt: Date;
    createdAt: Date;
    updatedAt: Date;
  },
>(args: QueryIntentsArgs, now: Date): (a: T, b: T) => number {
  const dir = args.sortDir === SortDir.Asc ? 1 : -1;
  const boostThreshold = new Date(now.getTime() - BOOST_DURATION_MS);

  return (a, b) => {
    // 1. boost ordering (24h window)
    const aBoostActive = a.boostedAt && a.boostedAt >= boostThreshold;
    const bBoostActive = b.boostedAt && b.boostedAt >= boostThreshold;

    if (aBoostActive && !bBoostActive) return -1;
    if (!aBoostActive && bBoostActive) return 1;

    if (aBoostActive && bBoostActive) {
      const diff = b.boostedAt!.getTime() - a.boostedAt!.getTime();
      if (diff !== 0) return diff;
    }

    // 2. base sort field
    switch (args.sortBy) {
      case IntentsSortBy.StartAt:
        return dir * (a.startAt.getTime() - b.startAt.getTime());
      case IntentsSortBy.CreatedAt:
        return dir * (a.createdAt.getTime() - b.createdAt.getTime());
      case IntentsSortBy.UpdatedAt:
        return dir * (a.updatedAt.getTime() - b.updatedAt.getTime());
      case IntentsSortBy.MembersCount:
        // Keep existing behavior (no membersCount-based sort yet)
        return 0;
      default:
        return dir * (a.startAt.getTime() - b.startAt.getTime());
    }
  };
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

    // Base where/order
    const baseWhere = buildBaseWhere(args);
    applyDistanceBox(baseWhere, args.near ?? null, args.distanceKm ?? null);
    applyStatusWhere(baseWhere, args.status ?? null, now);
    const orderBy = buildOrderBy(args);

    // All statuses are handled in SQL - no post-filtering needed
    const [total, allRows] = await Promise.all([
      prisma.intent.count({ where: baseWhere }),
      prisma.intent.findMany({
        where: baseWhere,
        orderBy,
        include: INTENT_INCLUDE,
        // We fetch `take + skip` so we can apply our in-memory sort and then slice.
        take: take + skip,
        skip: 0,
      }),
    ]);

    const comparator = buildBoostAwareComparator(args, now);
    allRows.sort(comparator);

    // Apply pagination after in-memory sorting
    const paginatedRows = allRows.slice(skip, skip + take);

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
);

export const intentQuery: QueryResolvers['intent'] = resolverWithMetrics(
  'Query',
  'intent',
  async (_p, { id }, { user }) => {
    const userId = user?.id;
    const row = await prisma.intent.findUnique({
      where: { id },
      include: INTENT_INCLUDE,
    });

    return row ? mapIntent(row, userId) : null;
  }
);
