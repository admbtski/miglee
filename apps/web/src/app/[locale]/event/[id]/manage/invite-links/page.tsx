/**
 * Event Invite Links Management Page
 * Manage event invite links
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { InviteLinksPanel } from './_components/invite-links-panel';
import { ManagementPageLayout } from '../_components/management-page-layout';

// =============================================================================
// Types
// =============================================================================

type PageProps = {
  params: Promise<{ id: string }>;
};

// =============================================================================
// Loading Skeleton
// =============================================================================

function InviteLinksLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Create Link Button Skeleton */}
      <div className="flex justify-end">
        <div className="h-10 w-44 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Links List Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700 ml-auto" />
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>

        {/* Table Rows */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              <div>
                <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-700 mb-1" />
                <div className="h-3 w-56 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
            <div className="h-6 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-6 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner Skeleton */}
      <div className="h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default async function EventInviteLinksPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Linki zaproszeniowe"
      description="Twórz i zarządzaj linkami zaproszeniowymi"
    >
      <Suspense fallback={<InviteLinksLoadingSkeleton />}>
        <InviteLinksPanel eventId={id} />
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
    title: 'Linki zaproszeniowe | Miglee',
    description: 'Zarządzaj linkami zaproszeniowymi wydarzenia',
  };
}
