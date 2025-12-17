/**
 * Event Management Dashboard Page
 * Overview and quick stats for event management
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';

// Event management components
import { EventManagementDashboard } from '@/features/events';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventManagementPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
            {/* TODO i18n: loading text */}
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Loading dashboard...
            </p>
          </div>
        </div>
      }
    >
      <EventManagementDashboard eventId={id} />
    </Suspense>
  );
}

// TODO i18n: metadata title and description
export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Manage Event | Miglee',
    description: 'Manage your event',
  };
}
