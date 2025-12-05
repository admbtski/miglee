/**
 * Intent Comments Management Page
 * View and moderate comments
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IntentCommentsManagement } from './_components/intent-comments-management';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IntentCommentsPage({ params }: PageProps) {
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
              Loading comments...
            </p>
          </div>
        </div>
      }
    >
      <IntentCommentsManagement intentId={id} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Comments | Miglee',
    description: 'Manage event comments',
  };
}
