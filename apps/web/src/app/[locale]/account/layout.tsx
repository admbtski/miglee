import type { ReactNode } from 'react';

import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { AccountNavbar, AccountSidebarEnhanced } from '@/features/account';

/**
 * Account Layout - Clean Architecture with Enhanced Sidebar
 *
 * Uses shared SidebarLayout component for consistent structure
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarLayout
      sidebar={<AccountSidebarEnhanced />}
      navbar={<AccountNavbar />}
    >
      {children}
    </SidebarLayout>
  );
}
