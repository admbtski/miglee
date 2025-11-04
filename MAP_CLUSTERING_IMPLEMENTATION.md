# Map Clustering Implementation

This document describes the server-side map clustering feature implemented for the Miglee project.

## Overview

The implementation provides server-side clustering of map intents using PostGIS and WebMercator tile-based aggregation. This approach scales better than client-side clustering for large datasets and provides consistent clustering across different zoom levels.

## Architecture

### Backend (Fastify + Mercurius GraphQL + Prisma + PostGIS)

#### 1. Database Layer

**Migration**: `apps/api/prisma/migrations/20251104220540_add_postgis_geom/migration.sql`

- Enables PostGIS extension
- Adds `geom` column (`geography(Point, 4326)`) to `intents` table
- Backfills `geom` from existing `lat`/`lng` columns
- Creates GIST spatial index on `geom` for fast queries

**Trigger**: `apps/api/prisma/migrations/20251104220541_add_geom_trigger/migration.sql`

- Automatically updates `geom` column when `lat`/`lng` changes
- Handles INSERT and UPDATE operations
- Sets `geom` to NULL when coordinates are missing

**Note**: The `geom` column is managed via SQL and is not included in `schema.prisma` as Prisma doesn't natively support PostGIS geography types. However, it's documented in the schema with a comment for reference.

**Seed**: The `seed.ts` file includes `syncGeomColumn()` function that ensures all seeded intents have their `geom` column populated.

#### 2. Utility Layer

**File**: `apps/api/src/lib/geo/webmercator.ts`

Core utilities for WebMercator tile calculations:

- `lngLatToTile(lng, lat, z)` - Converts coordinates to tile coordinates
- `tileToBBox(x, y, z)` - Converts tile to bounding box
- `encodeRegion(z, x, y)` - Encodes tile coords to base64 token
- `decodeRegion(token)` - Decodes region token back to coords
- `tileToGeoJsonPolygon(x, y, z)` - Creates GeoJSON polygon for tile
- `clamp(n, min, max)` - Utility for clamping values

**Tests**: `apps/api/src/lib/geo/webmercator.test.ts`

Comprehensive test suite covering:

- Coordinate conversions
- Round-trip conversions
- Region encoding/decoding
- Clustering scenarios

#### 3. GraphQL Layer

**Schema**: `packages/contracts/graphql/schema.graphql`

New types:

```graphql
input BBoxInput {
  swLat: Float!
  swLon: Float!
  neLat: Float!
  neLon: Float!
}

input ClusterFiltersInput {
  categorySlugs: [String!]
  levels: [Level!]
  verifiedOnly: Boolean
}

type Cluster {
  id: ID!
  latitude: Float!
  longitude: Float!
  count: Int!
  region: String! # base64 encoded tile token
  geoJson: JSON! # Polygon boundary of the tile
}

type RegionIntentPage {
  data: [Intent!]!
  meta: PageMeta!
}
```

New queries:

```graphql
clusters(bbox: BBoxInput!, zoom: Float!, filters: ClusterFiltersInput): [Cluster!]!
regionIntents(region: String!, page: Int, perPage: Int, filters: ClusterFiltersInput): RegionIntentPage!
```

**Resolvers**: `apps/api/src/graphql/resolvers/query/map-clusters.ts`

- `clustersQuery` - Returns clustered points for viewport
  - Computes cluster zoom: `Zc = clamp(floor(zoom) - 2, 2, 12)`
  - Uses PostGIS `ST_Intersects` for bbox filtering
  - Groups intents by WebMercator tile
  - Returns centroid, count, and tile boundary GeoJSON

- `regionIntentsQuery` - Returns paginated intents for a specific tile
  - Decodes region token to tile coordinates
  - Queries intents within tile bbox
  - Returns full intent objects with pagination metadata

**Performance**: Optimized with:

- PostGIS GIST index on `geom`
- Efficient tile-based aggregation
- Minimal data transfer (only visible clusters)
- Target: < 80ms for ~10k points

