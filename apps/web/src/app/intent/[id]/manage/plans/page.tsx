/**
 * Intent Sponsorship Plans Page
 * Purchase and manage sponsorship plans
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PlansPanelWrapper } from './_components/plans-panel-wrapper';
import { ManagementPageLayout } from '../_components/management-page-layout';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IntentPlansPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Sponsorship Plans"
      description="Choose a sponsorship plan to boost your event's visibility"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Loading plans...
              </p>
            </div>
          </div>
        }
      >
        <PlansPanelWrapper intentId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Sponsorship Plans | Miglee',
    description: 'Purchase and manage sponsorship plans',
  };
}
