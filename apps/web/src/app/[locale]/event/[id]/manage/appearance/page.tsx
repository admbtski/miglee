/**
 * Appearance Page
 * Customize event card and detail appearance
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { AppearancePageWrapper } from './_components/appearance-page-wrapper';
import { ManagementPageLayout } from '../_components';

// =============================================================================
// Types
// =============================================================================

type PageProps = {
  params: Promise<{ id: string }>;
};

// =============================================================================
// Loading Skeleton
// =============================================================================

function AppearanceLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Preview Card Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-700 mb-4" />
        <div className="h-48 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Options Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gradient Picker */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-5 w-36 rounded bg-zinc-200 dark:bg-zinc-700 mb-4" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-12 w-full rounded-xl bg-zinc-200 dark:bg-zinc-700"
              />
            ))}
          </div>
        </div>

        {/* Glow Picker */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-700 mb-4" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-12 w-full rounded-full bg-zinc-200 dark:bg-zinc-700"
              />
            ))}
          </div>
        </div>
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

export default async function AppearanceManagePage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Wygląd wydarzenia"
      description="Dostosuj wygląd karty i strony szczegółów wydarzenia"
    >
      <Suspense fallback={<AppearanceLoadingSkeleton />}>
        <AppearancePageWrapper eventId={id} />
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
    title: 'Wygląd wydarzenia | Miglee',
    description: 'Dostosuj wygląd karty i strony szczegółów wydarzenia',
  };
}
