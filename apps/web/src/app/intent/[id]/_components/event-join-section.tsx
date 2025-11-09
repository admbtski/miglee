import type { EventDetailsData } from '@/types/event-details';
import { formatOpensIn } from '@/lib/utils/intent-join-state';
import { Clock, Lock, CheckCircle, XCircle, UserPlus } from 'lucide-react';

type EventJoinSectionProps = {
  event: EventDetailsData;
};

export function EventJoinSection({ event }: EventJoinSectionProps) {
  const { joinState } = event;

  return (
    <div className="sticky top-4 rounded-2xl border border-neutral-200 bg-white/70 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Zapisy
      </h2>

      {/* Join State Info */}
      <div className="mb-4 space-y-2">
        {/* Before Open */}
        {joinState.isBeforeOpen && joinState.opensInMs && (
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-sm dark:bg-blue-950">
            <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Zapisy otwierają się {formatOpensIn(joinState.opensInMs)}
              </p>
            </div>
          </div>
        )}

        {/* Manually Closed */}
        {joinState.isManuallyClosed && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm dark:bg-red-950">
            <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                Zapisy zamknięte ręcznie
              </p>
              {event.joinManualCloseReason && (
                <p className="mt-1 text-red-700 dark:text-red-300">
                  {event.joinManualCloseReason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pre-Cutoff Closed */}
        {joinState.isPreCutoffClosed && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-950">
            <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Zapisy zamknięte przed startem
              </p>
            </div>
          </div>
        )}

        {/* Full */}
        {joinState.isFull && (
          <div className="flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-sm dark:bg-neutral-900">
            <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-600 dark:text-neutral-400" />
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                Brak wolnych miejsc
              </p>
            </div>
          </div>
        )}

        {/* Late Join Open */}
        {joinState.isLateJoinOpen && (
          <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-sm dark:bg-green-950">
            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Możliwe dołączenie po starcie
              </p>
            </div>
          </div>
        )}

        {/* Can Join */}
        {joinState.canJoin && (
          <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-sm dark:bg-green-950">
            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Zapisy otwarte
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <button
        disabled={!joinState.canJoin}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-md font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${
          joinState.canJoin
            ? 'bg-neutral-900 text-white hover:opacity-90 active:opacity-80 dark:bg-white dark:text-neutral-900'
            : 'cursor-not-allowed bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
        }`}
      >
        <UserPlus className="h-4 w-4" />
        {joinState.ctaLabel}
      </button>

      {/* Reason */}
      {joinState.reason && !joinState.canJoin && (
        <p className="mt-2 text-center text-xs text-neutral-600 dark:text-neutral-400">
          {joinState.reason}
        </p>
      )}

      {/* Join Windows Info */}
      {(event.joinOpensMinutesBeforeStart != null ||
        event.joinCutoffMinutesBeforeStart != null ||
        event.allowJoinLate) && (
        <div className="mt-6 space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Okna zapisów
          </h3>

          {event.joinOpensMinutesBeforeStart != null && (
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">Otwarcie:</span>{' '}
              {event.joinOpensMinutesBeforeStart} min przed startem
            </div>
          )}

          {event.joinCutoffMinutesBeforeStart != null && (
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">Zamknięcie:</span>{' '}
              {event.joinCutoffMinutesBeforeStart} min przed startem
            </div>
          )}

          {event.allowJoinLate && (
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">Dołączenie po starcie:</span> Tak
              {event.lateJoinCutoffMinutesAfterStart != null &&
                ` (do ${event.lateJoinCutoffMinutesAfterStart} min po starcie)`}
            </div>
          )}

          {!event.allowJoinLate && (
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">Dołączenie po starcie:</span> Nie
            </div>
          )}
        </div>
      )}
    </div>
  );
}
