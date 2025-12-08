/**
 * Event Join Form Management Page
 * Manage event join form and questions
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { JoinFormManagementClient } from './_components/join-form-management-client';
import { ManagementPageLayout } from '../_components/management-page-layout';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventJoinFormPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Join Form"
      description="Configure join form questions for your event"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Loading join form...
              </p>
            </div>
          </div>
        }
      >
        <JoinFormManagementClient eventId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Join Form | Miglee',
    description: 'Manage event join form',
  };
}
