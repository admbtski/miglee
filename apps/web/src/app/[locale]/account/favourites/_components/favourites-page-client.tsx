/**
 * Favourites Page Client Component
 *
 * Handles fetching and displaying favourite events with infinite scroll.
 * All text uses i18n via useI18n hook.
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';

import {
  FavouriteCard,
  flatFavouritesPages,
  useMyFavouritesInfiniteQuery,
} from '@/features/favourites';
import { useLocalePath } from '@/hooks/use-locale-path';
import { useI18n } from '@/lib/i18n/provider-ssr';

import { AccountPageHeader } from '@/features/account';

/**
 * Skeleton loader for favourite cards
 * Matches the structure of FavouriteCard component
 */
function FavouritesSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="group relative overflow-hidden rounded-[24px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm"
        >
          <div className="p-6">
            {/* Heart button skeleton */}
            <div className="absolute top-3 right-3 h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />

            {/* Title skeleton */}
            <div className="mb-3 space-y-2 pr-8">
              <div className="h-6 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-6 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>

            {/* Description skeleton */}
            <div className="mb-4 space-y-2">
              <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>

            {/* Meta info skeleton */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FavouritesPageClient() {
  const { localePath } = useLocalePath();
  const { t } = useI18n();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMyFavouritesInfiniteQuery(
      { limit: 20 },
      {
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      }
    );

  const items = useMemo(() => {
    return flatFavouritesPages(data?.pages);
  }, [data?.pages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <AccountPageHeader
        title={t.favourites.title}
        description={
          items.length > 0
            ? `${items.length} ${t.favourites.savedEvents} ${items.length === 1 ? t.favourites.savedEvent : t.favourites.savedEventsPlural}`
            : t.favourites.subtitle
        }
      />

      {/* Loading - Skeleton */}
      {isLoading && <FavouritesSkeleton />}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-zinc-200/80 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 py-20 px-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-6">
            <Heart
              className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
              strokeWidth={2}
            />
          </div>
          <h3 className="mb-3 text-xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            {t.favourites.emptyTitle}
          </h3>
          <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t.favourites.emptyDescription}
          </p>
          <Link
            href={localePath('/')}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-indigo-500 hover:to-indigo-400 shadow-md hover:shadow-lg"
          >
            <Heart className="h-4 w-4" strokeWidth={2} />
            {t.favourites.browseEvents}
          </Link>
        </div>
      )}

      {/* Grid */}
      {items.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {items.map((fav) => (
                <FavouriteCard key={fav.id} favourite={fav} />
              ))}
            </AnimatePresence>
          </div>

          {/* Counter */}
          <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            {t.favourites.showingEvents} {items.length}{' '}
            {items.length === 1
              ? t.favourites.savedEvent
              : t.favourites.savedEventsPlural}
          </div>
        </>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            className="rounded-2xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60 shadow-sm hover:shadow-md"
          >
            {isFetchingNextPage ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                {t.favourites.loading}
              </span>
            ) : (
              t.favourites.loadMore
            )}
          </button>
        </div>
      )}
    </div>
  );
}
