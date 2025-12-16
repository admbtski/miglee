/**
 * Event Join Form Management Page
 * Manage event join form and questions
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { JoinFormManagementClient } from './_components/join-form-management-client';
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

function JoinFormLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Info Banner */}
      <div className="h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20" />

      {/* Form Preview */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-40 rounded bg-zinc-200 dark:bg-zinc-700 mb-6" />

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-6 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>

      {/* Add Question Button */}
      <div className="flex justify-center">
        <div className="h-10 w-40 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <div className="h-10 w-32 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default async function EventJoinFormPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Formularz dołączenia"
      description="Konfiguruj pytania w formularzu dołączenia"
    >
      <Suspense fallback={<JoinFormLoadingSkeleton />}>
        <JoinFormManagementClient eventId={id} />
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
    title: 'Formularz dołączenia | Miglee',
    description: 'Zarządzaj formularzem dołączenia do wydarzenia',
  };
}
