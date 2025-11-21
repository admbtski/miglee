import type { ReactNode } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { getQueryClient } from '@/lib/config/query-client';
import { QueryClientProvider } from '@/lib/config/query-client-provider';

import { AccountSidebarEnhanced } from './_components/account-sidebar-enhanced';
import { AccountNavbar } from './_components/account-navbar';

/**
 * Account Layout - Clean Architecture with Enhanced Sidebar
 *
 * Structure:
 * 1. Root: Flex container (horizontal)
 *    - Sidebar (collapsible: 280px ↔ 80px)
 *    - Content area (flex: 1)
 *
 * 2. Sidebar (left column)
 *    - Full height (100vh) vertical bar
 *    - Collapsible with toggle button
 *    - Grouped navigation (primary, secondary, tools)
 *    - Divided into: top (logo + toggle), middle (nav items - scrollable), bottom (user zone)
 *
 * 3. Content area (right column)
 *    - Navbar (top bar with right-aligned elements)
 *    - Main scrollable wrapper with padding
 *    - Contains: Header section (title + tabs) + Body section
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  const client = getQueryClient();

  return (
    <QueryClientProvider>
      <HydrationBoundary state={dehydrate(client)}>
        <ErrorBoundary>
          {/* Root: Horizontal flex container */}
          <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-1000">
            {/* Enhanced Sidebar: Collapsible, full height, grouped navigation */}
            <AccountSidebarEnhanced />

            {/* Content area: Flex-1, contains navbar + main content */}
            <div className="flex flex-1 flex-col">
              {/* Navbar: Top bar (only for content area, not sidebar) */}
              <AccountNavbar />

              {/* Main scrollable wrapper */}
              <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                  <ErrorBoundary>{children}</ErrorBoundary>
                </div>
              </main>
            </div>
          </div>
        </ErrorBoundary>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
