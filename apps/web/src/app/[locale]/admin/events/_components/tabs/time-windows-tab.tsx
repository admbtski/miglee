'use client';

import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, Clock, Lock, Unlock } from 'lucide-react';

type TimeWindowsTabProps = {
  event: any;
  onRefresh?: () => void;
};

export function TimeWindowsTab({ event }: TimeWindowsTabProps) {
  return (
    <div className="space-y-6">
      {/* Main Dates */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Daty wydarzenia
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Rozpoczęcie:
              </span>
            </div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {format(new Date(eventstartAt), 'dd MMM yyyy, HH:mm', {
                locale: pl,
              })}
            </span>
          </div>
          {eventendAt && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Zakończenie:
                </span>
              </div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {format(new Date(eventendAt), 'dd MMM yyyy, HH:mm', {
                  locale: pl,
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Join Windows */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Okna zapisów
        </h3>
        <div className="space-y-3">
          {eventjoinOpensMinutesBeforeStart !== null && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Otwarcie zapisów:
                </span>
              </div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {eventjoinOpensMinutesBeforeStart} min przed startem
              </span>
            </div>
          )}
          {eventjoinCutoffMinutesBeforeStart !== null && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Zamknięcie zapisów:
                </span>
              </div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {eventjoinCutoffMinutesBeforeStart} min przed startem
              </span>
            </div>
          )}
          {eventallowJoinLate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Dołączenie po starcie:
                </span>
              </div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Dozwolone
                {eventlateJoinCutoffMinutesAfterStart &&
                  ` (do ${eventlateJoinCutoffMinutesAfterStart} min)`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Manual Lock */}
      {eventjoinManuallyClosed && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div>
              <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                Zapisy ręcznie zamknięte
              </h3>
              {eventjoinManualCloseReason && (
                <p className="mt-1 text-sm text-orange-800 dark:text-orange-300">
                  Powód: {eventjoinManualCloseReason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Info */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Status
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">
              Status wydarzenia:
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {eventstatus}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">W trakcie:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {eventisOngoing ? 'Tak' : 'Nie'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">
              Zapisy otwarte:
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {eventjoinOpen ? 'Tak' : 'Nie'}
            </span>
          </div>
          {eventlockReason && (
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">
                Powód blokady:
              </span>
              <span className="font-medium text-orange-600 dark:text-orange-400">
                {eventlockReason}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
