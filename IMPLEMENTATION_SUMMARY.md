# Implementacja Mapy Eventów z Serwerowym Klastrowaniem

## ✅ Status: Ukończone

Wszystkie komponenty zostały zaimplementowane zgodnie z wymaganiami projektu.

## 📋 Zrealizowane Zadania

### 1. ✅ Migracja PostGIS (Backend)

**Plik**: `apps/api/prisma/migrations/20251104220540_add_postgis_geom/migration.sql`

```sql
-- Włączenie PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Dodanie kolumny geom
ALTER TABLE "intents" ADD COLUMN IF NOT EXISTS geom geography(Point, 4326);

-- Backfill danych z lat/lng
UPDATE "intents" SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
WHERE geom IS NULL AND lat IS NOT NULL AND lng IS NOT NULL;

-- Indeks GIST dla wydajności
CREATE INDEX IF NOT EXISTS "intents_geom_gix" ON "intents" USING GIST (geom);
```

**Trigger** (automatyczna synchronizacja): `20251104220541_add_geom_trigger/migration.sql`

- Automatycznie aktualizuje `geom` przy INSERT/UPDATE `lat`/`lng`
- Zapewnia stałą spójność danych

**Schema Prisma**: `apps/api/prisma/schema.prisma`

- Dodano komentarz dokumentujący kolumnę `geom` (nie jest w modelu, bo Prisma nie wspiera PostGIS)

**Seed**: `apps/api/prisma/seed.ts`

- Funkcja `syncGeomColumn()` synchronizuje `geom` po seedowaniu
- Uruchamiana automatycznie na końcu procesu seed

### 2. ✅ Narzędzia WebMercator (Backend)

**Plik**: `apps/api/src/lib/geo/webmercator.ts`

Funkcje:

- `lngLatToTile(lng, lat, z)` - konwersja współrzędnych do kafelka
- `tileToBBox(x, y, z)` - konwersja kafelka do bbox
- `encodeRegion(z, x, y)` - kodowanie do base64 tokena
- `decodeRegion(token)` - dekodowanie z base64
- `tileToGeoJsonPolygon(x, y, z)` - tworzenie GeoJSON Polygon dla kafelka
- `clamp(n, min, max)` - funkcja pomocnicza

**Testy**: `apps/api/src/lib/geo/webmercator.test.ts`

- Kompletny zestaw testów jednostkowych
- Testy konwersji współrzędnych
- Testy round-trip
- Scenariusze klastrowania

### 3. ✅ Schema GraphQL

**Plik**: `packages/contracts/graphql/schema.graphql`

Nowe typy:

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
  region: String!
  geoJson: JSON!
}

type RegionIntentPage {
  data: [Intent!]!
  meta: PageMeta!
}
```

Nowe zapytania:

```graphql
clusters(bbox: BBoxInput!, zoom: Float!, filters: ClusterFiltersInput): [Cluster!]!
regionIntents(region: String!, page: Int, perPage: Int, filters: ClusterFiltersInput): RegionIntentPage!
```

### 4. ✅ Resolwery GraphQL (Backend)

**Plik**: `apps/api/src/graphql/resolvers/query/map-clusters.ts`

Implementacja:

- `clustersQuery` - zwraca klastery dla widoku mapy
  - Oblicza zoom klastrów: `Zc = clamp(floor(zoom) - 2, 2, 12)`
  - Używa PostGIS `ST_Intersects` dla bbox
  - Grupuje intenty po kafelkach WebMercator
  - Zwraca centroid, liczebność i GeoJSON granicy
- `regionIntentsQuery` - zwraca paginowane intenty dla regionu
  - Dekoduje token regionu
  - Zapytanie intents w bbox kafelka
  - Zwraca pełne obiekty Intent z metadanymi paginacji

**Wydajność**:

- Indeks GIST na `geom` dla szybkich zapytań przestrzennych
- Cel: < 80ms dla ~10k punktów

### 5. ✅ Operacje GraphQL (Frontend)

**Plik**: `packages/contracts/graphql/operations/map-clusters.graphql`

Zapytania:

- `GetClusters` - pobiera klastery dla viewportu
- `GetRegionIntents` - pobiera intenty dla regionu

### 6. ✅ React Query Hooks (Frontend)

**Plik**: `apps/web/src/lib/api/map-clusters.tsx`

Hooki:

- `useGetClustersQuery` - query dla klastrów
  - `staleTime: 15s`
  - `gcTime: 60s`
- `useGetRegionIntentsQuery` - query dla intents w regionie
  - `staleTime: 30s`
  - `gcTime: 120s`
  - `enabled` tylko gdy region jest dostępny

### 7. ✅ Komponent Mapy (Frontend)

**Plik**: `apps/web/src/app/[[...slug]]/_components/intents-map-panel.tsx`

Rozszerzenia:

- Nowy prop `useServerClustering?: boolean`
- Nowy prop `filters?: { categorySlugs, levels, verifiedOnly }`
- Stan śledzący bounds i zoom mapy
- Obsługa zdarzenia `moveend` do aktualizacji klastrów
- Renderowanie klastrów serwerowych jako okręgi MapLibre
- Kliknięcie klastra zoomuje mapę
- Zachowanie kompatybilności wstecznej (domyślnie klastrowanie klienckie)

## 📊 Algorytm Klastrowania

1. **Obliczenie poziomu zoom klastra**:

   ```
   Zc = clamp(floor(mapZoom) - 2, 2, 12)
   ```

2. **Grupowanie po kafelkach**:
   - Każdy intent przypisywany do kafelka (x, y) na poziomie Zc
   - Agregacja per kafelek: liczba, suma lat/lng dla centroidu

3. **Zwracanie wyników**:
   - Centroid: średnia lat/lng wszystkich punktów w kafelku
   - Liczba: ilość intentów w kafelku
   - Region token: `base64(z|x|y)`
   - GeoJSON: Polygon granicy kafelka dla wizualizacji

## 🔧 Konfiguracja

### Backend

**WAŻNE**: Przed uruchomieniem migracji, upewnij się że PostgreSQL ma zainstalowane PostGIS!

Jeśli używasz Docker (plik `docker/docker-compose.dev.yml`):

```bash
# 1. Zmień obraz w docker-compose.dev.yml
# image: postgres:16 → image: postgis/postgis:16-3.4

