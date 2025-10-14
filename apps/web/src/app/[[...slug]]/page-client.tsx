'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Navbar } from './_internal/components/navbar';
import { SortControl, SortKey } from './_internal/components/sort-control';
import { MapImagePanel } from './_internal/components/map-image-panel';
import { Footer } from './_internal/components/footer';
import { EventCard } from './_internal/components/event-card';

import { FilterModal } from '../components/filter/components/filter-modal';
import { useCommittedFilters } from './_internal/hooks/useCommittedFilters';
import { useCommittedSort } from './_internal/hooks/useCommittedSort';
import { useCommittedMapVisible } from './_internal/hooks/useComittedMapVision';

import { useIntentsQuery } from '@/hooks/intents';
import { useGetCategoriesQuery } from '@/hooks/categories';
import {
  IntentStatus,
  GetIntentsQueryVariables,
} from '@/graphql/__generated__/react-query';

/* ───────────────────────────────── cities + utils ────────────────────────── */

type CityName = 'Kraków' | 'Warszawa' | 'Gdańsk' | 'Wrocław' | 'Poznań';

const CITIES = [
  { name: 'Kraków', lat: 50.0647, lon: 19.945 },
  { name: 'Warszawa', lat: 52.2297, lon: 21.0122 },
  { name: 'Gdańsk', lat: 54.352, lon: 18.6466 },
  { name: 'Wrocław', lat: 51.1079, lon: 17.0385 },
  { name: 'Poznań', lat: 52.4064, lon: 16.9252 },
] as const;

type UIItem = {
  id: string;
  title: string;
  startISO: string;
  endISO: string;
  avatarUrl: string;
  organizerName: string;
  description: string;
  location: string;
  joined: number;
  min: number;
  max: number;
  tags: string[];

  city?: CityName;
  lat?: number;
  lon?: number;
  category?: string;
  salaryPLN?: number;
};

/* ───────────── MAPOWANIE API -> EventCard + pola filtrów ───────────── */

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

function mapIntentToItem(i: GqlIntent): UIItem {
  const startISO = String(i.startAt);
  const endISO = String(i.endAt);

  const tagStrings = [
    ...(i.categories?.map((c) => c.slug) ?? []),
    ...(i.tags?.map((t) => t.slug) ?? []),
  ];

  return {
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
    joined: 0,
    min: i.min,
    max: i.max,
    tags: tagStrings,
    // dla filtrów/sorta
    city: extractCityFromAddress(i.address ?? undefined),
    lat: typeof i.lat === 'number' ? i.lat : undefined,
    lon: typeof i.lng === 'number' ? i.lng : undefined,
    category: firstCategorySlug(i),
    salaryPLN: undefined,
  };
}

/* ─────────────────────────────── PAGE ───────────────────────────────── */

export function IntentsPage() {
  const upcomingAfterDefault = useMemo(() => new Date().toISOString(), []);

  // filtry ze stanu URL
  const {
    q,
    city,
    distanceKm,
    startISO,
    endISO,
    status,
    kinds,
    levels,
    verifiedOnly,
    tags,
    keywords,
    categories: categorySlugs,
    apply,
  } = useCommittedFilters();

  const { data: categoriesData } = useGetCategoriesQuery();
  const slugToId = useMemo(() => {
    const map = new Map<string, string>();
    (categoriesData?.categories ?? []).forEach((c) => {
      if (c.slug && c.id) map.set(c.slug, c.id);
    });
    return map;
  }, [categoriesData]);

  const categoryIds = useMemo(() => {
    if (!categorySlugs?.length) return undefined;
    const ids = categorySlugs
      .map((s) => slugToId.get(s))
      .filter((v): v is string => !!v);
    return ids.length ? ids : undefined;
  }, [categorySlugs, slugToId]);

  // scal słowa kluczowe: q + keywords + tags -> keywords (dopóki nie mamy tagIds)
  const mergedKeywords = useMemo(() => {
    const s = new Set<string>();
    if (q?.trim()) s.add(q.trim());
    for (const k of keywords ?? []) if (k?.trim()) s.add(k.trim());
    for (const t of tags ?? []) if (t?.trim()) s.add(t.trim());
    const arr = Array.from(s);
    return arr.length ? arr : undefined;
  }, [q, keywords, tags]);

  // FINALNE ZMIENNE DO ZAPYTANIA (zgodne ze schematem)
  const queryVars = useMemo<GetIntentsQueryVariables>(() => {
    return {
      limit: 60,
      offset: 0,
      visibility: 'PUBLIC',
      upcomingAfter: startISO ?? upcomingAfterDefault,
      endingBefore: endISO ?? undefined,

      categoryIds,
      // tagIds: undefined, // dodasz gdy zintegrujesz slugi tagów -> id
      kinds: kinds.length ? (kinds as any) : undefined,
      levels: levels.length ? (levels as any) : undefined,
      keywords: mergedKeywords,
      status: status !== IntentStatus.Any ? status : undefined,
      verifiedOnly: verifiedOnly || undefined,
      distanceKm: city ? distanceKm : undefined,
    };
  }, [
    startISO,
    upcomingAfterDefault,
    endISO,
    categoryIds,
    kinds,
    levels,
    mergedKeywords,
    status,
    verifiedOnly,
    city,
    distanceKm,
  ]);

  const {
    data: intentsData,
    isLoading,
    isFetching,
    error,
  } = useIntentsQuery(queryVars, {
    enabled: true,
    // przy zmianach filtrów nie miga lista
    placeholderData: (prev) => prev,
  });

  const mapped = useMemo<UIItem[]>(
    () => (intentsData?.intents ?? []).map(mapIntentToItem),
    [intentsData]
  );

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
    if (status && status !== IntentStatus.Any) n++;
    if (kinds.length) n++;
    if (levels.length) n++;
    if (verifiedOnly) n++;
    if (tags.length) n++;
    if (keywords.length) n++;
    if (categorySlugs.length) n++;
    return n;
  }, [
    q,
    city,
    distanceKm,
    startISO,
    endISO,
    status,
    kinds,
    levels,
    verifiedOnly,
    tags,
    keywords,
    categorySlugs,
  ]);

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
                  : error
                    ? 'Failed to load'
                    : `All events in ${city || 'Global'} — `}
                {!isLoading && !error && (
                  <>
                    <b>{mapped.length}</b> event{mapped.length === 1 ? '' : 's'}
                    {isFetching && (
                      <span className="ml-2 opacity-60">updating…</span>
                    )}
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

          {/* Empty / error states */}
          {!isLoading && !error && mapped?.length === 0 && (
            <div className="mt-6 text-sm opacity-70">
              Brak wyników dla wybranych filtrów.
            </div>
          )}
          {error && (
            <div className="mt-6 text-sm text-red-600 dark:text-red-400">
              {(error as any)?.message ?? 'Unknown error'}
            </div>
          )}

          <motion.div
            layout="position"
            className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`sk-${i}`}
                    className="w-full h-48 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse"
                  />
                ))
              : mapped.map((item) => (
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
          initialKinds={kinds}
          initialLevels={levels}
          initialVerifiedOnly={verifiedOnly}
          initialTags={tags}
          initialKeywords={keywords}
          initialCategories={categorySlugs}
          onApply={(next) => {
            apply({
              q: next.q,
              city: next.city,
              distanceKm: next.distanceKm,
              startISO: next.startISO ?? null,
              endISO: next.endISO ?? null,
              status: next.status ?? IntentStatus.Any,
              kinds: next.kinds ?? [],
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
