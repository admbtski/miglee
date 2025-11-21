/**
 * Intent Danger Zone Page
 * Cancel or delete event
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IntentDangerZone } from './_components/intent-danger-zone';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IntentDangerPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <IntentDangerZone intentId={id} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Danger Zone | Miglee',
    description: 'Cancel or delete event',
  };
}
