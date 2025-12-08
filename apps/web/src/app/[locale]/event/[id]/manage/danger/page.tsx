/**
 * Event Danger Zone Page
 * Cancel or delete event
 */

// TODO: Add i18n for page title, description, and loading text

import { Suspense } from 'react';
import { notFound } from 'next/navigation';

// Local components
import { EventDangerZone } from './_components/event-danger-zone';
import { ManagementPageLayout } from '../_components/management-page-layout';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDangerPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Danger Zone"
      description="Irreversible actions for your event"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-red-600 dark:border-zinc-700 dark:border-t-red-400" />
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Loading...
              </p>
            </div>
          </div>
        }
      >
        <EventDangerZone eventId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Danger Zone | Miglee',
    description: 'Cancel or delete event',
  };
}
