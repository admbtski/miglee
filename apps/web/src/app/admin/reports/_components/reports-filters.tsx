'use client';

import {
  ReportEntity,
  ReportStatus,
} from '@/lib/api/__generated__/react-query-update';
import clsx from 'clsx';

type ReportsFiltersProps = {
  status?: ReportStatus;
  entity?: ReportEntity;
  onStatusChange: (status?: ReportStatus) => void;
  onEntityChange: (entity?: ReportEntity) => void;
  totalCount: number;
};

const statusOptions = [
  { value: undefined, label: 'Wszystkie' },
  { value: ReportStatus.Open, label: 'Otwarte', color: 'red' },
  { value: ReportStatus.Investigating, label: 'W trakcie', color: 'amber' },
  { value: ReportStatus.Resolved, label: 'Rozwiązane', color: 'green' },
  { value: ReportStatus.Dismissed, label: 'Odrzucone', color: 'gray' },
];

const entityOptions = [
  { value: undefined, label: 'Wszystkie typy' },
  { value: ReportEntity.Intent, label: 'Wydarzenia' },
  { value: ReportEntity.Comment, label: 'Komentarze' },
  { value: ReportEntity.Review, label: 'Recenzje' },
  { value: ReportEntity.User, label: 'Użytkownicy' },
  { value: ReportEntity.Message, label: 'Wiadomości' },
];

export function ReportsFilters({
  status,
  entity,
  onStatusChange,
  onEntityChange,
  totalCount,
}: ReportsFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Status filters */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => onStatusChange(option.value)}
              className={clsx(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                status === option.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entity filters */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Typ zgłoszenia
        </label>
        <div className="flex flex-wrap gap-2">
          {entityOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => onEntityChange(option.value)}
              className={clsx(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                entity === option.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        Znaleziono: <span className="font-semibold">{totalCount}</span> raportów
      </div>
    </div>
  );
}
