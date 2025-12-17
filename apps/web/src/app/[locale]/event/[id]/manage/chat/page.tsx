/**
 * Event Chat Management Page
 * Manage event chat and messages
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { EventChatManagement } from './_components/event-chat-management';
import { ManagementPageLayout } from '@/features/events';
import { ChatLoadingSkeleton } from '@/features/chat';

// =============================================================================
// Types
// =============================================================================

type PageProps = {
  params: Promise<{ id: string }>;
};

// =============================================================================
// Page Component
// =============================================================================

export default async function EventChatPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Czat wydarzenia"
      description="Zarządzaj komunikacją z uczestnikami"
    >
      <Suspense
        fallback={
          <div className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <div className="h-[calc(100vh-320px)] min-h-[600px]">
              <ChatLoadingSkeleton />
            </div>
          </div>
        }
      >
        <EventChatManagement eventId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

// =============================================================================
// Metadata
// =============================================================================

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await params;

  return {
    // TODO i18n
    title: 'Czat wydarzenia | Miglee',
    description: 'Zarządzaj komunikacją z uczestnikami wydarzenia',
  };
}
