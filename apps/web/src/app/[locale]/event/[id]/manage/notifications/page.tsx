/**
 * Event Notifications Page
 * Send notifications to event members
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { NotificationsPanel } from './_components/notifications-panel';
import { ManagementPageLayout } from '@/features/event-management/components/management-page-layout';

// =============================================================================
// Types
// =============================================================================

type PageProps = {
  params: Promise<{ id: string }>;
};

// =============================================================================
// Loading Skeleton
// =============================================================================

function NotificationsLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
              <div>
                <div className="h-7 w-12 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
                <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Send Notification Form Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-700 mb-6" />

        <div className="space-y-4">
          <div>
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
            <div className="h-10 w-full rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div>
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
            <div className="h-32 w-full rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-36 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      </div>

      {/* Recent Notifications Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-40 rounded bg-zinc-200 dark:bg-zinc-700 mb-4" />

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800"
            >
              <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
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

export default async function EventNotificationsPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Powiadomienia"
      description="Wysyłaj powiadomienia do uczestników wydarzenia"
    >
      <Suspense fallback={<NotificationsLoadingSkeleton />}>
        <NotificationsPanel eventId={id} />
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
    title: 'Powiadomienia | Miglee',
    description: 'Wysyłaj powiadomienia do uczestników wydarzenia',
  };
}
