/**
 * Intent Active Subscription Page
 * Manage active sponsorship subscription
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { SubscriptionPanelWrapper } from './_components/subscription-panel-wrapper';
import { ManagementPageLayout } from '../_components/management-page-layout';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IntentSubscriptionPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Active Subscription"
      description="Manage your active sponsorship plan and boost your event"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Loading subscription...
              </p>
            </div>
          </div>
        }
      >
        <SubscriptionPanelWrapper intentId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Active Subscription | Miglee',
    description: 'Manage active sponsorship subscription',
  };
}
