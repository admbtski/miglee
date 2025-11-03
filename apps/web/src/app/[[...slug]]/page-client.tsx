'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { EventCard } from './_components/event-card';
import { MapImagePanel } from './_components/map-image-panel';

import { FilterModal } from './_components/filter-modal';
import { useCommittedMapVisible } from './_hooks/use-comitted-map-vision';
import { useCommittedFilters } from './_hooks/use-committed-filters';
import { useCommittedSort } from './_hooks/use-committed-sort';

import {
  GetIntentsQueryVariables,
  IntentMember,
  IntentStatus,
  Visibility,
} from '@/lib/api/__generated__/react-query-update';
import { useIntentsInfiniteQuery } from '@/lib/api/intents';

import { appLanguage } from '@/lib/config/language';
import { DesktopSearchBar } from './_components/desktop-search-bar';
import { SortByControl } from './_components/sort-by-control';
import { ToggleMap } from './_components/toggle-map';

const upcomingAfterDefault = new Date().toISOString();
const DEFAULT_LIMIT = 5;
const NAV_H = 86;

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
    categories,
    apply,
  } = useCommittedFilters();

  const { sort, setSort, sortVars } = useCommittedSort();

  const variables = useMemo<Omit<GetIntentsQueryVariables, 'offset'>>(
    () => ({
      limit: DEFAULT_LIMIT,
      visibility: Visibility.Public,
      upcomingAfter: startISO ?? upcomingAfterDefault,
      endingBefore: endISO,
      categorySlugs: categories ?? [],
      tagSlugs: tags,
      kinds: kinds.length ? kinds : [],
      levels: levels.length ? levels : [],
      keywords: [],
      status: status !== IntentStatus.Any ? status : IntentStatus.Any,
      verifiedOnly: !!verifiedOnly,
      ownerId: undefined,
      memberId: undefined,
      distanceKm: city ? distanceKm : null,
      near: undefined,
      ...sortVars,
    }),
    [
      startISO,
      endISO,
      categories,
      tags,
      kinds,
      levels,
      status,
      verifiedOnly,
      city,
      distanceKm,
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
    if (categories.length) n++;
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
    categories,
  ]);

  let headerLeft = '';
  if (isLoading) {
    headerLeft = 'Loading…';
  }
  if (!isLoading && error) {
    headerLeft = 'Failed to load';
  }
  if (!isLoading && !error) {
    headerLeft = `All events in ${city || 'Global'} — `;
  }

  const pages = data?.pages ?? [];
  const flatItems = pages?.flatMap((p) => p.intents.items) ?? [];
  const total = pages[0]?.intents.pageInfo.total || flatItems.length;
  const loadedCount = flatItems.length;

  const showNoResults = !isLoading && !error && loadedCount === 0;
  const showError = !!error;
  const showSkeletons = isLoading && loadedCount === 0;
  const showItems = !showSkeletons && flatItems.length > 0;
  const canShowLoadMoreContainer = !error && loadedCount > 0;
  const canLoadMore = !!hasNextPage;

  const pluralSuffix = total !== 1 ? 's' : '';

  const gridCols = mapVisible
    ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_clamp(360px,36vw,640px)]'
    : 'grid-cols-1';

  return (
    <div
      className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
      style={{ ['--nav-h' as string]: `${NAV_H}px` }}
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
        mobileSearchButton={
          <button
            onClick={() => setFiltersOpen(true)}
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
          <div className="sticky z-30 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="flex items-center justify-between py-2 text-sm">
              <div className="opacity-70">
                {headerLeft}
                {!isLoading && !error && (
                  <>
                    <b>{loadedCount}</b> / <b>{total}</b> event{pluralSuffix}
                    {isFetching && (
                      <span className="ml-2 opacity-60">updating…</span>
                    )}
                  </>
                )}
              </div>
              <div className="relative inline-flex items-center gap-3">
                <ToggleMap enable={mapVisible} onToggle={toggleMap} />
                <SortByControl value={sort} onChange={setSort} />
              </div>
            </div>
          </div>

          {showNoResults && (
            <div className="mt-6 text-sm opacity-70">
              Brak wyników dla wybranych filtrów.
            </div>
          )}

          {showError && (
            <div className="mt-6 text-sm text-red-600 dark:text-red-400">
              {error?.message ?? 'Unknown error'}
            </div>
          )}

          <motion.div
            layout="position"
            className="grid grid-cols-1 gap-6 mt-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {showSkeletons && (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`sk-${i}`}
                    className="w-full h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900"
                  />
                ))}
              </>
            )}

            {showItems && (
              <>
                {flatItems.map((item, i) => (
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
                    plan={((_index) => {
                      // todo
                      if (_index % 7 === 0) return 'premium';
                      if (_index % 5 === 0) return 'plus';
                      if (_index % 3 === 0) return 'basic';
                      return 'default';
                    })(i)}
                    title={item.title || '-'}
                    description={item.description || '-'}
                    address={item.address!}
                    onlineUrl={item.onlineUrl!}
                    joinedCount={item.joinedCount}
                    min={item.min}
                    max={item.max}
                    tags={item.tags.map((t) => t.label)}
                    categories={item.categories.map(
                      (c) => c.names[appLanguage]
                    )}
                    isOngoing={item.isOngoing}
                    isCanceled={item.isOngoing}
                    isDeleted={item.isOngoing}
                    hasStarted={item.hasStarted}
                    isFull={item.isFull}
                    isHybrid={item.isHybrid}
                    isOnline={item.isOnline}
                    isOnsite={item.isOnsite}
                    withinLock={item.withinLock}
                    canJoin={item.canJoin}
                    verifiedAt={item.owner?.verifiedAt as string}
                    members={item.members as IntentMember[]}
                    levels={item.levels}
                    addressVisibility={item.addressVisibility}
                    membersVisibility={item.membersVisibility}
                    onJoin={() => {
                      console.log('join intent', item.id);
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>

          {/* Load more */}
          {canShowLoadMoreContainer && (
            <div className="mt-6 flex justify-center">
              {canLoadMore && (
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage && 'Loading…'}
                  {!isFetchingNextPage && 'Load more'}
                </button>
              )}

              {!canLoadMore && (
                <span className="text-xs opacity-60">
                  Wszystko załadowane ({loadedCount})
                </span>
              )}
            </div>
          )}
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
          initialCategories={categories}
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
