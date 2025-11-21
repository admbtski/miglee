/**
 * Intent Reviews & Comments Management Component
 * View and moderate reviews and comments with hide functionality
 */

'use client';

import { useState } from 'react';
import { MessageSquare, Star, EyeOff } from 'lucide-react';
import { useIntentQuery } from '@/lib/api/intents';
import { EventReviews } from '../../../_components/event-reviews';
import { EventComments } from '../../../_components/event-comments';
import { cn } from '@/lib/utils';

interface IntentReviewsManagementProps {
  intentId: string;
}

type Tab = 'reviews' | 'comments';

/**
 * Intent Reviews & Comments Management Component
 */
export function IntentReviewsManagement({
  intentId,
}: IntentReviewsManagementProps) {
  const { data, isLoading } = useIntentQuery({ id: intentId });
  const intent = data?.intent;
  const [activeTab, setActiveTab] = useState<Tab>('reviews');

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Loading...
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
    commentsCount: intent.commentsCount || 0,
    reviewsCount: intent.reviewsCount || 0,
    averageRating: intent.averageRating || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Reviews & Comments
        </h1>
        <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
          Manage reviews and comments for your event
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
        <EyeOff className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="text-sm text-blue-900 dark:text-blue-100">
          <p className="font-medium">Moderation Tools Coming Soon</p>
          <p className="mt-1 text-blue-700 dark:text-blue-300">
            The ability to hide inappropriate reviews and comments will be
            available in a future update.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('reviews')}
            className={cn(
              'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'reviews'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'
            )}
          >
            <Star className="h-4 w-4" />
            Reviews ({intent.reviewsCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={cn(
              'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'comments'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Comments ({intent.commentsCount || 0})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {activeTab === 'reviews' ? (
          <EventReviews event={eventData} />
        ) : (
          <EventComments event={eventData} />
        )}
      </div>
    </div>
  );
}
