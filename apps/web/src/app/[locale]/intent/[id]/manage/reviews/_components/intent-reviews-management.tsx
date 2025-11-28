/**
 * Intent Reviews Management Component
 * View and moderate reviews
 */

'use client';

import { EyeOff } from 'lucide-react';
import { useIntentQuery } from '@/lib/api/intents';
import { EventReviews } from '../../../_components/event-reviews';

interface IntentReviewsManagementProps {
  intentId: string;
}

/**
 * Intent Reviews Management Component
 */
export function IntentReviewsManagement({
  intentId,
}: IntentReviewsManagementProps) {
  const { data, isLoading } = useIntentQuery({ id: intentId });
  const intent = data?.intent;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Loading reviews...
          </p>
        </div>
      </div>
    );
  }

  if (!intent) {
    return (
      <div className="text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Event not found</p>
      </div>
    );
  }

  const eventData = {
    id: intent.id,
    title: intent.title,
    status: intent.status,
    reviewsCount: (intent as any).reviewsCount || 0,
    averageRating: (intent as any).averageRating || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Reviews
        </h1>
        <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
          Manage reviews for your event
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
        <EyeOff className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="text-sm text-blue-900 dark:text-blue-100">
          <p className="font-medium">Moderation Tools Coming Soon</p>
          <p className="mt-1 text-blue-700 dark:text-blue-300">
            The ability to hide inappropriate reviews will be available in a
            future update.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <EventReviews event={eventData as any} />
      </div>
    </div>
  );
}
