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
      description="Zarządzaj najczęściej zadawanymi pytaniami dla tego wydarzenia"
      backHref={`/intent/${intentId}/manage`}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent" />
          </div>
        }
      >
        <FaqManagementClient intentId={intentId} />
      </Suspense>
    </ManagementPageLayout>
  );
}
