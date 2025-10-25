'use client';

import { Bell, Globe, Heart, Menu as MenuIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

import { AuthModalDev } from '@/components/auth/auth-modal-dev';
import { useMeQuery } from '@/hooks/graphql/auth';
import { CreateEditIntentModalConnect } from '../create-edit-intent/create-edit-intent-modal-connect';
import { NavDrawer } from './nav-drawer';
import { UserMenuControlled } from './user-menu-controlled';

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
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`cursor-pointer rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${className}`}
    >
      <Icon className="h-5 w-5" aria-hidden />
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
  const isAuthed = !!data?.me;

  const openPost = useCallback(() => setNewOpen(true), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const openAuthSignin = useCallback(() => {
    setAuthDefaultTab('signin');
    setAuthOpen(true);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white/70 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="mx-auto flex max-w-8xl items-center gap-3 px-4 py-3">
          {/* Logo */}
          <a
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label="Go to homepage"
          >
            <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-indigo-500 to-cyan-500" />
            <span className="text-lg font-semibold tracking-tight">
              miglee.pl
            </span>
          </a>

          {/* Desktop search bar */}
          <div className="mx-3 hidden flex-1 md:block">{searchBar}</div>

          {/* Right actions (desktop) */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={openPost}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Post an event
            </button>

            {!isAuthed ? (
              <button
                type="button"
                onClick={openAuthSignin}
                className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
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

            <IconButton icon={MenuIcon} label="Menu" onClick={openDrawer} />
          </div>

          {/* Mobile actions */}
          <div className="flex flex-1 items-center justify-end gap-2 md:hidden">
            {mobileSearchButton}

            {!isAuthed ? (
              <button
                type="button"
                onClick={openAuthSignin}
                className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                Sign in
              </button>
            ) : (
              <UserMenuControlled
                onNavigate={(key) => console.log('navigate:', key)}
              />
            )}

            <button
              type="button"
              onClick={openPost}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              aria-label="Post an event"
              title="Post an event"
            >
              + Event
            </button>

            <IconButton icon={MenuIcon} label="Menu" onClick={openDrawer} />
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
      <CreateEditIntentModalConnect
        open={newOpen}
        onClose={() => setNewOpen(false)}
      />
    </>
  );
}
