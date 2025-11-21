import type { ReactNode } from 'react';

import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { AccountNavbar } from './_components/account-navbar';
import { AccountSidebarEnhanced } from './_components/account-sidebar-enhanced';

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