### Frontend (Next.js + React Query + MapLibre GL)

#### 1. GraphQL Operations

**File**: `packages/contracts/graphql/operations/map-clusters.graphql`

- `GetClusters` query
- `GetRegionIntents` query

#### 2. React Query Hooks

**File**: `apps/web/src/lib/api/map-clusters.tsx`

- `useGetClustersQuery` - Fetches clusters for viewport
  - `staleTime: 15s`
  - `gcTime: 60s`
- `useGetRegionIntentsQuery` - Fetches intents for region
  - `staleTime: 30s`
  - `gcTime: 120s`

#### 3. Map Component

**File**: `apps/web/src/app/[[...slug]]/_components/intents-map-panel.tsx`

Enhanced `IntentsMapPanel` component with:

**New Props**:

- `useServerClustering?: boolean` - Enable server-side clustering
- `filters?: { categorySlugs, levels, verifiedOnly }` - Clustering filters

**Features**:

- Tracks map bounds and zoom state
- Calls `useGetClustersQuery` on `moveend` event
- Renders server clusters as MapLibre circles with count labels
- Click handler to zoom into clusters
- Maintains existing client-side clustering when `useServerClustering=false`
- Dark mode support
- OSM attribution

## Usage

### Backend

1. Run migration:

```bash
cd apps/api
pnpm prisma migrate deploy
```

2. Regenerate GraphQL types:

```bash
pnpm run gql:gen
```

### Frontend

1. Regenerate GraphQL types:

```bash
cd apps/web
pnpm run gql:gen
```

2. Use the component:

```tsx
<IntentsMapPanel
  intents={intents}
  useServerClustering={true}
  filters={{
    categorySlugs: ['sports', 'music'],
    levels: ['BEGINNER', 'INTERMEDIATE'],
    verifiedOnly: true,
  }}
  defaultCenter={{ lat: 52.2319, lng: 21.0067 }}
  defaultZoom={12}
  fullHeight={true}
/>
```

## Configuration

### Cluster Zoom Calculation

The cluster zoom level is calculated as:

```
Zc = clamp(floor(mapZoom) - 2, 2, 12)
```

This means:

- At map zoom 4-5: cluster at zoom 2
- At map zoom 6-7: cluster at zoom 4
- At map zoom 14+: cluster at zoom 12 (max detail)

### Performance Tuning

Backend (in resolvers):

- Adjust `Zc` calculation for different clustering density
- Add Redis caching for frequently accessed bboxes
- Tune GIST index parameters if needed

Frontend (in hooks):

- Adjust `staleTime` and `gcTime` for cache duration
- Debounce map movement for fewer queries
- Add loading indicators

## Testing

Run backend tests:

```bash
cd apps/api
pnpm test src/lib/geo/webmercator.test.ts
```

## Future Enhancements

1. **Region Intent Details Panel**: Add UI to show paginated list of intents in clicked cluster
2. **Heatmap Layer**: Add density heatmap for very dense areas
3. **Cluster Expansion**: Use `regionIntents` query to show list on cluster click
4. **Cache Layer**: Add Redis caching for popular bboxes
5. **MVT Tiles**: Consider using Mapbox Vector Tiles for even better performance
6. **Adaptive Clustering**: Dynamically adjust Zc based on point density

## Performance Benchmarks

Target performance (with GIST index):

- Clusters query: < 80ms for ~10k points in viewport
- Region intents query: < 50ms for 20 results with pagination

## Dependencies

Backend:

- `postgis` (PostgreSQL extension)
- `@prisma/client`
- `mercurius` (GraphQL)

Frontend:

- `maplibre-gl`
- `@tanstack/react-query`
- `graphql-request`

## Notes

- The `geom` column is **automatically synchronized** with `lat`/`lng` via PostgreSQL trigger
- The trigger runs on INSERT and UPDATE of `lat` or `lng` columns
- The seed script includes a `syncGeomColumn()` function for batch updates
- The clustering is deterministic based on tile boundaries
- Dark mode styling is supported via Tailwind classes
