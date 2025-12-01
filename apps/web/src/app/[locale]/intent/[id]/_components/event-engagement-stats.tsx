import type { EventDetailsData } from '@/types/event-details';
import { Heart, MessageSquare, MessageCircle, Users } from 'lucide-react';
import { useMemo } from 'react';
import { getCardHighlightClasses } from '@/lib/utils/is-boost-active';

type EventEngagementStatsProps = {
  event: EventDetailsData;
};

export function EventEngagementStats({ event }: EventEngagementStatsProps) {
  const fillPercentage = event.max
    ? Math.round((event.joinedCount / event.max) * 100)
    : 0;

  const hasMaxLimit = event.max !== null && event.max !== undefined;

  // Check if boost is active
  const isBoosted = useMemo(() => {
    if (!event.boostedAt) return false;
    const boostedTime = new Date(event.boostedAt).getTime();
    const now = Date.now();
    const elapsed = now - boostedTime;
    return elapsed < 24 * 60 * 60 * 1000;
  }, [event.boostedAt]);

  // Get highlight classes
  const highlightClasses = useMemo(
    () => getCardHighlightClasses(event.highlightColor, isBoosted),
    [event.highlightColor, isBoosted]
  );

  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40 transition-all duration-300 ${highlightClasses.className}`}
      style={highlightClasses.style}
    >
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        📈 Statystyki zaangażowania
      </h2>

      <div className="space-y-4">
        {/* Attendance Progress */}
        {hasMaxLimit ? (
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Zapełnienie
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {event.joinedCount} / {event.max}
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(fillPercentage, 100)}%` }}
              />
            </div>
            <div className="mt-1 text-right text-xs text-zinc-500 dark:text-zinc-400">
              {fillPercentage}% zapełnienia
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Zapełnienie
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {event.joinedCount} uczestników
              </span>
            </div>
            <div className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
              ∞ Bez limitu uczestników
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Favourites */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <Heart className="h-4 w-4" />
              <span className="text-xs font-medium">Zapisane</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {event.savedCount ?? 0}
            </p>
          </div>

          {/* Comments */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs font-medium">Komentarze</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {event.commentsCount}
            </p>
          </div>

          {/* Chat Messages */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Wiadomości</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {event.messagesCount}
            </p>
          </div>

          {/* Participants */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Uczestnicy</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {event.joinedCount}
            </p>
          </div>
        </div>

        {/* Engagement Summary */}
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <p className="text-center text-xs text-zinc-600 dark:text-zinc-400">
            {event.joinedCount > 0 ? (
              <>
                Średnio{' '}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
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
