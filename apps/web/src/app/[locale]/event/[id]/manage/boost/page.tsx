/**
 * Event Boost Page
 * Manage event boosts from active subscription
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { BoostPageWrapper } from './_components/boost-page-wrapper';
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

function BoostLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Current Status Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            <div>
              <div className="h-5 w-40 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
              <div className="h-4 w-56 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
          <div className="h-10 w-28 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>

      {/* Boost Options */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 mb-4" />
            <div className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
            <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-700 mb-4" />
            <div className="h-8 w-20 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>

      {/* History */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-700 mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
            >
              <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
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

export default async function EventBoostPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Podbicia wydarzenia"
      description="Podbij swoje wydarzenie w górę listy i zwiększ widoczność"
    >
      <Suspense fallback={<BoostLoadingSkeleton />}>
        <BoostPageWrapper eventId={id} />
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
    title: 'Podbicia wydarzenia | Miglee',
    description: 'Zarządzaj podbiciami wydarzenia',
  };
}
