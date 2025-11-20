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
import { useActiveFiltersCount } from './_hooks/use-active-filters-count';
import { useCommittedFilters } from './_hooks/use-committed-filters';
import { useCommittedMapVisible } from './_hooks/use-committed-map-vision';
import { useCommittedSort } from './_hooks/use-committed-sort';
import { useDebouncedHover } from './_hooks/use-debounced-hover';
import { useIntentsQueryVariables } from './_hooks/use-intents-query-variables';
import { useLocationMode } from './_hooks/use-location-mode';

// Lazy load heavy components for better performance
const ServerClusteredMap = lazy(
  () =>
    // @ts-expect-error - Dynamic import with moduleResolution node16
    import('./_components/server-clustered-map')
);

const FilterModalRefactored = lazy(
  () =>
    // @ts-expect-error - Dynamic import with moduleResolution node16
    import('./_components/filter-modal-refactored')
);

/**
 * Main page component for browsing intents
 */
export function IntentsPage() {
  // Get filter state from URL
  const filters = useCommittedFilters();
  const { q, city, distanceKm, apply } = filters;

  // Get sort state from URL
  const { sort, setSort, sortVars } = useCommittedSort();

  // Get map visibility state from URL
  const { mapVisible, toggle: toggleMap } = useCommittedMapVisible();

  // Calculate active filters count for UI
  const activeFilters = useActiveFiltersCount(filters);

  // Track hovered intent for map highlighting
  const [hoveredIntent, handleIntentHover] = useDebouncedHover();

  // Filter modal state
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Get current user data
  const { data: meData } = useMeQuery({ retry: false });
  const userProfile = meData?.me?.profile;

  // Determine location mode and map center
  const { locationMode, mapCenter } = useLocationMode({
    city: filters.city,
    cityLat: filters.cityLat,
    cityLng: filters.cityLng,
    userHomeLat: userProfile?.homeLat,
    userHomeLng: userProfile?.homeLng,
  });

  // Build GraphQL query variables
  const variables = useIntentsQueryVariables({
    filters,
    locationMode,
    sortVars,
  });

  // Fetch intents with infinite scroll
  const {
    data,
    error,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useIntentsInfiniteQuery(variables, { enabled: true });

  // Process data for display
  const pages = data?.pages ?? [];
  const flatItems = useMemo(
    () => pages?.flatMap((p) => p.intents.items) ?? [],
    [pages]
  );
  const total = pages[0]?.intents.pageInfo.total || flatItems.length;
  const loadedCount = flatItems.length;

  // Calculate grid columns based on map visibility
  const gridCols = buildGridCols(mapVisible);

  // Memoize callbacks for better performance
  const handleOpenFilters = useCallback(() => setFiltersOpen(true), []);
  const handleCloseFilters = useCallback(() => setFiltersOpen(false), []);

  const handleApplyFilters = useCallback(
    (next: any) => {
      apply({
        q: next.q,
        city: next.city,
        cityLat: next.cityLat ?? null,
        cityLng: next.cityLng ?? null,
        cityPlaceId: next.cityPlaceId ?? null,
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
        joinModes: next.joinModes ?? [],
      });
      setFiltersOpen(false);
    },
    [apply]
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
            <button
              onClick={handleOpenFilters}
              title={'Search'}
              aria-label={'Search'}
              className="cursor-pointer rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Search className="w-5 h-5" />
            </button>
          }
        />

        <main className={`mx-auto grid w-full gap-6 px-4 py-4 ${gridCols}`}>
          <motion.section layout="position" className="min-w-0">
            <EventsHeader
              isLoading={isLoading}
              hasError={!!error}
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
                error={error}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                lang={appLanguage}
                onLoadMore={fetchNextPage}
                onHover={handleIntentHover}
              />
            </ErrorBoundary>
          </motion.section>

          <AnimatePresence>
            {mapVisible && (
              <motion.aside
                className="hidden md:block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
              >
                <div className="sticky top-[var(--nav-h)] -mt-4 h-[calc(100vh-var(--nav-h))]">
                  <ErrorBoundary>
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center h-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl">
                          <div className="text-sm text-zinc-500">
                            Ładowanie mapy...
                          </div>
                        </div>
                      }
                    >
                      <ServerClusteredMap
                        fullHeight
                        lang={appLanguage}
                        filters={{
                          categorySlugs: filters.categories,
                          levels: filters.levels as any,
                          verifiedOnly: filters.verifiedOnly,
                        }}
                        onIntentClick={(intentId: string) => {
                          // Navigate to intent details or open modal
                          window.location.href = `/${intentId}`;
                        }}
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
            )}
          </AnimatePresence>

          <div className="col-span-full">
            <Footer />
          </div>
        </main>

        {filtersOpen && (
          <Suspense
            fallback={
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-white">Ładowanie filtrów...</div>
              </div>
            }
          >
            <FilterModalRefactored
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
              onApply={handleApplyFilters}
              onClose={handleCloseFilters}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}
