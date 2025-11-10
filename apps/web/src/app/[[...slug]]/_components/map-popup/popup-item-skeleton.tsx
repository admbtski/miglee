/**
 * Skeleton loader for map popup items
 */

import clsx from 'clsx';

export function PopupItemSkeleton() {
  return (
    <div
      className={clsx(
        'w-full rounded-xl ring-1 px-3 py-2',
        'bg-white dark:bg-zinc-900',
        'ring-zinc-200 dark:ring-zinc-800',
        'animate-pulse'
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {/* Title skeleton */}
          <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-1.5" />

          {/* Date skeleton */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="w-3.5 h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded shrink-0" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
          </div>

          {/* Address skeleton */}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-3.5 h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded shrink-0" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-40" />
          </div>
        </div>
      </div>

      {/* Owner skeleton */}
      <div className="mt-2 flex items-center gap-2">
        <div className="w-[22px] h-[22px] bg-zinc-200 dark:bg-zinc-700 rounded-full shrink-0" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-24" />
      </div>

      {/* Progress bar skeleton */}
      <div className="mt-1.5 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-full" />

      {/* Badges skeleton */}
      <div className="mt-2 flex gap-1.5">
        <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-12" />
        <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-16" />
        <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-14" />
      </div>
    </div>
  );
}
