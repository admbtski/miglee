/**
 * Event Feedback Management Page
 * Configure feedback questions and view results
 */

// TODO: Add i18n for page title, description, and loading text

import { Suspense } from 'react';
import { notFound } from 'next/navigation';

// Local components
import { FeedbackPanel } from './_components/feedback-panel';
import { ManagementPageLayout } from '../_components/management-page-layout';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventFeedbackPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Feedback"
      description="Configure post-event feedback and view results"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Loading feedback...
              </p>
            </div>
          </div>
        }
      >
        <FeedbackPanel eventId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Feedback | Miglee',
    description: 'Manage event feedback',
  };
}
