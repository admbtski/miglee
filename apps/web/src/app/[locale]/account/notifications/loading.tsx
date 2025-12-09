/**
 * Notifications Loading State
 * Displayed while notifications page is loading
 */

// TODO: Add i18n for hardcoded strings: "Notifications", "Loading notifications..."

export default function NotificationsLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        {/* TODO i18n: Notifications */}
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Notifications
        </h1>
        {/* TODO i18n: Loading notifications... */}
        <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
          Loading notifications...
        </p>
      </div>

      {/* Loading skeleton */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
            {/* TODO i18n: Loading notifications... */}
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading notifications...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
