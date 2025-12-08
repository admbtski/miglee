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

/* ───────────────────────────── Inline Loading Skeleton ───────────────────────────── */

/**
 * Skeleton loader for event cards
 * Matches the structure of MyEventCard component
 */
function EventCardSkeleton() {
  return (
    <div className="rounded-[24px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] p-6 shadow-sm">
      <div className="flex gap-6">
        {/* Cover Image Skeleton */}
        <div className="shrink-0 h-32 w-48 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />

        {/* Content Skeleton */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <div className="h-6 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-6 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>

          {/* Meta Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <div className="h-9 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-9 w-20 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MyEventsInlineLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
