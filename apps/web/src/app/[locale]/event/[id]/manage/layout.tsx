/**
 * Event Management Layout
 * Layout for event management interface with sidebar and navbar
 * Only accessible to owners, moderators, and app admins/moderators
 */

import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

import { SidebarLayout } from '@/components/layout/sidebar-layout';
import {
  EventManagementSidebar,
  EventManagementNavbar,
  EventManagementGuard,
  EventManagementProvider,
} from './_components';

interface EventManagementLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

/**
 * Event Management Layout
 *
 * Uses shared SidebarLayout component for consistent structure
 *
 * Access Control:
 * - Event owner: Full access
 * - Event moderator: Full access
 * - App admin: Full access
 * - App moderator: Full access
 * - Others: Redirected to event page
 */
export default async function EventManagementLayout({
  children,
  params,
}: EventManagementLayoutProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <SidebarLayout
      sidebar={<EventManagementSidebar eventId={id} />}
      navbar={<EventManagementNavbar eventId={id} />}
      wrapper={(content) => (
        <EventManagementGuard eventId={id}>
          <EventManagementProvider eventId={id}>
            {content}
          </EventManagementProvider>
        </EventManagementGuard>
      )}
    >
      {children}
    </SidebarLayout>
  );
}
