/**
 * Event Comments Management Component
 * View and moderate comments
 */

// TODO i18n: All hardcoded strings need translation keys
// - "Komentarze", "Zarządzaj komentarzami wydarzenia"
// - "Łącznie komentarzy", "Ładowanie komentarzy..."
// - "Nie znaleziono wydarzenia", "Narzędzia moderacji wkrótce"
// - "Możliwość ukrywania nieodpowiednich komentarzy..."

'use client';

import { MessageSquare, Info, AlertCircle } from 'lucide-react';
import { useEventDetailQuery } from '@/features/events/api/events';
import { EventComments } from '@/features/events/components/event-comments';

// =============================================================================
// Types
// =============================================================================

interface EventCommentsManagementProps {
  eventId: string;
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function CommentsLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Card Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            <div>
              <div className="h-7 w-12 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
              <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Comments List Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
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

export function EventCommentsManagement({
  eventId,
}: EventCommentsManagementProps) {
  const { data, isLoading } = useEventDetailQuery({ id: eventId });
  const event = data?.event;

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="space-y-6">
        <CommentsLoadingSkeleton />
      </div>
    );
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
    commentsCount: event.commentsCount || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
              <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {eventData.commentsCount}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {/* TODO i18n: proper pluralization */}
                {eventData.commentsCount === 1
                  ? 'Komentarz'
                  : eventData.commentsCount < 5
                    ? 'Komentarze'
                    : 'Komentarzy'}
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
            Możliwość ukrywania nieodpowiednich komentarzy będzie dostępna w
            przyszłej aktualizacji.
          </p>
        </div>
      </div>

      {/* Comments List */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <EventComments event={eventData as any} />
      </div>
    </div>
  );
}
