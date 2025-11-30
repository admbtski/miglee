/**
 * Main client component for the intents search page
 * Handles filters, sorting, map visibility, and infinite scroll
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';

import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { IntentStatus } from '@/lib/api/__generated__/react-query-update';
import { useMeQuery } from '@/lib/api/auth';
import { useIntentsInfiniteQuery } from '@/lib/api/intents';
import { appLanguage } from '@/lib/config/language';
import { INTENTS_CONFIG } from '@/lib/constants/intents';
import { buildGridCols } from '@/lib/utils/intents';
import type { IntentListItem } from '@/types/intent';

import { DesktopSearchBar } from './_components/desktop-search-bar';
import { EventsGridVirtualized } from './_components/events-list/events-grid-virtualized';
import { EventsHeader } from './_components/events-list/events-header';
import type { CommittedFilters } from './_types';
import { useActiveFiltersCount } from './_hooks/use-active-filters-count';
import { useCommittedFilters } from './_hooks/use-committed-filters';
import { useCommittedMapVisible } from './_hooks/use-committed-map-vision';
import { useCommittedSort } from './_hooks/use-committed-sort';
import { useDebouncedHover } from './_hooks/use-debounced-hover';
import { useIntentsQueryVariables } from './_hooks/use-intents-query-variables';
import { useLocationMode } from './_hooks/use-location-mode';

const ServerClusteredMap = lazy(
  () =>
    // @ts-expect-error - Dynamic import with moduleResolution node16
    import('./_components/server-clustered-map')
);

const FilterModal = lazy(
  () =>
    // @ts-expect-error - Dynamic import with moduleResolution node16
    import('./_components/filter-modal')
);

/**
 * Main page component for browsing intents
 */
