/**
 * Event Sponsorship Plans Page
 * Purchase and manage sponsorship plans
 */

// TODO i18n: page title, description, loading text, metadata

import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { ManagementPageLayout } from '../_components/management-page-layout';
import { PlansPanelWrapper } from './_components/plans-panel-wrapper';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventPlansPage({ params }: PageProps) {
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
              <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Loading plans...
              </p>
            </div>
          </div>
        }
      >
        <PlansPanelWrapper eventId={id} />
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
