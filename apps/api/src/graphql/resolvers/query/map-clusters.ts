import { Prisma } from '@prisma/client';
import {
  clamp,
  decodeRegion,
  encodeRegion,
  lngLatToTile,
  tileToBBox,
  tileToGeoJsonPolygon,
} from '../../../lib/geo/webmercator';
import { prisma } from '../../../lib/prisma';
import type {
  ClusterFiltersInput,
  QueryResolvers,
} from '../../__generated__/resolvers-types';
import { mapIntent } from '../helpers';

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

/* ───────────────────────────── Types & constants ───────────────────────────── */

type TileAgg = {
  x: number;
  y: number;
  z: number;
  sumLat: number;
  sumLng: number;
  count: number;
  points: Array<{ lat: number; lng: number; id: string }>;
};

const MIN_CLUSTER_SIZE = 1; // tile becomes a cluster from this count
const MAX_REGION_PAGE_SIZE = 50;

/* ───────────────────────────── Helper functions ───────────────────────────── */

/**
 * Very small jitter (~3–5m) for single points to avoid perfect overlap.
 * Deterministic based on lat/lng/salt.
 */
function jitter(lat: number, lng: number, salt: number) {
  const J = 0.00005; // ~5m in degrees (approx)
  const s = Math.sin((lat + lng + salt) * 12.9898) * 43758.5453;
  const r1 = s - Math.floor(s) - 0.5;
  const r2 = s * 1.1337 - Math.floor(s * 1.1337) - 0.5;
  return { lat: lat + r1 * J, lng: lng + r2 * J };
}

/**
 * Build raw SQL WHERE fragments and params for common map filters.
 * This is shared between clusters and regionIntents queries to keep behavior aligned.
 *
 * @param filters Filters object from GraphQL args
 * @param startParamIndex First free $ index in the SQL statement
 */
function buildFilterSql(
  filters: ClusterFiltersInput,
  startParamIndex: number
): {
  whereClause: string;
  params: any[];
  nextParamIndex: number;
} {
  const whereConditions: string[] = [];
  const params: any[] = [];
  let paramIndex = startParamIndex;

  if (!filters) {
    return { whereClause: '', params, nextParamIndex: paramIndex };
  }

  const now = new Date();

  // ─── Default: Hide canceled & deleted (unless explicitly filtering for them) ───
  const status = filters.status;
  const shouldHideCanceledAndDeleted =
    !status || (status !== 'CANCELED' && status !== 'DELETED');

  if (shouldHideCanceledAndDeleted) {
    // These are already in the base WHERE, but we add them here for clarity
    // (they're actually in the main query, not in buildFilterSql)
    // So we don't need to add them again - they're handled in the base query
  }

  // ─── Time Status Filter ───
  if (filters.status) {
    switch (filters.status) {
      case 'UPCOMING':
        whereConditions.push(`i."startAt" > $${paramIndex}`);
        params.push(now);
        paramIndex++;
        // canceledAt/deletedAt already filtered in base query
        break;
      case 'ONGOING':
        whereConditions.push(
          `i."startAt" <= $${paramIndex} AND i."endAt" > $${paramIndex + 1}`
        );
        params.push(now, now);
        paramIndex += 2;
        // canceledAt/deletedAt already filtered in base query
        break;
      case 'PAST':
        whereConditions.push(`i."endAt" < $${paramIndex}`);
        params.push(now);
        paramIndex++;
        // canceledAt/deletedAt already filtered in base query
        break;
      case 'CANCELED':
        // Override base filter: show ONLY canceled
        whereConditions.push(`i."canceledAt" IS NOT NULL`);
        break;
      case 'DELETED':
        // Override base filter: show ONLY deleted
        whereConditions.push(`i."deletedAt" IS NOT NULL`);
        break;
      case 'ANY':
      default:
        // No filter - but canceledAt/deletedAt still null from base query
        break;
    }
  }

  // ─── Date Range Filter (only if status is ANY or not set) ───
  if ((!filters.status || filters.status === 'ANY') && filters.startISO) {
    whereConditions.push(`i."startAt" >= $${paramIndex}`);
    params.push(new Date(filters.startISO));
    paramIndex++;
  }

  if ((!filters.status || filters.status === 'ANY') && filters.endISO) {
    whereConditions.push(`i."endAt" <= $${paramIndex}`);
    params.push(new Date(filters.endISO));
    paramIndex++;
  }

  // ─── Verified Owners ───
  if (filters.verifiedOnly) {
    whereConditions.push(`u."verifiedAt" IS NOT NULL`);
  }

  // ─── Categories ───
  if (filters.categorySlugs?.length) {
    whereConditions.push(
      `EXISTS (
        SELECT 1 FROM "_CategoryToIntent" ci
        INNER JOIN categories c ON c.id = ci."A"
        WHERE ci."B" = i.id AND c.slug = ANY($${paramIndex}::text[])
      )`
    );
    params.push(filters.categorySlugs);
    paramIndex++;
  }

  // ─── Tags ───
  if (filters.tagSlugs?.length) {
    whereConditions.push(
      `EXISTS (
        SELECT 1 FROM "_IntentToTag" it
        INNER JOIN tags t ON t.id = it."A"
        WHERE it."B" = i.id AND t.slug = ANY($${paramIndex}::text[])
      )`
    );
    params.push(filters.tagSlugs);
    paramIndex++;
  }

  // ─── Levels (enum array intersection) ───
  if (filters.levels?.length) {
    whereConditions.push(`i.levels && $${paramIndex}::"Level"[]`);
    params.push(filters.levels);
    paramIndex++;
  }

  // ─── Meeting Kinds (enum array intersection) ───
  if (filters.kinds?.length) {
    whereConditions.push(`i.kinds && $${paramIndex}::"MeetingKind"[]`);
    params.push(filters.kinds);
    paramIndex++;
  }

  // ─── Join Modes (single enum check) ───
  if (filters.joinModes?.length) {
    whereConditions.push(`i."joinMode" = ANY($${paramIndex}::"JoinMode"[])`);
    params.push(filters.joinModes);
    paramIndex++;
  }

  const whereClause =
    whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';

  return { whereClause, params, nextParamIndex: paramIndex };
}

