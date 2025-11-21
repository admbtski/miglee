/**
 * Sidebar Layout Component
 * Reusable layout with sidebar and navbar structure
 * Used in /account and /intent/[id]/manage
 */

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { getQueryClient } from '@/lib/config/query-client';
import { QueryClientProvider } from '@/lib/config/query-client-provider';

interface SidebarLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  navbar: ReactNode;
  /**
   * Optional wrapper component (e.g., guards, providers)
   * If provided, it should render children
   */
  wrapper?: (content: ReactNode) => ReactNode;
}

/**
 * Sidebar Layout
 *
 * Structure:
 * 1. Root: Flex container (horizontal)
 *    - Sidebar (collapsible: 280px ↔ 80px)
 *    - Content area (flex: 1)
 *
 * 2. Sidebar (left column)
 *    - Full height (100vh) vertical bar
 *    - Collapsible with toggle button
 *    - Navigation items
 *
 * 3. Content area (right column)
 *    - Navbar (top bar with right-aligned elements)
 *    - Main scrollable wrapper with padding
 */
export function SidebarLayout({
  children,
  sidebar,
  navbar,
  wrapper,
}: SidebarLayoutProps) {
  const client = getQueryClient();

  const layoutContent = (
    <div className="flex bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Sidebar: Sticky, full height, navigation */}
      <div className="sticky top-0 h-screen">{sidebar}</div>

      {/* Content area: Flex-1, contains navbar + main content */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Navbar: Top bar (only for content area, not sidebar) */}
        {navbar}

        {/* Main scrollable wrapper */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );

  const content = wrapper ? wrapper(layoutContent) : layoutContent;

  return (
    <QueryClientProvider>
      <HydrationBoundary state={dehydrate(client)}>
        <ErrorBoundary>{content}</ErrorBoundary>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
