/**
 * Event Sponsorship Plans Page
 * Purchase and manage sponsorship plans
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { ManagementPageLayout } from '../_components/management-page-layout';
import { PlansPanelWrapper } from './_components/plans-panel-wrapper';

// =============================================================================
// Types
// =============================================================================

type PageProps = {
  params: Promise<{ id: string }>;
};

// =============================================================================
// Loading Skeleton
// =============================================================================

function PlansLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Current Plan Status */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            <div>
              <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
              <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
          <div className="h-8 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="h-6 w-20 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
            <div className="h-8 w-28 rounded bg-zinc-200 dark:bg-zinc-700 mb-4" />

            <div className="space-y-3 mb-6">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
              ))}
            </div>

            <div className="h-10 w-full rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-700 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default async function EventPlansPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Plany sponsorskie"
      description="Wybierz plan sponsorski aby zwiększyć widoczność wydarzenia"
    >
      <Suspense fallback={<PlansLoadingSkeleton />}>
        <PlansPanelWrapper eventId={id} />
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
    title: 'Plany sponsorskie | Miglee',
    description: 'Kup i zarządzaj planami sponsorskimi',
  };
}
