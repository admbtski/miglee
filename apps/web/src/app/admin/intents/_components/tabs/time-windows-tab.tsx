'use client';

import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, Clock, Lock, Unlock } from 'lucide-react';

type TimeWindowsTabProps = {
  intent: any;
  onRefresh?: () => void;
};

export function TimeWindowsTab({ intent }: TimeWindowsTabProps) {
  return (
    <div className="space-y-6">
      {/* Main Dates */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Daty wydarzenia
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Rozpoczęcie:
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {format(new Date(intent.startAt), 'dd MMM yyyy, HH:mm', {
                locale: pl,
              })}
            </span>
          </div>
          {intent.endAt && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Zakończenie:
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {format(new Date(intent.endAt), 'dd MMM yyyy, HH:mm', {
                  locale: pl,
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Join Windows */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Okna zapisów
        </h3>
        <div className="space-y-3">
          {intent.joinOpensMinutesBeforeStart !== null && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Otwarcie zapisów:
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {intent.joinOpensMinutesBeforeStart} min przed startem
              </span>
            </div>
          )}
          {intent.joinCutoffMinutesBeforeStart !== null && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Zamknięcie zapisów:
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {intent.joinCutoffMinutesBeforeStart} min przed startem
              </span>
            </div>
          )}
          {intent.allowJoinLate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Dołączenie po starcie:
                </span>
              </div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Dozwolone
                {intent.lateJoinCutoffMinutesAfterStart &&
                  ` (do ${intent.lateJoinCutoffMinutesAfterStart} min)`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Manual Lock */}
      {intent.joinManuallyClosed && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div>
              <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                Zapisy ręcznie zamknięte
              </h3>
              {intent.joinManualCloseReason && (
                <p className="mt-1 text-sm text-orange-800 dark:text-orange-300">
                  Powód: {intent.joinManualCloseReason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Info */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Status
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Status wydarzenia:
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {intent.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">W trakcie:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {intent.isOngoing ? 'Tak' : 'Nie'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Zapisy otwarte:
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {intent.joinOpen ? 'Tak' : 'Nie'}
            </span>
          </div>
          {intent.lockReason && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Powód blokady:
              </span>
              <span className="font-medium text-orange-600 dark:text-orange-400">
                {intent.lockReason}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
