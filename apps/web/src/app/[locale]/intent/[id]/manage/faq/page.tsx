/**
 * FAQ Management Page
 * Allows event owner/moderators to manage frequently asked questions
 */

import { Suspense } from 'react';
import { ManagementPageLayout } from '../_components/management-page-layout';
import { FaqManagementClient } from './_components/faq-management-client';

interface FaqPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function FaqPage({ params }: FaqPageProps) {
  const { id: intentId } = await params;

  return (
    <ManagementPageLayout
      title="FAQ"
      description="Manage frequently asked questions for your event"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Loading FAQ...
              </p>
            </div>
          </div>
        }
      >
        <FaqManagementClient intentId={intentId} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata() {
  return {
    title: 'FAQ | Miglee',
    description: 'Manage event FAQ',
  };
}
