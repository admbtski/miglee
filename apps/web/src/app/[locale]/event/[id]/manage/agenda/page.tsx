/**
 * Agenda Management Page
 * Allows event organizers to manage the event agenda/schedule
 */

// TODO i18n: All hardcoded strings need translation keys

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ManagementPageLayout } from '../_components/management-page-layout';
import { AgendaManagementClient } from './_components/agenda-management-client';

// TODO i18n: metadata title and description
export const metadata: Metadata = {
  title: 'Agenda | Miglee',
  description: 'Manage your event agenda and schedule',
};

interface AgendaPageProps {
  params: Promise<{ id: string }>;
}

export default async function AgendaPage({ params }: AgendaPageProps) {
  const { id: eventId } = await params;

  return (
    <ManagementPageLayout
      title="Agenda"
      description="Zarządzaj programem wydarzenia"
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[200px]">
            {/* TODO i18n: Loading fallback text */}
            <div className="w-8 h-8 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent" />
          </div>
        }
      >
        <AgendaManagementClient eventId={eventId} />
      </Suspense>
    </ManagementPageLayout>
  );
}
