/**
 * Event Danger Zone Page
 * Cancel or delete event
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { EventDangerZone } from './_components/event-danger-zone';
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

function DangerZoneLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Warning Banner */}
      <div className="h-20 rounded-2xl bg-red-50 dark:bg-red-900/20" />

      {/* Cancel Event Card */}
      <div className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-800/50 dark:bg-zinc-900">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30" />
          <div className="flex-1">
            <div className="h-5 w-36 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
            <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-700 mb-4" />
            <div className="h-10 w-36 rounded-xl bg-red-100 dark:bg-red-900/30" />
          </div>
        </div>
      </div>

      {/* Delete Event Card */}
      <div className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-800/50 dark:bg-zinc-900">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30" />
          <div className="flex-1">
            <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
            <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-700 mb-4" />
            <div className="h-10 w-32 rounded-xl bg-red-100 dark:bg-red-900/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default async function EventDangerPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Strefa zagrożenia"
      description="Nieodwracalne akcje dla Twojego wydarzenia"
    >
      <Suspense fallback={<DangerZoneLoadingSkeleton />}>
        <EventDangerZone eventId={id} />
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
    title: 'Strefa zagrożenia | Miglee',
    description: 'Anuluj lub usuń wydarzenie',
  };
}
