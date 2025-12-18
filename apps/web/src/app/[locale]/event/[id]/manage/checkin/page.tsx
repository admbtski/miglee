/**
 * Check-in & Presence Management Page
 * Full implementation of check-in system for event organizers
 */

// TODO i18n: metadata title and description

'use client';

import { Suspense, useRef } from 'react';
import { notFound, useParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

import {
  CheckinManagementClient,
  type CheckinManagementRef,
} from './_components/checkin-management-client';
import { CheckinPanelWrapper } from './_components/checkin-panel-wrapper';
import { ManagementPageLayout } from '@/features/events';
import { useEventManagement } from '@/features/events';

// =============================================================================
// Loading Skeleton
// =============================================================================

function CheckinLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>

      {/* Tabs */}
      <div className="h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />

      {/* Content */}
      <div className="h-96 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4">
          <div className="h-6 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-64 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default function EventCheckinPage() {
  const params = useParams();
  const id = params?.id as string;
  const { isLoading } = useEventManagement();
  const checkinRef = useRef<CheckinManagementRef>(null);

  if (!id) {
    notFound();
  }

  const handleRefresh = async () => {
    // Call the refresh method exposed by CheckinManagementClient
    await checkinRef.current?.refresh();
  };

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Check-in & Presence"
      description="Manage attendee check-ins and track event presence"
      actions={
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      }
    >
      <Suspense fallback={<CheckinLoadingSkeleton />}>
        <CheckinPanelWrapper eventId={id}>
          <CheckinManagementClient ref={checkinRef} />
        </CheckinPanelWrapper>
      </Suspense>
    </ManagementPageLayout>
  );
}

// =============================================================================
// Metadata
// =============================================================================

// Metadata is not supported for client components
// If needed, move metadata generation to parent layout