/* ───────────────────────────── Clusters query ───────────────────────────── */

/**
 * Clusters query - returns clustered intent points for a map viewport.
 * Groups intents by WebMercator tile at computed zoom level.
 */
export const clustersQuery: QueryResolvers['clusters'] = async (
  _parent,
  args,
  _ctx
) => {
  const { bbox, zoom, filters } = args;

  // Clustering tuning:
  // Higher Zc => smaller tiles => less aggressive clustering.
  const baseZ = clamp(Math.floor(zoom), 2, 16);
  const Zc = clamp(baseZ + 2, 3, 16);

  // Base params for bbox envelope
  const baseParams = [bbox.swLon, bbox.swLat, bbox.neLon, bbox.neLat];

  // Determine if we should hide canceled/deleted by default
  const status = (filters as ClusterFiltersInput)?.status;
  const shouldHideCanceledAndDeleted =
    !status || (status !== 'CANCELED' && status !== 'DELETED');

  // Build base WHERE conditions for canceled/deleted
  const baseWhereConditions = shouldHideCanceledAndDeleted
    ? `AND i."canceledAt" IS NULL
      AND i."deletedAt" IS NULL`
    : '';

  // Append filters
  const { whereClause, params: filterParams } = buildFilterSql(
    filters as ClusterFiltersInput,
    5
  );

  const rows = await prisma.$queryRawUnsafe<
    { id: string; lat: number; lng: number }[]
  >(
    `
    WITH bbox AS (SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS geom)
    SELECT i.id, i.lat, i.lng
    FROM intents i
    INNER JOIN users u ON u.id = i."ownerId"
    CROSS JOIN bbox
    WHERE i.geom IS NOT NULL
      AND ST_Intersects(i.geom, bbox.geom)
      AND i.visibility = 'PUBLIC'
      ${baseWhereConditions}
      ${whereClause}
    `,
    ...baseParams,
    ...filterParams
  );

  // Group by tile
  const tileMap = new Map<string, TileAgg>();

  for (const row of rows) {
    const { x, y } = lngLatToTile(row.lng, row.lat, Zc);
    const key = `${x}|${y}`;
    let tile = tileMap.get(key);
    if (!tile) {
      tile = { x, y, z: Zc, sumLat: 0, sumLng: 0, count: 0, points: [] };
      tileMap.set(key, tile);
    }
    tile.sumLat += row.lat;
    tile.sumLng += row.lng;
    tile.count++;
    tile.points.push({ lat: row.lat, lng: row.lng, id: row.id });
  }

  // Convert tiles to output clusters
  let autoId = 0;
  const out: Array<{
    id: string;
    latitude: number;
    longitude: number;
    count: number;
    region: string;
    geoJson: any;
  }> = [];

  for (const tile of tileMap.values()) {
    const regionToken = encodeRegion(tile.z, tile.x, tile.y);
    const polygon = tileToGeoJsonPolygon(tile.x, tile.y, tile.z);

    if (tile.count >= MIN_CLUSTER_SIZE) {
      // Cluster: centroid of the points in this tile
      const centroidLat = tile.sumLat / tile.count;
      const centroidLng = tile.sumLng / tile.count;

      out.push({
        id: String(autoId++),
        latitude: centroidLat,
        longitude: centroidLng,
        count: tile.count,
        region: regionToken,
        geoJson: polygon,
      });
    } else {
      // Not enough points → emit single markers with light jitter
      for (const p of tile.points) {
        const j = jitter(p.lat, p.lng, autoId);
        out.push({
          id: String(autoId++),
          latitude: j.lat,
          longitude: j.lng,
          count: 1,
          region: regionToken,
          geoJson: polygon,
        });
      }
    }
  }

  return out;
};

