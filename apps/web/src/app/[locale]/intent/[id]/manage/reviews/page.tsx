/**
 * Intent Reviews Management Page
 * View and moderate reviews
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IntentReviewsManagement } from './_components/intent-reviews-management';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IntentReviewsPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Loading reviews...
            </p>
          </div>
        </div>
      }
    >
      <IntentReviewsManagement intentId={id} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Reviews | Miglee',
    description: 'Manage event reviews',
  };
}
