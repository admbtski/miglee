/**
 * Main client component for the intents search page
 * Handles filters, sorting, map visibility, and infinite scroll
 *
 * FLOW (JustJoin.it inspired):
 * 1. Top bar with search segments - click opens TopDrawer
 * 2. TopDrawer (slides from top) - Search, Location, Distance
 * 3. Left Sidebar (desktop) - Time Status, Date Range, Event Settings with auto-apply
 * 4. Right Drawer (mobile) - Same as left sidebar, slides from right
 * 5. Auto-apply with 3s debounce for sidebar filters
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useI18n } from '@/lib/i18n/provider-ssr';
import { IntentStatus } from '@/lib/api/__generated__/react-query-update';

import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { useMeQuery } from '@/lib/api/auth';
import { useIntentsInfiniteQuery } from '@/lib/api/intents';
import { appLanguage } from '@/lib/config/language';
import { INTENTS_CONFIG } from '@/lib/constants/intents';
import type { IntentListItem } from '@/types/intent';

import { DesktopSearchBar } from './_components/desktop-search-bar';
import { EventsGridVirtualized } from './_components/events-list/events-grid-virtualized';
import { EventsHeader } from './_components/events-list/events-header';
import { LeftFiltersPanel } from './_components/left-filters-panel';
import { MobileFiltersDrawer } from './_components/mobile-filters-drawer';
import { MobileSearchBar } from './_components/mobile-search-bar';
import { TopDrawer } from './_components/top-drawer';
import type { TopDrawerFocusSection } from './_components/top-drawer';
import { useActiveFiltersCount } from './_hooks/use-active-filters-count';
import { useCommittedFilters } from './_hooks/use-committed-filters';
import { useCommittedMapVisible } from './_hooks/use-committed-map-vision';
import { useCommittedSort } from './_hooks/use-committed-sort';
import { useDebouncedHover } from './_hooks/use-debounced-hover';
import { useIntentsQueryVariables } from './_hooks/use-intents-query-variables';
import { useLocationMode } from './_hooks/use-location-mode';
import type { CommittedFilters } from './_types';
import type { SearchMeta } from './_hooks/use-search-meta';

const ServerClusteredMap = lazy(
  () =>
    // @ts-expect-error - Dynamic import with moduleResolution node16
    import('./_components/server-clustered-map')
);

// Auto-apply debounce time in milliseconds
const AUTO_APPLY_DEBOUNCE_MS = 1000;

/**
 * Main page component for browsing intents
 */
