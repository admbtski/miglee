/**
 * Event Chat Management Page
 * Manage event chat and messages
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { EventChatManagement } from './_components/event-chat-management';
import { ManagementPageLayout } from '../_components/management-page-layout';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventChatPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Event Chat"
      description="Manage communication with event participants"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Loading chat...
              </p>
            </div>
          </div>
        }
      >
        <EventChatManagement eventId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Chat Management | Miglee',
    description: 'Manage event chat',
  };
}
