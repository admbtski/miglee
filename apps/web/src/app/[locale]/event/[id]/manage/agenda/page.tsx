/**
 * Agenda Management Page
 * Allows event organizers to manage the event agenda/schedule
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { ManagementPageLayout } from '../_components/management-page-layout';
import { AgendaManagementClient } from './_components/agenda-management-client';

// =============================================================================
// Types
// =============================================================================

type PageProps = {
  params: Promise<{ id: string }>;
};

// =============================================================================
// Loading Skeleton
// =============================================================================

function AgendaLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Add Slot Button Skeleton */}
      <div className="flex justify-end">
        <div className="h-10 w-36 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Agenda Items Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Drag Handle */}
                <div className="h-6 w-6 rounded bg-zinc-200 dark:bg-zinc-700" />

                {/* Time Badge */}
                <div className="h-8 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-700" />

                {/* Content */}
                <div className="space-y-2">
                  <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-3 w-72 rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>

            {/* Hosts */}
            <div className="mt-4 flex items-center gap-2">
              <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex -space-x-2">
                {[1, 2].map((j) => (
                  <div
                    key={j}
                    className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 ring-2 ring-white dark:ring-zinc-900"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save Button Skeleton */}
      <div className="flex justify-end">
        <div className="h-10 w-32 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default async function AgendaPage({ params }: PageProps) {
  const { id: eventId } = await params;

  if (!eventId) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Agenda"
      description="Zarządzaj programem wydarzenia"
    >
      <Suspense fallback={<AgendaLoadingSkeleton />}>
        <AgendaManagementClient eventId={eventId} />
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
    title: 'Agenda | Miglee',
    description: 'Zarządzaj agendą wydarzenia',
  };
}
