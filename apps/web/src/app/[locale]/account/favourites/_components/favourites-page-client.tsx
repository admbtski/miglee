'use client';

import { Heart, Loader2 } from 'lucide-react';
import {
  useMyFavouritesInfiniteQuery,
  flatFavouritesPages,
} from '@/lib/api/favourites';
import { useMemo } from 'react';
import { FavouriteCard } from './favourite-card';
import Link from 'next/link';
import { useLocalePath } from '@/hooks/use-locale-path';
import { AccountPageHeader } from '../../_components';
import { AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n/provider-ssr';

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

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              {t.favourites.loadingFavourites}
            </p>
          </div>
        </div>
      )}

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
