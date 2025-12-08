// TODO: Consider using i18n for hardcoded strings
// TODO: Consider using MyEventsLoadingState from @/features/events for consistency

import { AccountPageHeader } from '../_components';

export default function EventsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <AccountPageHeader
        title="My Events"
        description="Loading your events..."
      />

      {/* Loading skeleton */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading events...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
