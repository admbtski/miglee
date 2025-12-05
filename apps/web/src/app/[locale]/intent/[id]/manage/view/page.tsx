/**
 * Intent View Page (within Management)
 * Shows the public event view inside the management interface
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IntentViewManagement } from './_components/intent-view-management';
import { ManagementPageLayout } from '../_components/management-page-layout';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IntentViewPage({ params }: PageProps) {
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
        <IntentViewManagement intentId={id} />
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
