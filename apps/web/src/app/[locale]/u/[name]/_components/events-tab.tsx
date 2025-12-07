'use client';

import { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Loader2,
  ChevronLeft,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import type { GetUserProfileQuery } from '@/lib/api/__generated__/react-query-update';
import { useUserEventsQuery } from '@/lib/api/user-events';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useI18n } from '@/lib/i18n/provider-ssr';

type EventsTabProps = {
  user: NonNullable<GetUserProfileQuery['user']>;
};

export function EventsTab({ user }: EventsTabProps) {
  const { locale } = useI18n();
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data, isLoading, error } = useUserEventsQuery({
    userId: user.id,
    limit,
    offset: page * limit,
  });

  const events = data?.userEvents?.items || [];
  const total = data?.userEvents?.total || 0;
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-12 shadow-sm">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Ładowanie wydarzeń...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-6 text-center">
        <p className="text-sm text-red-700 dark:text-red-400">
          Nie udało się załadować wydarzeń
        </p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-12 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Calendar
            className="h-10 w-10 text-zinc-400 dark:text-zinc-600"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Brak wydarzeń
        </h3>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
          Ten użytkownik nie ma jeszcze żadnych wydarzeń.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Events List */}
      <div className="space-y-3">
        {events.map((event) => {
          const startDate = new Date(event.startAt);
          const categoryNames = event.categories?.[0]?.names;
          const categoryName =
            categoryNames?.pl || categoryNames?.en || 'Wydarzenie';
          const isOnline = event.meetingKind === 'ONLINE';
          const isHybrid = event.meetingKind === 'HYBRID';
          const isPast = startDate < new Date();

          return (
            <Link
              key={event.id}
              href={`${locale}/intent/${event.id}`}
              className="group block rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Title & Category */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        {categoryName}
                      </span>
                      {isPast && (
                        <span className="inline-flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Zakończone
                        </span>
                      )}
                      {(isOnline || isHybrid) && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          <Video className="h-3 w-3" />
                          {isOnline ? 'Online' : 'Hybrydowe'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {event.title}
                    </h3>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {event.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(startDate, 'PPP, HH:mm', { locale: pl })}
                      </span>
                    </div>
                    {event.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">
                          {event.address}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>
                        {event.joinedCount}
                        {event.max ? `/${event.max}` : ''} uczestników
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 self-center">
                  <ChevronRight className="h-5 w-5 text-zinc-400 dark:text-zinc-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-5 py-4 shadow-sm">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Strona{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {page + 1}
            </span>{' '}
            z{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {totalPages}
            </span>
            <span className="hidden sm:inline"> ({total} wydarzeń)</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Poprzednia
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              Następna
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
