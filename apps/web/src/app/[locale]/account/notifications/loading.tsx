/**
 * Notifications Loading State
 * Displayed while notifications page is loading
 */

// TODO i18n: title, description

export default function NotificationsLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        {/* TODO i18n */}
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Powiadomienia
        </h1>
        <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
          Ładowanie powiadomień...
        </p>
      </div>

      {/* Stats & Actions Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-5 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-32 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-8 w-10 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-8 w-10 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>

      {/* Notifications List Skeleton */}
      <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50/50 to-white dark:border-zinc-800 dark:from-zinc-900/50 dark:to-zinc-950 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-2 p-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 animate-pulse"
            >
              <div className="flex items-start gap-3 p-3.5">
                {/* Icon skeleton */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700" />

                {/* Content skeleton */}
                <div className="min-w-0 flex-1 space-y-3">
                  {/* Title + timestamp */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-700" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-24 rounded-md bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-7 w-20 rounded-md bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
