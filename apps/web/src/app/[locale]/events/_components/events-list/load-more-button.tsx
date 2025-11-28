'use client';

import { memo } from 'react';

type LoadMoreButtonProps = {
  canLoadMore: boolean;
  isLoading: boolean;
  loadedCount: number;
  onLoadMore: () => void;
};

export const LoadMoreButton = memo(function LoadMoreButton({
  canLoadMore,
  isLoading,
  loadedCount,
  onLoadMore,
}: LoadMoreButtonProps) {
  if (canLoadMore) {
    return (
      <button
        type="button"
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        onClick={onLoadMore}
        disabled={isLoading}
      >
        {isLoading ? 'Loading…' : 'Load more'}
      </button>
    );
  }

  return (
    <span className="text-xs opacity-60">
      Wszystko załadowane ({loadedCount})
    </span>
  );
});
