/**
 * Event Boost Page
 * Manage event boosts from active subscription
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { BoostPageWrapper } from './_components/boost-page-wrapper';
import { ManagementPageLayout } from '../_components';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventBoostPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Podbicia wydarzenia"
      description="Podbij swoje wydarzenie w górę listy i zwiększ widoczność"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Ładowanie...
              </p>
            </div>
          </div>
        }
      >
        <BoostPageWrapper eventId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Podbicia wydarzenia | Miglee',
    description: 'Zarządzaj podbiciami wydarzenia',
  };
}