# 2. Przeładuj kontener
cd docker
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d db
```

Szczegóły w pliku: `POSTGIS_SETUP.md`

Następnie uruchom migracje:

```bash
cd apps/api
pnpm prisma migrate deploy
# lub z czyszczeniem danych:
pnpm prisma migrate reset
```

Wygeneruj typy GraphQL:

```bash
pnpm run gql:gen
```

### Frontend

1. Wygeneruj typy GraphQL:

```bash
cd apps/web
pnpm run gql:gen
```

2. Użycie komponentu:

```tsx
<IntentsMapPanel
  intents={intents}
  useServerClustering={true}
  filters={{
    categorySlugs: ['sport', 'muzyka'],
    levels: ['BEGINNER', 'INTERMEDIATE'],
    verifiedOnly: true,
  }}
  defaultCenter={{ lat: 52.2319, lng: 21.0067 }}
  defaultZoom={12}
  fullHeight={true}
/>
```

## 📁 Struktura Plików

```
apps/api/
├── prisma/migrations/20251104220540_add_postgis_geom/
│   └── migration.sql
├── src/
│   ├── lib/geo/
│   │   ├── webmercator.ts
│   │   └── webmercator.test.ts
│   └── graphql/resolvers/query/
│       └── map-clusters.ts

apps/web/
├── src/
│   ├── lib/api/
│   │   └── map-clusters.tsx
│   └── app/[[...slug]]/_components/
│       └── intents-map-panel.tsx

packages/contracts/graphql/
├── schema.graphql
└── operations/
    └── map-clusters.graphql
```

## ✨ Funkcjonalności

### Backend

- ✅ PostGIS geography dla precyzyjnych obliczeń przestrzennych
- ✅ Indeks GIST dla wydajnych zapytań bbox
- ✅ Klastrowanie po stronie serwera (WebMercator tiles)
- ✅ Filtry: kategorie, poziomy, tylko zweryfikowani
- ✅ Paginacja wyników regionu
- ✅ GraphQL-only API (bez REST)
- ✅ Typy TypeScript wygenerowane

### Frontend

- ✅ React Query z cache (staleTime, gcTime)
- ✅ MapLibre GL rendering
- ✅ Odświeżanie klastrów przy moveend
- ✅ Klikalne klastery (zoom)
- ✅ Dark mode support
- ✅ OSM attribution
- ✅ Kompatybilność wsteczna (opcjonalne klastrowanie serwerowe)

## 🧪 Testowanie

**Testy jednostkowe**: `apps/api/src/lib/geo/webmercator.test.ts`

Uruchomienie (wymaga konfiguracji Jest):

```bash
cd apps/api
pnpm test
```

## 🚀 Wydajność

**Cele**:

- Clusters query: < 80ms dla ~10k punktów w viewport
- Region intents query: < 50ms dla 20 wyników z paginacją

**Optymalizacje**:

- Indeks GIST na kolumnie `geom`
- Minimalne przesyłanie danych (tylko widoczne klastery)
- Cache React Query (15s dla clusters, 30s dla region)
- Efektywna agregacja tile-based

## 📝 Dodatkowe Uwagi

1. **Synchronizacja geom**: ✅ **ZAIMPLEMENTOWANE**
   - Trigger PostgreSQL automatycznie aktualizuje `geom` przy zmianach `lat`/`lng`
   - Funkcja `syncGeomColumn()` w seed.ts dla synchronizacji batch
   - Brak potrzeby ręcznej aktualizacji w kodzie aplikacji

2. **Skalowanie**: Przy bardzo dużej liczbie punktów można rozważyć:
   - Materialized views dla popularnych region
   - Redis cache dla bbox
   - Mapbox Vector Tiles (MVT)

3. **Region Intents Panel**: Obecnie kliknięcie w klaster tylko zoomuje. Można dodać:
   - Panel z listą eventów
   - Użycie `useGetRegionIntentsQuery`
   - Paginacja przez liny

## 🎯 Zgodność z Wymaganiami

- ✅ Fastify + Mercurius GraphQL + Prisma/PostgreSQL + PostGIS
- ✅ Next.js + React Query + MapLibre GL + Tailwind + Framer Motion
- ✅ Serwerowe klastrowanie po viewport i region token
- ✅ GraphQL-only (bez REST)
- ✅ Zgodność z istniejącymi wzorcami projektu
- ✅ Klucze React Query zgodne z konwencją
- ✅ Struktura plików zachowana
- ✅ TypeScript strict
- ✅ Testy jednostkowe utils
- ✅ Dark mode
- ✅ Atrybucja OSM/MapLibre

## 📚 Dokumentacja

Szczegółowa dokumentacja: `MAP_CLUSTERING_IMPLEMENTATION.md`
