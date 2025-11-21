/**
 * Intent Settings Management Page
 * Manage event settings and configuration
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IntentSettingsManagement } from './_components/intent-settings-management';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IntentSettingsPage({ params }: PageProps) {
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
              Loading settings...
            </p>
          </div>
        </div>
      }
    >
      <IntentSettingsManagement intentId={id} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Event Settings | Miglee',
    description: 'Manage event settings',
  };
}