/* ───────────────────────────── RegionIntents query ───────────────────────────── */

/**
 * RegionIntents query - returns paginated intents for a specific map tile region.
 */
export const regionIntentsQuery: QueryResolvers['regionIntents'] = async (
  _parent,
  args,
  _ctx
) => {
  const userId = _ctx.user?.id;

  const { region, page = 1, perPage = 20, filters } = args;

  // Decode region token to tile coordinates
  const { z, x, y } = decodeRegion(region);
  const bbox = tileToBBox(x, y, z);

  // Clamp pagination parameters
  const take = Math.max(1, Math.min(perPage, MAX_REGION_PAGE_SIZE));
  const skip = Math.max(0, (page - 1) * take);

  // Determine if we should hide canceled/deleted by default
  const status = (filters as ClusterFiltersInput)?.status;
  const shouldHideCanceledAndDeleted =
    !status || (status !== 'CANCELED' && status !== 'DELETED');

  // Build base WHERE conditions for canceled/deleted
  const baseWhereConditions = shouldHideCanceledAndDeleted
    ? `AND i."canceledAt" IS NULL
      AND i."deletedAt" IS NULL`
    : '';

  // Build WHERE for items query
  const baseParams: any[] = [
    bbox.swLon,
    bbox.swLat,
    bbox.neLon,
    bbox.neLat,
    take,
    skip,
  ];
  const { whereClause, params: filterParamsForItems } = buildFilterSql(
    filters as ClusterFiltersInput,
    7
  );

  // Items query:
  // Sorting: boosted (<24h) first, then by startAt ascending
  const items = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `
    WITH bbox AS (SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS geom)
    SELECT i.id
    FROM intents i
    INNER JOIN users u ON u.id = i."ownerId"
    CROSS JOIN bbox
    WHERE i.geom IS NOT NULL
      AND ST_Intersects(i.geom, bbox.geom)
      AND i.visibility = 'PUBLIC'
      ${baseWhereConditions}
      ${whereClause}
    ORDER BY 
      CASE 
        WHEN i."boostedAt" IS NOT NULL 
          AND i."boostedAt" >= NOW() - INTERVAL '24 hours' 
        THEN i."boostedAt" 
        ELSE NULL 
      END DESC NULLS LAST,
      i."startAt" ASC
    LIMIT $5 OFFSET $6
    `,
    ...baseParams,
    ...filterParamsForItems
  );

  // Count query: reuse the same filter builder but with a different base param index
  const countBaseParams: any[] = [
    bbox.swLon,
    bbox.swLat,
    bbox.neLon,
    bbox.neLat,
  ];
  const { whereClause: countWhereClause, params: filterParamsForCount } =
    buildFilterSql(filters as ClusterFiltersInput, 5);

  const totalRows = await prisma.$queryRawUnsafe<{ c: number }[]>(
    `
    WITH bbox AS (SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS geom)
    SELECT COUNT(*)::int AS c
    FROM intents i
    INNER JOIN users u ON u.id = i."ownerId"
    CROSS JOIN bbox
    WHERE i.geom IS NOT NULL
      AND ST_Intersects(i.geom, bbox.geom)
      AND i.visibility = 'PUBLIC'
      ${baseWhereConditions}
      ${countWhereClause}
    `,
    ...countBaseParams,
    ...filterParamsForCount
  );
  const total = totalRows[0]?.c ?? 0;

  // Fetch full intent objects using Prisma
  const intentIds = items.map((item) => item.id);

  if (intentIds.length === 0) {
    return {
      data: [],
      meta: {
        page,
        totalItems: total,
        totalPages: 0,
        prevPage: null,
        nextPage: null,
      },
    };
  }

  const intents = await prisma.intent.findMany({
    where: { id: { in: intentIds } },
    include: INTENT_INCLUDE,
    orderBy: [
      { boostedAt: { sort: 'desc', nulls: 'last' } },
      { startAt: 'asc' },
    ],
  });

  // Keep order of ids from raw query
  const byId = new Map(intents.map((i) => [i.id, i]));
  const orderedIntents = intentIds
    .map((id) => byId.get(id))
    .filter((i): i is (typeof intents)[number] => Boolean(i));

  // Pagination metadata
  const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / take));
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = skip + items.length < total ? page + 1 : null;

  return {
    data: orderedIntents.map((i) => mapIntent(i, userId)),
    meta: {
      page,
      totalItems: total,
      totalPages,
      prevPage,
      nextPage,
    },
  };
};
