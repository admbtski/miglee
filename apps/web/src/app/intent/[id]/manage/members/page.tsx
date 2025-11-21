/**
 * Intent Members Management Page
 * Manage event members, roles, and permissions
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IntentMembersManagementConnect } from './_components/intent-members-management-connect';
import { ManagementPageLayout } from '../_components/management-page-layout';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IntentMembersPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Members"
      description="Manage event members, roles, and permissions"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Loading members...
              </p>
            </div>
          </div>
        }
      >
        <IntentMembersManagementConnect intentId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Manage Members | Miglee',
    description: 'Manage event members',
  };
}
