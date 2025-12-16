/**
 * Event Reviews Management Component
 * View and moderate reviews
 */

// TODO i18n: All hardcoded strings need translation keys
// - "Recenzje", "Łącznie recenzji", "Średnia ocena"
// - "Narzędzia moderacji wkrótce", "Możliwość odpowiadania..."
// - "Nie znaleziono wydarzenia"

'use client';

import { Star, Info, AlertCircle, TrendingUp } from 'lucide-react';
import { useEventDetailQuery } from '@/features/events/api/events';
import { EventReviews } from '@/features/events/components/event-reviews';

// =============================================================================
// Types
// =============================================================================

interface EventReviewsManagementProps {
  eventId: string;
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function ReviewsLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
              <div>
                <div className="h-7 w-12 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
                <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner Skeleton */}
      <div className="h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />

      {/* Reviews List Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
                <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function EventReviewsManagement({
  eventId,
}: EventReviewsManagementProps) {
  const { data, isLoading } = useEventDetailQuery({ id: eventId });
  const event = data?.event;

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return <ReviewsLoadingSkeleton />;
  }

  // ---------------------------------------------------------------------------
  // Event not found
  // ---------------------------------------------------------------------------
  if (!event) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-500" />
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            {/* TODO i18n */}
            Nie znaleziono wydarzenia
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const eventData = {
    id: event.id,
    title: event.title,
    status: event.status,
    reviewsCount: (event as any).reviewsCount || 0,
    averageRating: (event as any).averageRating || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Reviews */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
              <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {eventData.reviewsCount}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {/* TODO i18n: proper pluralization */}
                {eventData.reviewsCount === 1
                  ? 'Recenzja'
                  : eventData.reviewsCount < 5
                    ? 'Recenzje'
                    : 'Recenzji'}
              </p>
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {eventData.averageRating > 0
                    ? eventData.averageRating.toFixed(1)
                    : '—'}
                </p>
                <span className="text-sm text-zinc-400">/5</span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {/* TODO i18n */}
                Średnia ocena
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/30">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="text-sm text-blue-900 dark:text-blue-100">
          {/* TODO i18n */}
          <p className="font-medium">Narzędzia moderacji wkrótce</p>
          <p className="mt-1 text-blue-700 dark:text-blue-300">
            Możliwość odpowiadania na recenzje i zgłaszania nieodpowiednich
            treści będzie dostępna w przyszłej aktualizacji.
          </p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <EventReviews event={eventData as any} />
      </div>
    </div>
  );
}
