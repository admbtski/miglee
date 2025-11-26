/**
 * Intent Active Subscription Page
 * Manage active sponsorship subscription
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { SubscriptionPanelWrapper } from './_components/subscription-panel-wrapper';
import { ManagementPageLayout } from '../_components/management-page-layout';
import { PaymentResultModal } from '@/components/billing/payment-result-modal';

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
      title="Aktywny plan sponsorowania"
      description="Zarządzaj aktywnym planem sponsorowania i promuj swoje wydarzenie"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Ładowanie planu...
              </p>
            </div>
          </div>
        }
      >
        <SubscriptionPanelWrapper intentId={id} />
      </Suspense>

      <Suspense fallback={null}>
        <PaymentResultModal context="event" />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Aktywny plan sponsorowania | Miglee',
    description: 'Zarządzaj aktywnym planem sponsorowania wydarzenia',
  };
}
