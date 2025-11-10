/**
 * Footer component for filter modal
 */

export interface FilterFooterProps {
  onClose: () => void;
  onApply: () => void;
  resultsCount?: number;
  isApplyDisabled: boolean;
  applyDisabledReason?: string;
}

export function FilterFooter({
  onClose,
  onApply,
  resultsCount,
  isApplyDisabled,
  applyDisabledReason,
}: FilterFooterProps) {
  return (
    <div className="sticky bottom-0 p-4 border-t rounded-b-3xl border-zinc-200 bg-gradient-to-t from-white via-white/95 backdrop-blur dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900/95">
      <div className="flex items-center justify-between gap-3">
        <div
          className="text-sm text-zinc-600 dark:text-zinc-400"
          aria-live="polite"
        >
          {resultsCount != null
            ? `${resultsCount} wynik${resultsCount === 1 ? '' : 'ów'}`
            : '—'}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-xl border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Anuluj
          </button>
          <button
            onClick={onApply}
            disabled={isApplyDisabled}
            className="px-5 py-2 text-sm font-medium text-white shadow-sm rounded-xl bg-zinc-900 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600"
            title={
              isApplyDisabled ? applyDisabledReason || 'Brak zmian' : 'Zastosuj'
            }
          >
            {resultsCount != null
              ? `Pokaż wyniki (${resultsCount})`
              : 'Pokaż wyniki'}
          </button>
        </div>
      </div>
    </div>
  );
}
