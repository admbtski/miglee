/**
 * Event Reviews Management Component
 * View and moderate reviews
 */

'use client';

import { Star, Info, AlertCircle, TrendingUp } from 'lucide-react';
import { useEventQuery } from '@/features/events/api/events';
import { EventReviews } from '@/features/events/components/event-reviews';
import { ManagementPageLayout } from '../../_components/management-page-layout';

interface EventReviewsManagementProps {
  eventId: string;
}

/**
 * Event Reviews Management Component
 */
export function EventReviewsManagement({
  eventId,
}: EventReviewsManagementProps) {
  const { data, isLoading } = useEventQuery({ id: eventId });
  const event = data?.event;

  if (isLoading) {
    return (
      <ManagementPageLayout
        title="Reviews"
        description="View and manage reviews for your event"
      >
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Loading reviews...
            </p>
          </div>
        </div>
      </ManagementPageLayout>
    );
  }

  if (!event) {
    return (
      <ManagementPageLayout
        title="Reviews"
        description="View and manage reviews for your event"
      >
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-500" />
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Event not found
            </p>
          </div>
        </div>
      </ManagementPageLayout>
    );
  }

  const eventData = {
    id: event.id,
    title: event.title,
    status: event.status,
    reviewsCount: (event as any).reviewsCount || 0,
    averageRating: (event as any).averageRating || 0,
  };

  return (
    <ManagementPageLayout
      title="Reviews"
      description="View and manage reviews for your event"
    >
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
                  Total reviews
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
                  Average rating
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/30">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium">Moderation Tools Coming Soon</p>
            <p className="mt-1 text-blue-700 dark:text-blue-300">
              The ability to respond to reviews and flag inappropriate content
              will be available in a future update.
            </p>
          </div>
        </div>

        {/* Reviews List */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <EventReviews event={eventData as any} />
        </div>
      </div>
    </ManagementPageLayout>
  );
}
