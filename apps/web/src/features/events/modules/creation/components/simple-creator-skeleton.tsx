'use client';

/**
 * Loading skeleton for simplified creator
 */
export function SimpleCreatorSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-10 w-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-5 w-96 max-w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-12 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-12 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-24 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="h-12 w-24 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-12 w-32 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
