/**
 * Event Invite Links Management Page
 * Manage event invite links
 */

// TODO: Add i18n for page title, description, and loading text

import { Suspense } from 'react';
import { notFound } from 'next/navigation';

// Local components
import { InviteLinksPanel } from './_components/invite-links-panel';
import { ManagementPageLayout } from '../_components/management-page-layout';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventInviteLinksPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Invite Links"
      description="Create and manage invite links for your event"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Loading invite links...
              </p>
            </div>
          </div>
        }
      >
        <InviteLinksPanel eventId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Invite Links | Miglee',
    description: 'Manage event invite links',
  };
}
