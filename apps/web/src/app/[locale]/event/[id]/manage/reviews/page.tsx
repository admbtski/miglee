/**
 * Event Reviews Management Page
 * View and moderate reviews
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { EventReviewsManagement } from './_components/event-reviews-management';
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
// Page Component
// =============================================================================

export default async function EventReviewsPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Recenzje"
      description="Przeglądaj i zarządzaj recenzjami wydarzenia"
    >
      <Suspense fallback={<ReviewsLoadingSkeleton />}>
        <EventReviewsManagement eventId={id} />
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
    title: 'Recenzje | Miglee',
    description: 'Przeglądaj i zarządzaj recenzjami wydarzenia',
  };
}
