/**
 * Conditional Navbar
 * Shows navbar only when not in management mode
 */

'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';

/**
 * Conditional Navbar Component
 * Hides navbar when in /manage routes
 */
export function ConditionalNavbar() {
  const pathname = usePathname();

  // Hide navbar in management interface
  const isManagementRoute = pathname?.includes('/manage');

  if (isManagementRoute) {
    return null;
  }

  return <Navbar />;
}
