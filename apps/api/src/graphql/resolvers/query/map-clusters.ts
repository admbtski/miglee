import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import {
  clamp,
  lngLatToTile,
  tileToBBox,
  encodeRegion,
  decodeRegion,
  tileToGeoJsonPolygon,
} from '../../../lib/geo/webmercator';
import { mapIntent } from '../helpers';

/**
 * Clusters query - returns clustered intent points for a map viewport
 * Groups intents by WebMercator tile at computed zoom level
 */
export const clustersQuery: QueryResolvers['clusters'] = async (
  _parent,
  args,
  _ctx
) => {
  const { bbox, zoom, filters } = args;

  // ───────────────── Clustering tuning ─────────────────
  // Wyższy Zc => mniejsze kafelki => mniej agresywne klastrowanie
  // (+1 względem "gołego" zoomu daje subtelne rozrzedzenie)
  const baseZ = clamp(Math.floor(zoom), 2, 16);
  const Zc = clamp(baseZ + 2, 3, 16);

  // kafelek staje się klastrem dopiero od tylu punktów
  const MIN_CLUSTER_SIZE = 1;

  // bardzo mały jitter (ok. 3–5 metrów) dla pojedynczych punktów,
  // żeby markery nie nakładały się idealnie
  const jitter = (lat: number, lng: number, salt: number) => {
    // ~5m w stopniach (zależnie od szer. geogr.; tu prosto i bezpiecznie)
    const J = 0.00005;
    const s = Math.sin((lat + lng + salt) * 12.9898) * 43758.5453;
    const r1 = s - Math.floor(s) - 0.5;
    const r2 = s * 1.1337 - Math.floor(s * 1.1337) - 0.5;
    return { lat: lat + r1 * J, lng: lng + r2 * J };
  };

  // ───────────────── SQL (jak było) ─────────────────
  const whereConditions: string[] = [];
  const params: any[] = [bbox.swLon, bbox.swLat, bbox.neLon, bbox.neLat];
  let paramIndex = 5;

  if (filters?.verifiedOnly) whereConditions.push(`u.verifiedAt IS NOT NULL`);
  if (filters?.categorySlugs?.length) {
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
  if (filters?.levels?.length) {
    whereConditions.push(`i.levels && $${paramIndex}::"Level"[]`);
    params.push(filters.levels);
    paramIndex++;
  }
  const whereClause = whereConditions.length
    ? `AND ${whereConditions.join(' AND ')}`
    : '';

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
      AND i."canceledAt" IS NULL
      AND i."deletedAt" IS NULL
      ${whereClause}
    `,
    ...params
  );

  // ───────────────── Grupowanie po kafelku ─────────────────
  type TileAgg = {
    x: number;
    y: number;
    z: number;
    sumLat: number;
    sumLng: number;
    count: number;
    points: Array<{ lat: number; lng: number; id: string }>;
  };

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

  // ───────────────── Konwersja do wyników ─────────────────
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
    if (tile.count >= MIN_CLUSTER_SIZE) {
      // pełny klaster (centroid kafelka)
      const centroidLat = tile.sumLat / tile.count;
      const centroidLng = tile.sumLng / tile.count;
      out.push({
        id: String(autoId++),
        latitude: centroidLat,
        longitude: centroidLng,
        count: tile.count,
        region: encodeRegion(tile.z, tile.x, tile.y),
        geoJson: tileToGeoJsonPolygon(tile.x, tile.y, tile.z),
      });
    } else {
      // za mało punktów -> pokaż pojedyncze pinezki (count=1) z lekkim jitterem
      for (const p of tile.points) {
        const j = jitter(p.lat, p.lng, autoId);
        out.push({
          id: String(autoId++),
          latitude: j.lat,
          longitude: j.lng,
          count: 1,
          // region: używamy tego samego kafelka (OK dla paginacji regionIntents)
          region: encodeRegion(tile.z, tile.x, tile.y),
          geoJson: tileToGeoJsonPolygon(tile.x, tile.y, tile.z),
        });
      }
    }
  }

  return out;
};

/**
 * RegionIntents query - returns paginated intents for a specific map tile region
 */
export const regionIntentsQuery: QueryResolvers['regionIntents'] = async (
  _parent,
  args,
  _ctx
) => {
  const { region, page = 1, perPage = 20, filters } = args;

  // Decode region token to tile coordinates
  const { z, x, y } = decodeRegion(region);
  const bbox = tileToBBox(x, y, z);

  // Clamp pagination parameters
  const take = Math.max(1, Math.min(perPage, 50));
  const skip = Math.max(0, (page - 1) * take);

  // Build WHERE conditions for filters
  const whereConditions: string[] = [];
  const params: any[] = [
    bbox.swLon,
    bbox.swLat,
    bbox.neLon,
    bbox.neLat,
    take,
    skip,
  ];
  let paramIndex = 7;

  // Filter by verified owners
  if (filters?.verifiedOnly) {
    whereConditions.push(`u.verifiedAt IS NOT NULL`);
  }

  // Filter by categories
  if (filters?.categorySlugs && filters.categorySlugs.length > 0) {
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

  // Filter by levels
  if (filters?.levels && filters.levels.length > 0) {
    whereConditions.push(`i.levels && $${paramIndex}::"Level"[]`);
    params.push(filters.levels);
    paramIndex++;
  }

  const whereClause =
    whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';

  // Query intents in tile region with pagination
  const items = await prisma.$queryRawUnsafe<any[]>(
    `
    WITH bbox AS (SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS geom)
    SELECT i.id
    FROM intents i
    INNER JOIN users u ON u.id = i."ownerId"
    CROSS JOIN bbox
    WHERE i.geom IS NOT NULL
      AND ST_Intersects(i.geom, bbox.geom)
      AND i.visibility = 'PUBLIC'
      AND i."canceledAt" IS NULL
      AND i."deletedAt" IS NULL
      ${whereClause}
    ORDER BY i."startAt" ASC
    LIMIT $5 OFFSET $6
    `,
    ...params
  );

  // Count total intents in region
  const countParams: any[] = [bbox.swLon, bbox.swLat, bbox.neLon, bbox.neLat];
  if (filters?.categorySlugs && filters.categorySlugs.length > 0) {
    countParams.push(filters.categorySlugs);
  }
  if (filters?.levels && filters.levels.length > 0) {
    countParams.push(filters.levels);
  }

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
      AND i."canceledAt" IS NULL
      AND i."deletedAt" IS NULL
      ${whereClause}
    `,
    ...countParams
  );
  const total = totalRows[0]?.c ?? 0;

  // Fetch full intent objects using Prisma
  const intentIds = items.map((item) => item.id);
  const intents = await prisma.intent.findMany({
    where: {
      id: { in: intentIds },
    },
    include: {
      categories: true,
      tags: true,
      members: { include: { user: true, addedBy: true } },
      owner: true,
      canceledBy: true,
      deletedBy: true,
    },
    orderBy: {
      startAt: 'asc',
    },
  });

  // Build pagination metadata
  const totalPages = Math.max(1, Math.ceil(total / take));
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = skip + items.length < total ? page + 1 : null;

  return {
    data: intents.map((i) => mapIntent(i)),
    meta: {
      page,
      totalItems: total,
      totalPages,
      prevPage,
      nextPage,
    },
  };
};
