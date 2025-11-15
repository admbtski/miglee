import type { EventDetailsData } from '@/types/event-details';
import { Heart, MessageSquare, MessageCircle, Users } from 'lucide-react';

type EventEngagementStatsProps = {
  event: EventDetailsData;
};

export function EventEngagementStats({ event }: EventEngagementStatsProps) {
  const fillPercentage = event.max
    ? Math.round((event.joinedCount / event.max) * 100)
    : 0;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/70 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        📈 Statystyki zaangażowania
      </h2>

      <div className="space-y-4">
        {/* Attendance Progress */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              Zapełnienie
            </span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {event.joinedCount} / {event.max}
            </span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
            />
          </div>
          <div className="mt-1 text-right text-xs text-neutral-500 dark:text-neutral-400">
            {fillPercentage}% zapełnienia
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Favourites */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900/60">
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
              <Heart className="h-4 w-4" />
              <span className="text-xs font-medium">Zapisane</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {event.savedCount ?? 0}
            </p>
          </div>

          {/* Comments */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900/60">
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs font-medium">Komentarze</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {event.commentsCount}
            </p>
          </div>

          {/* Chat Messages */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900/60">
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Wiadomości</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {event.messagesCount}
            </p>
          </div>

          {/* Participants */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900/60">
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Uczestnicy</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {event.joinedCount}
            </p>
          </div>
        </div>

        {/* Engagement Summary */}
        <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
          <p className="text-center text-xs text-neutral-600 dark:text-neutral-400">
            {event.joinedCount > 0 ? (
              <>
                Średnio{' '}
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {(
                    (event.commentsCount + event.messagesCount) /
                    event.joinedCount
                  ).toFixed(1)}
                </span>{' '}
                interakcji na uczestnika
              </>
            ) : (
              'Brak jeszcze uczestników'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
