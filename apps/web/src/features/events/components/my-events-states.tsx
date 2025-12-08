'use client';

import { Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider-ssr';

/* ───────────────────────────── Loading State ───────────────────────────── */

export function MyEventsLoadingState() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {t.myEvents.loading}
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────────── Unauthenticated State ───────────────────────────── */

export function MyEventsUnauthenticatedState() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {t.myEvents.notAuthenticated}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t.myEvents.pleaseLogin}
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────────── Error State ───────────────────────────── */

export interface MyEventsErrorStateProps {
  error: Error;
}

export function MyEventsErrorState({ error }: MyEventsErrorStateProps) {
  const { t } = useI18n();
  return (
    <div className="p-4 text-red-800 border border-red-200 rounded-lg bg-red-50 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
      <p className="font-medium">{t.myEvents.errorLoading}</p>
      <p className="mt-1 text-sm">{error.message}</p>
    </div>
  );
}

/* ───────────────────────────── Empty State ───────────────────────────── */

export interface MyEventsEmptyStateProps {
  hasActiveFilters: boolean;
}

export function MyEventsEmptyState({
  hasActiveFilters,
}: MyEventsEmptyStateProps) {
  const { t } = useI18n();
  return (
    <div className="p-12 text-center border rounded-lg border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
      <Calendar className="w-12 h-12 mx-auto text-zinc-400" />
      <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
        {t.myEvents.noEvents}
      </h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {hasActiveFilters
          ? t.myEvents.tryChangeFilters
          : t.myEvents.noEventsYet}
      </p>
    </div>
  );
}

/* ───────────────────────────── Inline Loading Spinner ───────────────────────────── */

export function MyEventsInlineLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-indigo-500 rounded-full animate-spin border-t-transparent" />
    </div>
  );
}
