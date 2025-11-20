'use client';

import { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import type { GetUserProfileQuery } from '@/lib/api/__generated__/react-query-update';
import { useUserEventsQuery } from '@/lib/api/user-events';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

type EventsTabProps = {
  user: NonNullable<GetUserProfileQuery['user']>;
};

export function EventsTab({ user }: EventsTabProps) {
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data, isLoading, error } = useUserEventsQuery({
    userId: user.id,
    limit,
    offset: page * limit,
  });

  const events = (data as any)?.userEvents?.items || [];
  const total = (data as any)?.userEvents?.total || 0;
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-12 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">
          Nie udało się załadować wydarzeń
        </p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Calendar className="mx-auto h-12 w-12 text-zinc-400" />
        <h3 className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Brak wydarzeń
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Ten użytkownik nie ma jeszcze żadnych wydarzeń
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Events List */}
      <div className="space-y-3">
        {events.map((event: any) => {
          const startDate = new Date(event.startAt);
          const categoryNames = event.categories?.[0]?.names as any;
          const categoryName =
            categoryNames?.pl || categoryNames?.en || 'Wydarzenie';

          return (
            <Link
              key={event.id}
              href={`/intent/${event.id}`}
              className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Title & Category */}
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {event.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {categoryName}
                    </p>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {event.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(startDate, 'PPP, HH:mm', { locale: pl })}
                    </div>
                    {event.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.address}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.joinedCount}/{event.max}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-zinc-400" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Strona {page + 1} z {totalPages} ({total} wydarzeń)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Poprzednia
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Następna
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
