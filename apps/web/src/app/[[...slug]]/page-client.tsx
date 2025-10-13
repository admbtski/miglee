'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from './_internal/components/navbar';
import { SortControl, SortKey } from './_internal/components/sort-control';
import { MapImagePanel } from './_internal/components/map-image-panel';
import { Footer } from './_internal/components/footer';
import { FilterModal } from '../components/filter/components/filter-modal';
import { EventCard } from './_internal/components/event-card';

import { useCommittedFilters } from './_internal/hooks/useCommittedFilters';
import { useCommittedSort } from './_internal/hooks/useCommittedSort';
import { useCommittedMapVisible } from './_internal/hooks/useComittedMapVision';

import { useIntentsQuery } from '@/hooks/intents';
import { useGetCategoriesQuery } from '@/hooks/categories';

type CityName = 'Kraków' | 'Warszawa' | 'Gdańsk' | 'Wrocław' | 'Poznań';
const CITIES = [
  { name: 'Kraków', lat: 50.0647, lon: 19.945 },
  { name: 'Warszawa', lat: 52.2297, lon: 21.0122 },
  { name: 'Gdańsk', lat: 54.352, lon: 18.6466 },
  { name: 'Wrocław', lat: 51.1079, lon: 17.0385 },
  { name: 'Poznań', lat: 52.4064, lon: 16.9252 },
] as const;
const CITY_BY_NAME: Record<
  string,
  { name: CityName; lat: number; lon: number }
> = Object.fromEntries(CITIES.map((c) => [c.name, c])) as any;

/* ---------------- utils ---------------- */

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

type FilterDraft = {
  q: string;
  city: string | null;
  distanceKm: number;
  startISO: string | null;
  endISO: string | null;
  status: 'any' | 'ongoing' | 'started' | 'full' | 'locked' | 'available';
  types: Array<'remote' | 'hybrid' | 'public'>;
  levels: Array<'beginner' | 'intermediate' | 'advanced'>;
  verifiedOnly: boolean;
  tags: string[];
  keywords: string[];
  categories: string[];
};

// status na podstawie czasów + pojemności (dla API nie mamy “joined” – trzymamy 0)
function calcStatus(
  it: any
): 'ongoing' | 'started' | 'full' | 'locked' | 'available' {
  const now = Date.now();
  const s = +new Date(it.startISO);
  const e = +new Date(it.endISO);
  const full = (it.joined ?? 0) >= (it.max ?? Infinity);
  if (full) return 'full';
  if (now >= s && now <= e) return 'ongoing';
  if (s - now <= 6 * 60 * 60 * 1000 && s - now > 0) return 'locked';
  if (now > s) return 'started';
  return 'available';
}

