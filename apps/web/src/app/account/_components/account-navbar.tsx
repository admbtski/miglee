'use client';

import { ListCollapseIcon } from 'lucide-react';
import { useState } from 'react';
import { AccountMobileSidebar } from './account-mobile-sidebar';
import { NavbarActions } from '@/components/layout/navbar-actions';

/**
 * AccountNavbar - Top bar for content area only (not sidebar)
 *
 * Features:
 * - Right-aligned elements
 * - Search, notifications, favourites, user menu
 * - Mobile menu toggle
 */
export function AccountNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left side: Mobile menu button (only on mobile) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Open menu"
          >
            <ListCollapseIcon className="h-6 w-6" />
          </button>

          {/* Spacer for desktop */}
          <div className="hidden lg:block" />

          {/* Right side: Actions */}
          <div className="flex items-center ">
            {/* Shared Actions: Notifications, Favourites, User Menu */}
            <NavbarActions />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <AccountMobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