export function IntentsPage() {
  const { locale } = useI18n();

  const filters = useCommittedFilters();
  const { q, city, distanceKm, apply } = filters;

  const { sort, setSort, sortVars } = useCommittedSort();
  const { mapVisible, toggle: toggleMap } = useCommittedMapVisible();
  const activeFilters = useActiveFiltersCount(filters);
  const [hoveredIntent, handleIntentHover] = useDebouncedHover();

  // Drawer states
  const [topDrawerOpen, setTopDrawerOpen] = useState(false);
  const [topDrawerFocus, setTopDrawerFocus] =
    useState<TopDrawerFocusSection>('search');
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  // Local state for TopDrawer (before applying)
  const [localQ, setLocalQ] = useState(q);
  const [localTags, setLocalTags] = useState<SearchMeta['tags']>([]);
  const [localCategories, setLocalCategories] = useState<
    SearchMeta['categories']
  >([]);
  const [localCity, setLocalCity] = useState(city);
  const [localCityLat, setLocalCityLat] = useState(filters.cityLat);
  const [localCityLng, setLocalCityLng] = useState(filters.cityLng);
  const [localCityPlaceId, setLocalCityPlaceId] = useState(filters.cityPlaceId);
  const [localDistanceKm, setLocalDistanceKm] = useState(distanceKm);
  const [localStatus, setLocalStatus] = useState<IntentStatus>(filters.status);
  const [localStartISO, setLocalStartISO] = useState<string | null>(
    filters.startISO
  );
  const [localEndISO, setLocalEndISO] = useState<string | null>(filters.endISO);

  // Local state for Sidebar filters (instant visual feedback, debounced apply)
  const [localKinds, setLocalKinds] = useState(filters.kinds);
  const [localLevels, setLocalLevels] = useState(filters.levels);
  const [localJoinModes, setLocalJoinModes] = useState(filters.joinModes);
  const [localVerifiedOnly, setLocalVerifiedOnly] = useState(
    filters.verifiedOnly
  );

  // Sync local state with committed filters when they change
  useEffect(() => {
    setLocalQ(q);
    setLocalCity(city);
    setLocalCityLat(filters.cityLat);
    setLocalCityLng(filters.cityLng);
    setLocalCityPlaceId(filters.cityPlaceId);
    setLocalDistanceKm(distanceKm);
    setLocalStatus(filters.status);
    setLocalStartISO(filters.startISO);
    setLocalEndISO(filters.endISO);
    setLocalKinds(filters.kinds);
    setLocalLevels(filters.levels);
    setLocalJoinModes(filters.joinModes);
    setLocalVerifiedOnly(filters.verifiedOnly);
  }, [
    q,
    city,
    filters.cityLat,
    filters.cityLng,
    filters.cityPlaceId,
    distanceKm,
    filters.status,
    filters.startISO,
    filters.endISO,
    filters.kinds,
    filters.levels,
    filters.joinModes,
    filters.verifiedOnly,
  ]);

  // Debounce timer for auto-apply
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingFiltersRef = useRef<Partial<CommittedFilters> | null>(null);
  const [isPendingApply, setIsPendingApply] = useState(false);

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

  // Build grid columns based on map visibility
  // 3 columns: left filters (hidden on mobile), center content, right map (optional)
  const gridCols = mapVisible
    ? 'md:grid-cols-[280px_1fr_400px] lg:grid-cols-[300px_1fr_450px]'
    : 'md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr]';

  // Open TopDrawer with specific focus
  const openTopDrawer = useCallback((focus: TopDrawerFocusSection) => {
    setTopDrawerFocus(focus);
    setTopDrawerOpen(true);
  }, []);

  const closeTopDrawer = useCallback(() => {
    setTopDrawerOpen(false);
  }, []);

  const openRightDrawer = useCallback(() => {
    setRightDrawerOpen(true);
  }, []);

  const closeRightDrawer = useCallback(() => {
    setRightDrawerOpen(false);
  }, []);

  // Apply TopDrawer filters (immediate)
  const handleTopDrawerApply = useCallback(() => {
    const normalizedFilters: CommittedFilters = {
      ...filters,
      q: localQ,
      city: localCity,
      cityLat: localCityLat,
      cityLng: localCityLng,
      cityPlaceId: localCityPlaceId,
      distanceKm: localDistanceKm,
      tags: localTags.map((t) => t.slug),
      categories: localCategories.map((c) => c.slug),
      status: localStatus,
      startISO: localStartISO,
      endISO: localEndISO,
    };
    apply(normalizedFilters);
  }, [
    apply,
    filters,
    localQ,
    localCity,
    localCityLat,
    localCityLng,
    localCityPlaceId,
    localDistanceKm,
    localTags,
    localCategories,
    localStatus,
    localStartISO,
    localEndISO,
  ]);

  // Handle sidebar filter changes with instant visual update + 3s debounce auto-apply
  const handleSidebarFiltersChange = useCallback(
    (nextFilters: Partial<CommittedFilters>) => {
      // INSTANT: Update local state for immediate visual feedback
      if (nextFilters.kinds !== undefined) setLocalKinds(nextFilters.kinds);
      if (nextFilters.levels !== undefined) setLocalLevels(nextFilters.levels);
      if (nextFilters.joinModes !== undefined)
        setLocalJoinModes(nextFilters.joinModes);
      if (nextFilters.verifiedOnly !== undefined)
        setLocalVerifiedOnly(nextFilters.verifiedOnly);

      // Store pending filters for debounced apply
      pendingFiltersRef.current = {
        ...(pendingFiltersRef.current ?? {}),
        ...nextFilters,
      };

      // Show pending indicator
      setIsPendingApply(true);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for auto-apply (3s debounce)
      debounceTimerRef.current = setTimeout(() => {
        if (pendingFiltersRef.current) {
          const normalizedFilters: CommittedFilters = {
            ...filters,
            ...pendingFiltersRef.current,
          };
          apply(normalizedFilters);
          pendingFiltersRef.current = null;
          setIsPendingApply(false);
        }
      }, AUTO_APPLY_DEBOUNCE_MS);
    },
    [apply, filters]
  );

  // Create local filters object for sidebar (instant visual state)
  const localSidebarFilters = useMemo(
    () => ({
      ...filters,
      kinds: localKinds,
      levels: localLevels,
      joinModes: localJoinModes,
      verifiedOnly: localVerifiedOnly,
    }),
    [filters, localKinds, localLevels, localJoinModes, localVerifiedOnly]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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
              onOpenSearch={() => openTopDrawer('search')}
              onOpenLocation={() => openTopDrawer('location')}
              onOpenDistance={() => openTopDrawer('distance')}
              onOpenFilters={openRightDrawer}
            />
          }
          mobileSearchButton={
            <MobileSearchBar
              q={q}
              city={city}
              activeFiltersCount={activeFilters}
              onOpenSearch={() => openTopDrawer('search')}
              onOpenFilters={openRightDrawer}
            />
          }
        />

        <main className={`mx-auto grid w-full gap-4 px-4 py-4 ${gridCols}`}>
          {/* Left Filters Panel - hidden on mobile, sticky like map */}
          <aside className="hidden md:block">
            <div className="sticky top-[calc(var(--nav-h)+1rem)] h-[calc(100vh-var(--nav-h)-2rem)] overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/95 shadow-lg backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-950/95">
              <LeftFiltersPanel
                filters={localSidebarFilters}
                onFiltersChange={handleSidebarFiltersChange}
                locale={locale as 'pl' | 'en'}
                isPending={isPendingApply}
              />
            </div>
          </aside>

          {/* Center Content - Events Grid */}
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

          {/* Right Map Sidebar */}
          <AnimatePresence>
            {mapVisible && (
              <MapSidebar
                filters={filters}
                hoveredIntent={hoveredIntent}
                mapCenter={mapCenter}
                locationMode={locationMode}
                locale={locale}
              />
            )}
          </AnimatePresence>

          <div className="col-span-full">
            <Footer />
          </div>
        </main>

        {/* Top Drawer - Search, Location, Distance, Time Status, Date Range */}
        <TopDrawer
          isOpen={topDrawerOpen}
          onClose={closeTopDrawer}
          focusSection={topDrawerFocus}
          q={localQ}
          tags={localTags}
          categories={localCategories}
          onQChange={setLocalQ}
          onTagsChange={setLocalTags}
          onCategoriesChange={setLocalCategories}
          city={localCity}
          distanceKm={localDistanceKm}
          onCityChange={setLocalCity}
          onCityLatChange={setLocalCityLat}
          onCityLngChange={setLocalCityLng}
          onCityPlaceIdChange={setLocalCityPlaceId}
          onDistanceChange={setLocalDistanceKm}
          status={localStatus}
          startISO={localStartISO}
          endISO={localEndISO}
          onStatusChange={setLocalStatus}
          onStartISOChange={setLocalStartISO}
          onEndISOChange={setLocalEndISO}
          onApply={handleTopDrawerApply}
          locale={locale as 'pl' | 'en'}
        />

        {/* Right Drawer (mobile) - All sidebar filters */}
        <MobileFiltersDrawer
          isOpen={rightDrawerOpen}
          onClose={closeRightDrawer}
          filters={localSidebarFilters}
          onFiltersChange={handleSidebarFiltersChange}
          locale={locale as 'pl' | 'en'}
          isPending={isPendingApply}
        />
      </div>
    </ErrorBoundary>
  );
}

type MapSidebarProps = {
  filters: CommittedFilters;
  hoveredIntent: { id: string; lat: number | null; lng: number | null } | null;
  mapCenter: { lat: number; lng: number } | null;
  locationMode: 'EXPLICIT' | 'PROFILE_DEFAULT' | 'NONE';
  locale: string;
};

function MapSidebar({
  filters,
  hoveredIntent,
  mapCenter,
  locationMode,
  locale,
}: MapSidebarProps) {
  const handleIntentClick = useCallback(
    (intentId: string) => {
      window.location.href = `/${locale}/intent/${intentId}`;
    },
    [locale]
  );

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
              locale={locale}
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
