/**
 * Intent Management Layout
 * Layout for intent management interface with sidebar and navbar
 * Only accessible to owners, moderators, and app admins/moderators
 */

import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

import { SidebarLayout } from '@/components/layout/sidebar-layout';
import {
  IntentManagementSidebar,
  IntentManagementNavbar,
  IntentManagementGuard,
  IntentManagementProvider,
} from './_components';

interface IntentManagementLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

/**
 * Intent Management Layout
 *
 * Uses shared SidebarLayout component for consistent structure
 *
 * Access Control:
 * - Intent owner: Full access
 * - Intent moderator: Full access
 * - App admin: Full access
 * - App moderator: Full access
 * - Others: Redirected to event page
 */
export default async function IntentManagementLayout({
  children,
  params,
}: IntentManagementLayoutProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <SidebarLayout
      sidebar={<IntentManagementSidebar intentId={id} />}
      navbar={<IntentManagementNavbar intentId={id} />}
      wrapper={(content) => (
        <IntentManagementGuard intentId={id}>
          <IntentManagementProvider intentId={id}>
            {content}
          </IntentManagementProvider>
        </IntentManagementGuard>
      )}
    >
      {children}
    </SidebarLayout>
  );
}
