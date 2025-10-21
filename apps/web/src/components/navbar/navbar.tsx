'use client';

import { Bell, Globe, Heart, Menu as MenuIcon } from 'lucide-react';
import { useState } from 'react';

import { CreateIntentModal } from '@/components/create-intent/create-intent-modal';
import { AuthModalDev } from '@/components/auth/auth-modal-dev';
import { useMeQuery } from '@/hooks/graphql/auth';

import { NavDrawer } from './nav-drawer';
import { UserMenuControlled } from './user-menu-controlled';
import { CreateIntentModalConnect } from '../create-intent/create-intent-modal-connect';

export type NavbarProps = {
  searchBar?: React.ReactNode;
  mobileSearchButton?: React.ReactNode;
};

type IconComp = React.ComponentType<{ className?: string }>;

function IconButton({
  icon: Icon,
  label,
  onClick,
  className = '',
}: {
  icon: IconComp;
  label: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`cursor-pointer rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${className}`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

export function Navbar({ searchBar, mobileSearchButton }: NavbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'signin' | 'signup'>(
    'signin'
  );

  const { data } = useMeQuery();

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white/70 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-8xl">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-500 to-cyan-500" />
            <span className="text-lg font-semibold tracking-tight">
              miglee.pl
            </span>
          </a>

          {/* Desktop search bar */}
          <div className="flex-1 hidden mx-3 md:block">{searchBar}</div>

          {/* Right actions (desktop) */}
          <div className="items-center hidden gap-2 ml-auto md:flex">
            <button
              onClick={() => setNewOpen(true)}
              className="px-4 py-2 text-sm border rounded-full border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Post an event
            </button>

            {!data?.me ? (
              <button
                onClick={() => {
                  setAuthDefaultTab('signin');
                  setAuthOpen(true);
                }}
                className="px-4 py-2 text-sm font-medium rounded-full bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                Sign in
              </button>
            ) : (
              <UserMenuControlled
                onNavigate={(key) => console.log('navigate:', key)}
              />
            )}

            {[
              { icon: Heart, label: 'Favourites' },
              { icon: Bell, label: 'Notifications' },
              { icon: Globe, label: 'Language' },
            ].map(({ icon: Icon, label }) => (
              <IconButton key={label} icon={Icon} label={label} />
            ))}

            <IconButton
              icon={MenuIcon}
              label="Menu"
              onClick={() => setDrawerOpen(true)}
            />
          </div>

          {/* Mobile actions */}
          <div className="flex items-center justify-end flex-1 gap-2 md:hidden">
            {mobileSearchButton}

            <button
              onClick={() => {
                setAuthDefaultTab('signin');
                setAuthOpen(true);
              }}
              className="px-4 py-2 text-sm font-medium rounded-full bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
            >
              Sign in
            </button>
            <IconButton
              icon={MenuIcon}
              label="Menu"
              onClick={() => setDrawerOpen(true)}
            />
          </div>
        </div>
      </nav>

      {/* Drawer */}
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Modals */}
      <AuthModalDev
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authDefaultTab}
      />

      <CreateIntentModalConnect
        open={newOpen}
        onClose={() => setNewOpen(false)}
      />
    </>
  );
}
