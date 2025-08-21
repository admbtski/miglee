'use client';

import { useGetEventsQuery } from '@/hooks/useEvents';
import { NotificationsPanel } from './components/notification-panel';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const WelcomePage = () => {
  const { data, isLoading, isError, error, isFetching } = useGetEventsQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 flex items-center justify-center">
        <div className="text-lg text-neutral-600 dark:text-neutral-300">
          Loading events…
        </div>
      </div>
    );
  }

  if (isError) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 flex items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          Error loading events: {msg}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white text-neutral-900 dark:from-neutral-950 dark:to-neutral-900 dark:text-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Sports Events</h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-300">
              Latest sports events and competitions
            </p>
          </div>
        </div>

        <div className="mb-10">
          <NotificationsPanel />
        </div>

        {isFetching && (
          <div className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            Refreshing…
          </div>
        )}

        {data?.events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-neutral-600 dark:text-neutral-300">
              No events found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data?.events.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <h2 className="mb-3 text-xl font-semibold">{event.title}</h2>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  <time dateTime={event.createdAt}>
                    {formatDate(event.createdAt)}
                  </time>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
