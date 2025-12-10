/**
 * Local Push Notifications Page
 * Send push notifications to local users
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { LocalPushPageWrapper } from './_components/local-push-page-wrapper';
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

function LocalPushLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Usage Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
              <div>
                <div className="h-7 w-10 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
                <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Send Notification Form */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-700 mb-6" />

        <div className="space-y-4">
          {/* Radius Selector */}
          <div>
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
            <div className="h-10 w-full rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>

          {/* Title Input */}
          <div>
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
            <div className="h-10 w-full rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>

          {/* Message Textarea */}
          <div>
            <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
            <div className="h-24 w-full rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>

          {/* Map Preview */}
          <div className="h-48 rounded-xl bg-zinc-200 dark:bg-zinc-700" />

          {/* Send Button */}
          <div className="flex justify-end">
            <div className="h-10 w-40 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-700 mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
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

export default async function LocalPushPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Powiadomienia lokalne"
      description="Wyślij powiadomienie push do użytkowników w okolicy wydarzenia"
    >
      <Suspense fallback={<LocalPushLoadingSkeleton />}>
        <LocalPushPageWrapper eventId={id} />
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
    title: 'Powiadomienia lokalne | Miglee',
    description: 'Zarządzaj powiadomieniami lokalnymi',
  };
}
