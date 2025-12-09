/**
 * Event View Page (within Management)
 * Shows the public event view inside the management interface
 */

// TODO i18n: page title, description, loading text, metadata

import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { ManagementPageLayout } from '../_components/management-page-layout';
import { EventViewManagement } from './_components/event-view-management';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventViewPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Event Preview"
      description="See how your event appears to visitors"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Loading event preview...
              </p>
            </div>
          </div>
        }
      >
        <EventViewManagement eventId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'View Event | Miglee',
    description: 'View event details',
  };
}
