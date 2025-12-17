import type { ReactNode } from 'react';

import { SidebarLayout } from '@/components/layout/sidebar-layout';
import {
  AccountGuard,
  AccountNavbar,
  AccountProvider,
  AccountSidebarEnhanced,
} from '@/features/account';
import { QueryClientProvider } from '@/lib/config/query-client-provider';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/config/query-client';

/**
 * Account Layout
 *
 * Protected layout for authenticated users only.
 * Provides user data context and authentication guard.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  const client = getQueryClient();

  return (
    <QueryClientProvider>
      <HydrationBoundary state={dehydrate(client)}>
        <AccountGuard>
          <AccountProvider>
            <SidebarLayout
              sidebar={<AccountSidebarEnhanced />}
              navbar={<AccountNavbar />}
            >
              {children}
            </SidebarLayout>
          </AccountProvider>
        </AccountGuard>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
