import type { EventDetailsData } from '@/types/event-details';
import { formatOpensIn } from '@/lib/utils/intent-join-state';
import { Clock, Lock, CheckCircle, XCircle } from 'lucide-react';

type EventJoinSectionProps = {
  event: EventDetailsData;
};

export function EventJoinSection({ event }: EventJoinSectionProps) {
  const { joinState } = event;

  return (
    <div className="sticky top-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Zapisy
      </h2>

      {/* Join State Info */}
      <div className="mb-4 space-y-3">
        {/* Before Open */}
        {joinState.isBeforeOpen && joinState.opensInMs && (
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-950">
            <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Zapisy otwierają się {formatOpensIn(joinState.opensInMs)}
              </p>
            </div>
          </div>
        )}

        {/* Manually Closed */}
        {joinState.isManuallyClosed && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm dark:bg-red-950">
            <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
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
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-950">
            <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Zapisy zamknięte przed startem
              </p>
            </div>
          </div>
        )}

        {/* Full */}
        {joinState.isFull && (
          <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-900">
            <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Brak wolnych miejsc
              </p>
            </div>
          </div>
        )}

        {/* Late Join Open */}
        {joinState.isLateJoinOpen && (
          <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm dark:bg-green-950">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Możliwe dołączenie po starcie
              </p>
            </div>
          </div>
        )}

        {/* Can Join */}
        {joinState.canJoin && (
          <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm dark:bg-green-950">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
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
        className={`w-full rounded-lg px-4 py-3 font-semibold transition-colors ${
          joinState.canJoin
            ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            : 'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        }`}
      >
        {joinState.ctaLabel}
      </button>

      {/* Reason */}
      {joinState.reason && !joinState.canJoin && (
        <p className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
          {joinState.reason}
        </p>
      )}

      {/* Join Windows Info */}
      <div className="mt-6 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Okna zapisów
        </h3>

        {event.joinOpensMinutesBeforeStart != null && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">Otwarcie:</span>{' '}
            {event.joinOpensMinutesBeforeStart} min przed startem
          </div>
        )}

        {event.joinCutoffMinutesBeforeStart != null && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">Zamknięcie:</span>{' '}
            {event.joinCutoffMinutesBeforeStart} min przed startem
          </div>
        )}

        {event.allowJoinLate && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">Dołączenie po starcie:</span> Tak
            {event.lateJoinCutoffMinutesAfterStart != null &&
              ` (do ${event.lateJoinCutoffMinutesAfterStart} min po starcie)`}
          </div>
        )}

        {!event.allowJoinLate && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">Dołączenie po starcie:</span> Nie
          </div>
        )}
      </div>
    </div>
  );
}
