'use client';

import { useState } from 'react';
import { ListCollapseIcon } from 'lucide-react';

import { NavbarActions } from '@/components/layout/navbar-actions';

import { AccountMobileSidebar } from './account-mobile-sidebar';

export function AccountNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between h-16 px-6">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 transition-colors rounded-lg lg:hidden text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Open menu"
            /* TODO i18n: menu button aria label */
          >
            <ListCollapseIcon className="w-6 h-6" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center ">
            <NavbarActions />
          </div>
        </div>
      </header>

      <AccountMobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