// dopasowanie filtrów, z opcjonalnością (jeśli obiekty nie mają danego pola, filtr jest “łagodny”)
function matchesFilters(item: any, d: FilterDraft): boolean {
  const {
    q,
    city,
    distanceKm,
    startISO,
    endISO,
    status,
    types,
    levels,
    verifiedOnly,
    tags,
    keywords,
    categories,
  } = d;

  // text & keywords
  if (q || (keywords && keywords.length)) {
    const hay =
      `${item.title ?? ''} ${item.city ?? ''} ${item.category ?? ''} ${(item.tags || []).join(' ')}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (
      keywords?.length &&
      !keywords.every((kw) => hay.includes(kw.toLowerCase()))
    )
      return false;
  }

  // category (OR)
  if (categories?.length) {
    if (
      !categories.some((c) =>
        String(item.category ?? '')
          .toLowerCase()
          .includes(c.toLowerCase())
      )
    )
      return false;
  }

  // tags (AND)
  if (tags?.length) {
    const itTags = (item.tags || []).map((t: string) => t.toLowerCase());
    if (!tags.every((t) => itTags.includes(t.toLowerCase()))) return false;
  }

  // date range
  if (startISO && +new Date(item.endISO) < +new Date(startISO)) return false;
  if (endISO && +new Date(item.startISO) > +new Date(endISO)) return false;

  // status
  if (status && status !== 'any') {
    if (calcStatus(item) !== status) return false;
  }

  // types / levels – w danych z API nie mamy, więc jeśli filtr wymaga, odrzucamy
  if (types?.length) return false;
  if (levels?.length) return false;

  // verified – brak pojęcia w naszych danych; jeśli wymagany, odrzucamy
  if (verifiedOnly) return false;

  // city + radius (działa tylko jeśli znamy i bazową lokalizację i item.lat/lon)
  if (city) {
    const base = CITY_BY_NAME[city];
    if (!base) return false;

    // jeżeli item nie ma miasta – spróbuj wywnioskować z address
    if (item.city && item.city !== city) return false;

    if (typeof item.lat === 'number' && typeof item.lon === 'number') {
      const dKm = haversineKm(base.lat, base.lon, item.lat, item.lon);
      if (dKm > distanceKm) return false;
    } else {
      // brak współrzędnych – łagodnie: jeśli filtr wymaga dystansu, przepuszczamy (nie blokujemy)
    }
  }

  return true;
}

function sortItems(items: any[], sort: SortKey): any[] {
  if (sort === 'latest')
    return [...items].sort(
      (a, b) => +new Date(b.startISO) - +new Date(a.startISO)
    );
  if (sort === 'salary_desc')
    return [...items].sort((a, b) => (b.salaryPLN ?? 0) - (a.salaryPLN ?? 0));
  if (sort === 'salary_asc')
    return [...items].sort(
      (a, b) => (a.salaryPLN ?? Infinity) - (b.salaryPLN ?? Infinity)
    );
  return items;
}

/* ------------- MAPOWANIE API -> EventCard + pola filtrów ------------- */

type GqlIntent = NonNullable<
  NonNullable<ReturnType<typeof useIntentsQuery>['data']>['intents']
>[number];

function firstCategorySlug(i: GqlIntent): string | undefined {
  return i.categories?.[0]?.slug;
}

function extractCityFromAddress(address?: string | null): CityName | undefined {
  if (!address) return;
  const part = address.split(',')[1]?.trim() || address.split(',')[0]?.trim();
  const match = CITIES.find((c) =>
    part?.toLowerCase().includes(c.name.toLowerCase())
  );
  return match?.name;
}

function mapIntentToItem(i: GqlIntent) {
  const startISO = String(i.startAt);
  const endISO = String(i.endAt);

  return {
    // dla EventCard
    id: i.id,
    title: i.title,
    startISO,
    endISO,
    avatarUrl: i.author?.imageUrl ?? 'https://i.pravatar.cc/150?img=12',
    organizerName: i.author?.name ?? i.author?.email ?? 'Unknown',
    description: i.description ?? '—',
    location:
      i.meetingKind === 'ONLINE'
        ? (i.onlineUrl ?? 'Online')
        : (i.address ?? 'TBA'),
    joined: 0, // brak w API – można podmienić gdy będzie liczba zapisanych
    min: i.min,
    max: i.max,
    tags: i.categories?.map((c) => c.slug) ?? [],

    // dla filtrów/sorta
    city: extractCityFromAddress(i.address),
    lat: typeof i.lat === 'number' ? i.lat : undefined,
    lon: typeof i.lng === 'number' ? i.lng : undefined,
    category: firstCategorySlug(i),
    salaryPLN: undefined, // brak w API
  };
}

/* ------------------- PAGE ------------------- */

export function IntentsPage() {
  const upcomingAfter = useMemo(() => new Date().toISOString(), []);
  const intentsVars = useMemo(
    () => ({
      limit: 60,
      upcomingAfter,
    }),
    [upcomingAfter]
  );

  // i użycie:
  const { data: intentsData, isLoading } = useIntentsQuery(intentsVars);

  // opcjonalnie – żeby mieć dane pod filtry/sugestie
  useGetCategoriesQuery();

  const mapped = useMemo(
    () => (intentsData?.intents ?? []).map(mapIntentToItem),
    [intentsData]
  );

  // Filtry / sort / mapa
  const {
    q,
    city,
    distanceKm,
    startISO,
    endISO,
    status,
    types,
    levels,
    verifiedOnly,
    tags,
    keywords,
    categories,
    apply,
  } = useCommittedFilters();

  const { sort, setSort } = useCommittedSort();
  const { mapVisible, toggle: toggleMap } = useCommittedMapVisible();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilters = useMemo(() => {
    let n = 0;
    if (q) n++;
    if (city) n++;
    if (distanceKm !== 30) n++;
    if (startISO) n++;
    if (endISO) n++;
    if (status && status !== 'any') n++;
    if (types.length) n++;
    if (levels.length) n++;
    if (verifiedOnly) n++;
    if (tags.length) n++;
    if (keywords.length) n++;
    if (categories.length) n++;
    return n;
  }, [
    q,
    city,
    distanceKm,
    startISO,
    endISO,
    status,
    types,
    levels,
    verifiedOnly,
    tags,
    keywords,
    categories,
  ]);

  const filtered = useMemo(
    () =>
      mapped.filter((it) =>
        matchesFilters(it, {
          q,
          city,
          distanceKm,
          startISO,
          endISO,
          status,
          types,
          levels,
          verifiedOnly,
          tags,
          keywords,
          categories,
        })
      ),
    [
      mapped,
      q,
      city,
      distanceKm,
      startISO,
      endISO,
      status,
      types,
      levels,
      verifiedOnly,
      tags,
      keywords,
      categories,
    ]
  );

  const sorted = useMemo(() => sortItems(filtered, sort), [filtered, sort]);

  const NAV_H = 86;

  return (
    <div
      className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
      style={{ ['--nav-h' as any]: `${NAV_H}px` }}
    >
      <Navbar
        q={q}
        city={city}
        distanceKm={distanceKm}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilters={activeFilters}
      />

      <main
        className={`mx-auto grid w-full gap-6 px-4 py-4 ${
          mapVisible
            ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_clamp(360px,36vw,640px)]'
            : 'grid-cols-1'
        }`}
      >
        {/* LEFT */}
        <motion.section layout="position" className="min-w-0">
          <div className="sticky z-30 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="flex items-center justify-between py-2 text-sm">
              <div className="opacity-70">
                {isLoading
                  ? 'Loading…'
                  : `All events in ${city || 'Global'} — `}
                {!isLoading && (
                  <>
                    <b>{sorted.length}</b> event{sorted.length === 1 ? '' : 's'}
                  </>
                )}
              </div>
              <SortControl
                value={sort}
                onChange={setSort}
                withMapToggle
                mapEnabled={mapVisible}
                onToggleMap={toggleMap}
              />
            </div>
          </div>

          <motion.div
            layout="position"
            className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
          >
            {sorted.map((item) => (
              <EventCard
                key={item.id}
                startISO={item.startISO}
                endISO={item.endISO}
                avatarUrl={item.avatarUrl}
                organizerName={item.organizerName}
                description={item.title}
                location={item.location}
                joined={item.joined}
                min={item.min}
                max={item.max}
                tags={item.tags}
                onJoin={() => {
                  // TODO: akcja join – np. mutate / open modal
                  console.log('join intent', item.id);
                }}
              />
            ))}
          </motion.div>
        </motion.section>

        {/* RIGHT MAP */}
        <AnimatePresence>
          {mapVisible && (
            <motion.aside
              className="hidden lg:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
            >
              <div className="sticky top-[var(--nav-h)] h-[calc(100vh-var(--nav-h))] -mt-4">
                <MapImagePanel label={city || 'Polska'} fullHeight />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="col-span-full">
          <Footer />
        </div>
      </main>

      {filtersOpen && (
        <FilterModal
          initialQ={q}
          initialCity={city}
          initialDistanceKm={distanceKm}
          initialStartISO={startISO}
          initialEndISO={endISO}
          initialStatus={status}
          initialTypes={types}
          initialLevels={levels}
          initialVerifiedOnly={verifiedOnly}
          initialTags={tags}
          initialKeywords={keywords}
          initialCategories={categories}
          onApply={(next) => {
            apply({
              q: next.q,
              city: next.city,
              distanceKm: next.distanceKm,
              startISO: next.startISO ?? null,
              endISO: next.endISO ?? null,
              status: next.status ?? 'any',
              types: next.types ?? [],
              levels: next.levels ?? [],
              verifiedOnly: !!next.verifiedOnly,
              tags: next.tags ?? [],
              keywords: next.keywords ?? [],
              categories: next.categories ?? [],
            });
            setFiltersOpen(false);
          }}
          onClose={() => setFiltersOpen(false)}
        />
      )}
    </div>
  );
}
