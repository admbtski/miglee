/**
 * Load more button for intents list
 */

'use client';

import { memo } from 'react';

type IntentsLoadMoreProps = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadedCount: number;
  onLoadMore: () => void;
};

export const IntentsLoadMore = memo(function IntentsLoadMore({
  hasNextPage,
  isFetchingNextPage,
  loadedCount,
  onLoadMore,
}: IntentsLoadMoreProps) {
  if (hasNextPage) {
    return (
      <button
        type="button"
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        onClick={onLoadMore}
        disabled={isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading…' : 'Load more'}
      </button>
    );
  }

  return (
    <span className="text-xs opacity-60">
      Wszystko załadowane ({loadedCount})
    </span>
  );
});
