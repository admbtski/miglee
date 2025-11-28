/**
 * Footer component for filter modal
 */

import type { FilterModalTranslations } from './translations';

export interface FilterFooterProps {
  onClose: () => void;
  onApply: () => void;
  resultsCount?: number;
  isApplyDisabled: boolean;
  applyDisabledReason?: string;
  translations: FilterModalTranslations;
}

export function FilterFooter({
  onClose,
  onApply,
  resultsCount,
  isApplyDisabled,
  applyDisabledReason,
  translations: t,
}: FilterFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div
        className="text-sm text-zinc-600 dark:text-zinc-400"
        aria-live="polite"
      >
        {resultsCount != null
          ? `${resultsCount} ${resultsCount === 1 ? t.footer.result : t.footer.results}`
          : '—'}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors
                     border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50
                     dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          {t.footer.cancel}
        </button>

        <button
          type="button"
          onClick={onApply}
          disabled={isApplyDisabled}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                     bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-md hover:shadow-lg"
          title={
            isApplyDisabled
              ? applyDisabledReason || t.footer.noChanges
              : t.footer.applyFilters
          }
        >
          <span>
            {resultsCount != null
              ? t.footer.showResultsWithCount.replace(
                  '{count}',
                  String(resultsCount)
                )
              : t.footer.showResults}
          </span>
        </button>
      </div>
    </div>
  );
}
