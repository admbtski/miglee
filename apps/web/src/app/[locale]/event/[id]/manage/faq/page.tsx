/**
 * FAQ Management Page
 * Allows event owner/moderators to manage frequently asked questions
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { FaqManagementClient } from '@/features/faq';
import { ManagementPageLayout } from '@/features/events';

// =============================================================================
// Types
// =============================================================================

type PageProps = {
  params: Promise<{ id: string; locale: string }>;
};

// =============================================================================
// Loading Skeleton
// =============================================================================

function FaqLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Add Button Skeleton */}
      <div className="flex justify-end">
        <div className="h-10 w-40 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* FAQ Items Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State Hint Skeleton */}
      <div className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default async function FaqPage({ params }: PageProps) {
  const { id: eventId } = await params;

  if (!eventId) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="FAQ"
      description="Zarządzaj najczęściej zadawanymi pytaniami"
    >
      <Suspense fallback={<FaqLoadingSkeleton />}>
        <FaqManagementClient eventId={eventId} />
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
    title: 'FAQ | Miglee',
    description: 'Zarządzaj FAQ wydarzenia',
  };
}
