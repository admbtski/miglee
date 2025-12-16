/**
 * Event Members Management Page
 * Manage event members, roles, and permissions
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { EventMembersManagementConnect } from './_components/event-members-management-connect';
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

function MembersLoadingSkeleton() {
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
                <div className="h-7 w-8 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
                <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions Bar Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-64 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-10 w-32 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Members List Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700 ml-auto" />
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>

        {/* Table Rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
          >
            <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700 mb-1" />
              <div className="h-3 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="h-6 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-6 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default async function EventMembersPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Członkowie"
      description="Zarządzaj uczestnikami, rolami i uprawnieniami"
    >
      <Suspense fallback={<MembersLoadingSkeleton />}>
        <EventMembersManagementConnect eventId={id} />
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
    title: 'Członkowie | Miglee',
    description: 'Zarządzaj uczestnikami wydarzenia',
  };
}
