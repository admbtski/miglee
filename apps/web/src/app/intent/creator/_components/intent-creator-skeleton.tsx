'use client';

/**
 * Loading skeleton for intent creator page
 */
export function IntentCreatorSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-full max-w-md rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Progress bar skeleton */}
      <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />

      {/* Form skeleton */}
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-32 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex gap-4">
          <div className="h-10 flex-1 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-10 flex-1 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-24 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
