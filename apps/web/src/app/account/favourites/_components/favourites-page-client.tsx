'use client';

import { Heart, Loader2 } from 'lucide-react';
import {
  useMyFavouritesInfiniteQuery,
  flatFavouritesPages,
} from '@/lib/api/favourites';
import { useMemo } from 'react';
import { FavouriteCard } from './favourite-card';

export function FavouritesPageClient() {
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Favourites
        </h1>
        <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
          {items.length} saved {items.length === 1 ? 'event' : 'events'}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/50">
          <Heart className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-700" />
          <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Nie masz jeszcze zapisanych wydarzeń
          </h3>
          <p className="mb-6 max-w-md text-center text-sm text-zinc-600 dark:text-zinc-400">
            Przeglądaj listę wydarzeń i kliknij ikonę ❤️, aby zapisać
            interesujące Cię wydarzenia na później.
          </p>
          <a
            href="/"
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Przeglądaj wydarzenia
          </a>
        </div>
      )}

      {/* Grid */}
      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((fav) => (
            <FavouriteCard key={fav.id} favourite={fav} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            className="rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {isFetchingNextPage ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Ładowanie…
              </span>
            ) : (
              'Załaduj więcej'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