export function IntentsPage() {
  const filters = useCommittedFilters();
  const { q, city, distanceKm, apply } = filters;

  const { sort, setSort, sortVars } = useCommittedSort();
  const { mapVisible, toggle: toggleMap } = useCommittedMapVisible();
  const activeFilters = useActiveFiltersCount(filters);
  const [hoveredIntent, handleIntentHover] = useDebouncedHover();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: meData } = useMeQuery({ retry: false });
  const userProfile = meData?.me?.profile;

  const { locationMode, mapCenter } = useLocationMode({
    city: filters.city,
    cityLat: filters.cityLat,
    cityLng: filters.cityLng,
    userHomeLat: userProfile?.homeLat ?? null,
    userHomeLng: userProfile?.homeLng ?? null,
  });

  const variables = useIntentsQueryVariables({
    filters,
    locationMode,
    sortVars,
  });

  const {
    data,
    error,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useIntentsInfiniteQuery(variables, {
    enabled: true,
  });

  const pages = data?.pages ?? [];
  const flatItems = useMemo(
    () => pages.flatMap((page) => page.intents.items),
    [pages]
  );
  const total = pages[0]?.intents.pageInfo.total ?? flatItems.length;
  const loadedCount = flatItems.length;

  const gridCols = buildGridCols(mapVisible);

  const handleOpenFilters = useCallback(() => setFiltersOpen(true), []);
  const handleCloseFilters = useCallback(() => setFiltersOpen(false), []);

  const handleApplyFilters = useCallback(
    (nextFilters: Partial<CommittedFilters>) => {
      const normalizedFilters: CommittedFilters = {
        q: nextFilters.q ?? '',
        city: nextFilters.city ?? null,
        cityLat: nextFilters.cityLat ?? null,
        cityLng: nextFilters.cityLng ?? null,
        cityPlaceId: nextFilters.cityPlaceId ?? null,
        distanceKm: nextFilters.distanceKm ?? filters.distanceKm,
        startISO: nextFilters.startISO ?? null,
        endISO: nextFilters.endISO ?? null,
        status: nextFilters.status ?? IntentStatus.Any,
        kinds: nextFilters.kinds ?? [],
        levels: nextFilters.levels ?? [],
        verifiedOnly: nextFilters.verifiedOnly ?? false,
        tags: nextFilters.tags ?? [],
        keywords: nextFilters.keywords ?? [],
        categories: nextFilters.categories ?? [],
        joinModes: nextFilters.joinModes ?? [],
      };
      apply(normalizedFilters);
      setFiltersOpen(false);
    },
    [apply, filters.distanceKm]
  );

  return (
    <ErrorBoundary>
      <div
        className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
        style={{ ['--nav-h' as string]: `${INTENTS_CONFIG.NAV_HEIGHT}px` }}
      >
        <Navbar
          searchBar={
            <DesktopSearchBar
              activeFilters={activeFilters}
              q={q}
              city={city}
              distanceKm={distanceKm}
              onOpenFilters={handleOpenFilters}
            />
          }
          mobileSearchButton={
            <MobileSearchButton onClick={handleOpenFilters} />
          }
        />

        <main className={`mx-auto grid w-full gap-6 px-4 py-4 ${gridCols}`}>
          <motion.section layout="position" className="min-w-0">
            <EventsHeader
              isLoading={isLoading}
              hasError={Boolean(error)}
              city={city}
              loadedCount={loadedCount}
              total={total}
              isFetching={isFetching}
              mapVisible={mapVisible}
              sort={sort}
              onToggleMap={toggleMap}
              onSortChange={setSort}
            />

            <ErrorBoundary>
              <EventsGridVirtualized
                items={flatItems as unknown as IntentListItem[]}
                isLoading={isLoading}
                error={error ?? null}
                hasNextPage={Boolean(hasNextPage)}
                isFetchingNextPage={isFetchingNextPage}
                lang={appLanguage}
                onLoadMore={fetchNextPage}
                onHover={handleIntentHover}
              />
            </ErrorBoundary>
          </motion.section>

          <AnimatePresence>
            {mapVisible && (
              <MapSidebar
                filters={filters}
                hoveredIntent={hoveredIntent}
                mapCenter={mapCenter}
                locationMode={locationMode}
              />
            )}
          </AnimatePresence>

          <div className="col-span-full">
            <Footer />
          </div>
        </main>

        {filtersOpen && (
          <FilterModalSuspense
            filters={filters}
            onApply={handleApplyFilters}
            onClose={handleCloseFilters}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

function MobileSearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Search"
      aria-label="Search"
      className="cursor-pointer rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      <Search className="w-5 h-5" />
    </button>
  );
}

type MapSidebarProps = {
  filters: CommittedFilters;
  hoveredIntent: { id: string; lat: number | null; lng: number | null } | null;
  mapCenter: { lat: number; lng: number } | null;
  locationMode: 'EXPLICIT' | 'PROFILE_DEFAULT' | 'NONE';
};

function MapSidebar({
  filters,
  hoveredIntent,
  mapCenter,
  locationMode,
}: MapSidebarProps) {
  const handleIntentClick = useCallback((intentId: string) => {
    window.location.href = `/${intentId}`;
  }, []);

  return (
    <motion.aside
      className="hidden md:block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
    >
      <div className="sticky top-[var(--nav-h)] -mt-4 h-[calc(100vh-var(--nav-h))]">
        <ErrorBoundary>
          <Suspense fallback={<MapLoadingFallback />}>
            <ServerClusteredMap
              fullHeight={true}
              lang={appLanguage}
              filters={{
                categorySlugs: filters.categories,
                tagSlugs: filters.tags,
                levels: filters.levels as any,
                kinds: filters.kinds as any,
                joinModes: filters.joinModes as any,
                verifiedOnly: filters.verifiedOnly,
                status: filters.status as any,
                startISO: filters.startISO ?? undefined,
                endISO: filters.endISO ?? undefined,
              }}
              onIntentClick={handleIntentClick}
              hoveredIntentId={hoveredIntent?.id ?? null}
              hoveredLat={hoveredIntent?.lat ?? null}
              hoveredLng={hoveredIntent?.lng ?? null}
              centerOn={mapCenter}
              locationMode={locationMode}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
    </motion.aside>
  );
}

function MapLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl">
      <div className="text-sm text-zinc-500">Ładowanie mapy...</div>
    </div>
  );
}

type FilterModalSuspenseProps = {
  filters: CommittedFilters;
  onApply: (filters: Partial<CommittedFilters>) => void;
  onClose: () => void;
};

function FilterModalSuspense({
  filters,
  onApply,
  onClose,
}: FilterModalSuspenseProps) {
  return (
    <Suspense fallback={<FilterModalLoadingFallback />}>
      <FilterModal
        initialQ={filters.q}
        initialCity={filters.city}
        initialCityLat={filters.cityLat}
        initialCityLng={filters.cityLng}
        initialCityPlaceId={filters.cityPlaceId}
        initialDistanceKm={filters.distanceKm}
        initialStartISO={filters.startISO}
        initialEndISO={filters.endISO}
        initialStatus={filters.status}
        initialKinds={filters.kinds}
        initialLevels={filters.levels}
        initialVerifiedOnly={filters.verifiedOnly}
        initialTags={filters.tags}
        initialKeywords={filters.keywords}
        initialCategories={filters.categories}
        initialJoinModes={filters.joinModes}
        onApply={onApply}
        onClose={onClose}
      />
    </Suspense>
  );
}

function FilterModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="text-white">Ładowanie filtrów...</div>
    </div>
  );
}
