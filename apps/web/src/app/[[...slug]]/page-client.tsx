'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';

import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { FEATURES } from '@/lib/constants/features';
import { DesktopSearchBar } from './_components/desktop-search-bar';
import { EventsGrid } from './_components/events-list/events-grid';
import { EventsGridHybrid } from './_components/events-list/events-grid-hybrid';
import { EventsGridVirtualized } from './_components/events-list/events-grid-virtualized';
import { EventsHeader } from './_components/events-list/events-header';

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

import { useActiveFiltersCount } from './_hooks/use-active-filters-count';
import { useCommittedFilters } from './_hooks/use-committed-filters';
import { useCommittedMapVisible } from './_hooks/use-committed-map-vision';
import { useCommittedSort } from './_hooks/use-committed-sort';
import { useDebouncedHover } from './_hooks/use-debounced-hover';

import {
  GetIntentsQueryVariables,
  IntentStatus,
  Visibility,
} from '@/lib/api/__generated__/react-query-update';
import { useIntentsInfiniteQuery } from '@/lib/api/intents';
import { useMeQuery } from '@/lib/api/auth';
import { appLanguage } from '@/lib/config/language';

import {
  getUpcomingAfterDefault,
  INTENTS_CONFIG,
} from '@/lib/constants/intents';
import { buildGridCols } from '@/lib/utils/intents';
import type { IntentListItem } from '@/types/intent';

/* ───────────────────────────── Types ───────────────────────────── */

type LocationMode = 'EXPLICIT' | 'PROFILE_DEFAULT' | 'NONE';

/* ───────────────────────────── Page ───────────────────────────── */

export function IntentsPage() {
  const filters = useCommittedFilters();
  const {
    q,
    city,
    cityLat,
    cityLng,
    cityPlaceId,
    distanceKm,
    startISO,
    endISO,
    status,
    kinds,
    levels,
    verifiedOnly,
    tags,
    keywords,
    categories,
    joinModes,
    apply,
  } = filters;

  // Get user profile for PROFILE_DEFAULT mode
  const { data: meData } = useMeQuery({ retry: false });
  const userProfile = meData?.me?.profile;

  const { sort, setSort, sortVars } = useCommittedSort();
  const { mapVisible, toggle: toggleMap } = useCommittedMapVisible();
  const activeFilters = useActiveFiltersCount(filters);
  const [hoveredIntent, handleIntentHover] = useDebouncedHover();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Determine location mode
  const locationMode = useMemo<LocationMode>(() => {
    // EXPLICIT: User has set location in filters
    if (city && cityLat != null && cityLng != null) {
      return 'EXPLICIT';
    }
    // PROFILE_DEFAULT: User has home location in profile
    if (userProfile?.homeLat != null && userProfile?.homeLng != null) {
      return 'PROFILE_DEFAULT';
    }
    // NONE: No location available
    return 'NONE';
  }, [city, cityLat, cityLng, userProfile?.homeLat, userProfile?.homeLng]);

  // Map center based on location mode
  const mapCenter = useMemo<{ lat: number; lng: number } | null>(() => {
    if (locationMode === 'EXPLICIT' && cityLat != null && cityLng != null) {
      return { lat: cityLat, lng: cityLng };
    }
    if (
      locationMode === 'PROFILE_DEFAULT' &&
      userProfile?.homeLat != null &&
      userProfile?.homeLng != null
    ) {
      return { lat: userProfile.homeLat, lng: userProfile.homeLng };
    }
    return null; // NONE mode - map will handle fitBounds or default view
  }, [
    locationMode,
    cityLat,
    cityLng,
    userProfile?.homeLat,
    userProfile?.homeLng,
  ]);

  // Memoize callbacks for better performance
  const handleOpenFilters = useCallback(() => setFiltersOpen(true), []);
  const handleCloseFilters = useCallback(() => setFiltersOpen(false), []);
  const handleToggleMap = useCallback(toggleMap, [toggleMap]);
  const handleSortChange = useCallback(setSort, [setSort]);

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

  const variables = useMemo<Omit<GetIntentsQueryVariables, 'offset'>>(
    () => ({
      limit: INTENTS_CONFIG.DEFAULT_LIMIT,
      visibility: Visibility.Public,
      upcomingAfter: startISO ?? getUpcomingAfterDefault(),
      endingBefore: endISO,
      categorySlugs: categories ?? [],
      tagSlugs: tags,
      kinds: kinds.length ? kinds : [],
      levels: levels.length ? levels : [],
      joinModes: joinModes.length ? joinModes : [],
      keywords: [],
      status: status !== IntentStatus.Any ? status : IntentStatus.Any,
      verifiedOnly: !!verifiedOnly,
      ownerId: undefined,
      memberId: undefined,
      // Only filter by distance in EXPLICIT mode
      distanceKm: locationMode === 'EXPLICIT' ? distanceKm : null,
      near:
        locationMode === 'EXPLICIT' && cityLat != null && cityLng != null
          ? {
              lat: cityLat,
              lng: cityLng,
              cityName: city,
              cityPlaceId: cityPlaceId ?? undefined,
            }
          : undefined,
      ...sortVars,
    }),
    [
      startISO,
      endISO,
      categories,
      tags,
      kinds,
      levels,
      joinModes,
      status,
      verifiedOnly,
      city,
      cityLat,
      cityLng,
      cityPlaceId,
      distanceKm,
      locationMode,
      sortVars,
    ]
  );

  const {
    data,
    error,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useIntentsInfiniteQuery(variables, { enabled: true });

  const pages = data?.pages ?? [];
  const flatItems = useMemo(
    () => pages?.flatMap((p) => p.intents.items) ?? [],
    [pages]
  );
  const total = pages[0]?.intents.pageInfo.total || flatItems.length;
  const loadedCount = flatItems.length;

  const gridCols = buildGridCols(mapVisible);

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
              onToggleMap={handleToggleMap}
              onSortChange={handleSortChange}
            />

            <ErrorBoundary>
              {FEATURES.VIRTUALIZATION_MODE === 'always' ? (
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
              ) : FEATURES.VIRTUALIZATION_MODE === 'hybrid' ? (
                <EventsGridHybrid
                  items={flatItems as unknown as IntentListItem[]}
                  isLoading={isLoading}
                  error={error}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  lang={appLanguage}
                  onLoadMore={fetchNextPage}
                  onHover={handleIntentHover}
                  virtualizationThreshold={FEATURES.VIRTUALIZATION_THRESHOLD}
                />
              ) : (
                <EventsGrid
                  items={flatItems as unknown as IntentListItem[]}
                  isLoading={isLoading}
                  error={error}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  lang={appLanguage}
                  onLoadMore={fetchNextPage}
                  onHover={handleIntentHover}
                />
              )}
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
                          categorySlugs: categories,
                          levels: levels as any,
                          verifiedOnly: verifiedOnly,
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
              initialQ={q}
              initialCity={city}
              initialCityLat={cityLat}
              initialCityLng={cityLng}
              initialCityPlaceId={cityPlaceId}
              initialDistanceKm={distanceKm}
              initialStartISO={startISO}
              initialEndISO={endISO}
              initialStatus={status}
              initialKinds={kinds}
              initialLevels={levels}
              initialVerifiedOnly={verifiedOnly}
              initialTags={tags}
              initialKeywords={keywords}
              initialCategories={categories}
              initialJoinModes={joinModes}
              onApply={handleApplyFilters}
              onClose={handleCloseFilters}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}
