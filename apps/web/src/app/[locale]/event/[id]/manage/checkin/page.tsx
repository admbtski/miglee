/**
 * Check-in & Presence Management Page
 * Full implementation of check-in system for event organizers
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { CheckinManagementClient } from './_components/checkin-management-client';
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

function CheckinLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>

      {/* Tabs */}
      <div className="h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />

      {/* Content */}
      <div className="h-96 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4">
          <div className="h-6 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-64 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default async function EventCheckinPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Check-in & Presence"
      description="Manage attendee check-ins and track event presence"
    >
      <Suspense fallback={<CheckinLoadingSkeleton />}>
        <CheckinManagementClient />
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
    title: 'Check-in & Presence | Miglee',
    description: 'Manage event check-ins and track attendee presence',
  };
}
