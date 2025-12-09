/**
 * Event Management Navbar
 * Top bar for management interface content area
 */

// TODO i18n: aria-label for mobile menu button

'use client';

import { ListCollapseIcon } from 'lucide-react';
import { useState } from 'react';
import { NavbarActions } from '@/components/layout/navbar-actions';
import { EventManagementMobileSidebar } from './event-management-mobile-sidebar';

interface EventManagementNavbarProps {
  eventId: string;
}

/**
 * EventManagementNavbar - Top bar for content area
 *
 * Features:
 * - Right-aligned elements (notifications, user menu)
 * - Mobile menu toggle
 * - Sticky positioning
 */
export function EventManagementNavbar({ eventId }: EventManagementNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left side: Mobile menu button (only on mobile) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:hidden"
            aria-label="Open menu"
          >
            <ListCollapseIcon className="h-6 w-6" />
          </button>

          {/* Spacer for desktop */}
          <div className="hidden lg:block" />

          {/* Right side: Actions */}
          <div className="flex items-center">
            {/* Shared Actions: Notifications, Favourites, User Menu */}
            <NavbarActions />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <EventManagementMobileSidebar
        eventId={eventId}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
