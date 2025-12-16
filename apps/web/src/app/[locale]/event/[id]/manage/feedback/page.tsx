/**
 * Event Feedback Management Page
 * Configure feedback questions and view results
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { ManagementPageLayout } from '@/features/event-management/components/management-page-layout';
import { FeedbackPanel } from './_components/feedback-panel';

// =============================================================================
// Types
// =============================================================================

type PageProps = {
  params: Promise<{ id: string }>;
};

// =============================================================================
// Loading Skeleton
// =============================================================================

function FeedbackLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
              <div>
                <div className="h-7 w-10 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
                <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Questions Config Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-36 rounded bg-zinc-200 dark:bg-zinc-700 mb-6" />

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="h-6 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>

      {/* Results Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-700 mb-6" />

        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i}>
              <div className="h-4 w-56 rounded bg-zinc-200 dark:bg-zinc-700 mb-3" />
              <div className="h-8 w-full rounded-lg bg-zinc-200 dark:bg-zinc-700" />
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

export default async function EventFeedbackPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Feedback"
      description="Konfiguruj ankiety po wydarzeniu i przeglądaj wyniki"
    >
      <Suspense fallback={<FeedbackLoadingSkeleton />}>
        <FeedbackPanel eventId={id} />
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
    title: 'Feedback | Miglee',
    description: 'Zarządzaj feedbackiem wydarzenia',
  };
}
