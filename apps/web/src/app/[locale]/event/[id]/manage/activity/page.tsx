/**
 * Event Activity Log Page
 * View audit log history for an event
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { ActivityLogPanel } from './_components/activity-log-panel';
import { ActivityPanelWrapper } from './_components/activity-panel-wrapper';
import { ManagementPageLayout } from '@/features/events';

// =============================================================================
// Types
// =============================================================================

type PageProps = {
  params: Promise<{ id: string }>;
};

// =============================================================================
// Loading Skeleton
// =============================================================================

function ActivityLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Filters skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 w-24 rounded-xl bg-zinc-200 dark:bg-zinc-700"
          />
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {/* Date header */}
          <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>

          {/* Log items */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-4 py-4 flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default async function EventActivityPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Activity Log"
      description="View the complete history of changes and actions for this event"
    >
      <Suspense fallback={<ActivityLoadingSkeleton />}>
        <ActivityPanelWrapper eventId={id}>
          <ActivityLogPanel eventId={id} />
        </ActivityPanelWrapper>
      </Suspense>
    </ManagementPageLayout>
  );
}

// =============================================================================
// Metadata
// =============================================================================

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await params;

  return {
    // TODO i18n
    title: 'Activity Log | Miglee',
    description: 'View the activity history for your event',
  };
}
