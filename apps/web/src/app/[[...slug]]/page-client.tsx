'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { EventCard } from './_internal/components/event-card';
import { Footer } from './_internal/components/footer';
import { MapImagePanel } from './_internal/components/map-image-panel';
import { Navbar } from './_internal/components/navbar';
import { SortControl } from './_internal/components/sort-control';

import { FilterModal } from '../components/filter/components/filter-modal';
import { useCommittedMapVisible } from './_internal/hooks/useComittedMapVision';
import { useCommittedFilters } from './_internal/hooks/useCommittedFilters';
import { useCommittedSort } from './_internal/hooks/useCommittedSort';

import {
  GetIntentsQueryVariables,
  IntentMember,
  IntentStatus,
  Visibility,
} from '@/libs/graphql/__generated__/react-query';
import { useGetCategoriesQuery } from '@/hooks/categories';
import { useIntentsQuery } from '@/hooks/intents';

// 👇 import the extracted pieces to inject via Navbar props
import { DesktopSearchBar } from './_internal/components/desktop-search-bar';
import { IconButton } from './_internal/components/icon-button';

const upcomingAfterDefault = new Date().toISOString();

/* ─────────────────────────────── PAGE ───────────────────────────────── */

export function IntentsPage() {
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

  // Final query variables
  const queryVars = useMemo<GetIntentsQueryVariables>(() => {
    return {
      limit: 60,
      offset: 0,
      visibility: Visibility.Public,
      upcomingAfter: startISO ?? upcomingAfterDefault,
      endingBefore: endISO,
      categoryIds: categoryIds ?? [],
      tagIds: tags,
      kinds: kinds.length ? kinds : [],
      levels: levels.length ? levels : [],
      keywords: [],
      status: status !== IntentStatus.Any ? status : IntentStatus.Any,
      verifiedOnly: verifiedOnly || false,
      distanceKm: city ? distanceKm : null,
    };
  }, [
    startISO,
    upcomingAfterDefault,
    endISO,
    categoryIds,
    kinds,
    levels,
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
    placeholderData: (prev) => prev,
  });

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
        searchBar={
          <DesktopSearchBar
            activeFilters={activeFilters}
            q={q}
            city={city}
            distanceKm={distanceKm}
            onOpenFilters={() => setFiltersOpen(true)}
          />
        }
        // Inject a custom mobile search button
        mobileSearchButton={
          <IconButton
            icon={Search}
            label="Search"
            onClick={() => setFiltersOpen(true)}
          />
        }
      />

      <main
        className={`mx-auto grid w-full gap-6 px-4 py-4 ${
          mapVisible
            ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_clamp(360px,36vw,640px)]'
            : 'grid-cols-1'
        }`}
      >
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
                    <b>{intentsData?.intents.length}</b> event
                    {intentsData?.intents.length === 1 ? '' : 's'}
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

          {!isLoading &&
            (!error as any) &&
            intentsData?.intents?.length === 0 && (
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
            className="grid grid-cols-1 gap-6 mt-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`sk-${i}`}
                    className="w-full h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900"
                  />
                ))
              : intentsData?.intents.map((item) => (
                  <EventCard
                    key={item.id}
                    startISO={item.startAt}
                    endISO={item.endAt}
                    avatarUrl={
                      item.owner?.imageUrl ?? 'https://i.pravatar.cc/150?img=12'
                    }
                    organizerName={
                      item.owner?.name ?? item.owner?.email ?? 'Unknown'
                    }
                    description={item.description ?? '-'}
                    address={item.address!}
                    onlineUrl={item.onlineUrl!}
                    joinedCount={item.joinedCount}
                    min={item.min}
                    max={item.max}
                    tags={item.tags.map((t) => t.label)}
                    categories={item.categories.map((c) => c.slug)}
                    verifiedAt={item.owner?.verifiedAt as string}
                    members={item.members as IntentMember[]}
                    onJoin={() => {
                      console.log('join intent', item.id);
                    }}
                  />
                ))}
          </motion.div>
        </motion.section>

        <AnimatePresence>
          {mapVisible && (
            <motion.aside
              className="hidden lg:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
            >
              <div className="sticky top-[var(--nav-h)] -mt-4 h-[calc(100vh-var(--nav-h))]">
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
