/**
 * Intent Management Layout
 * Layout for intent management interface with sidebar and topbar
 * Only accessible to owners, moderators, and app admins/moderators
 */

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { getQueryClient } from '@/lib/config/query-client';
import { QueryClientProvider } from '@/lib/config/query-client-provider';

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
 * Structure:
 * 1. Root: Flex container (horizontal)
 *    - Sidebar (collapsible: 256px ↔ 80px)
 *    - Content area (flex: 1)
 *
 * 2. Sidebar (left column)
 *    - Full height (100vh) vertical bar
 *    - Collapsible with toggle button
 *    - Navigation items for management
 *
 * 3. Content area (right column)
 *    - Topbar (header with actions)
 *    - Main scrollable content
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

  const client = getQueryClient();

  return (
    <QueryClientProvider>
      <HydrationBoundary state={dehydrate(client)}>
        <ErrorBoundary>
          <IntentManagementGuard intentId={id}>
            <IntentManagementProvider intentId={id}>
              <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
                {/* Sidebar: Collapsible, full height, navigation */}
                <IntentManagementSidebar intentId={id} />

                {/* Content area: Flex-1, contains navbar + main content */}
                <div className="flex flex-1 flex-col">
                  {/* Navbar: Top bar (only for content area, not sidebar) */}
                  <IntentManagementNavbar intentId={id} />

                  {/* Main scrollable wrapper */}
                  <main className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                      <ErrorBoundary>{children}</ErrorBoundary>
                    </div>
                  </main>
                </div>
              </div>
            </IntentManagementProvider>
          </IntentManagementGuard>
        </ErrorBoundary>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
