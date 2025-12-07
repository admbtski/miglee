'use client';

import { Bell, Heart, Menu as MenuIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalePath } from '@/hooks/use-locale-path';

import { AuthModalDev } from '@/features/auth/components/auth-modal-dev';
import { useMeQuery } from '@/lib/api/auth';
import { NavDrawer } from './nav-drawer';
import { UserMenuControlled } from './user-menu-controlled';
import { NotificationBell } from '@/features/notifications/components/notifications-bell';
import { FavouritesBell } from '@/features/favourites/components/favourites-bell';

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
  const router = useRouter();
  const { localePath } = useLocalePath();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'signin' | 'signup'>(
    'signin'
  );

  const { data } = useMeQuery();
  const isAuthed = !!data?.me;

  const openPost = useCallback(() => {
    router.push(localePath('/intent/new'));
  }, [router, localePath]);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const openAuthSignin = useCallback(() => {
    setAuthDefaultTab('signin');
    setAuthOpen(true);
  }, []);

  const handleLogoClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      router.push(localePath('/'));
    },
    [router, localePath]
  );

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-zinc-200  backdrop-blur-xl dark:border-zinc-800  bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="mx-auto flex max-w-8xl items-center gap-3 px-4 py-3">
          {/* Logo */}
          <a
            href={localePath('/')}
            onClick={handleLogoClick}
            className="flex shrink-0 items-center gap-2"
            aria-label="Go to homepage"
          >
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              miglee
            </span>
            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
              .pl
            </span>
          </a>

          {/* Desktop search bar */}
          <div className="mx-3 hidden flex-1 md:block max-w-2xl">
            {searchBar}
          </div>

          {/* Right actions (desktop) */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={openPost}
              className="cursor-pointer rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors"
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

            {isAuthed ? (
              <NotificationBell
                recipientId={data.me?.id!}
                limit={10}
                className=""
              />
            ) : (
              // jeśli nie zalogowany – zwykły przycisk (bez dropdownu)
              <button
                type="button"
                onClick={openAuthSignin}
                className="cursor-pointer rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" aria-hidden />
              </button>
            )}

            {isAuthed ? (
              <FavouritesBell />
            ) : (
              <button
                type="button"
                onClick={openAuthSignin}
                className="cursor-pointer rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title="Favourites"
                aria-label="Favourites"
              >
                <Heart className="h-5 w-5" aria-hidden />
              </button>
            )}

            <IconButton icon={MenuIcon} label="Menu" onClick={openDrawer} />
          </div>

          {/* Mobile actions */}
          <div className="flex flex-1 items-center justify-end gap-1 md:hidden">
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
              <>
                <FavouritesBell />
                <NotificationBell recipientId={data.me?.id!} limit={8} />
                <UserMenuControlled
                  onNavigate={(key) => console.log('navigate:', key)}
                />
              </>
            )}

            <button
              type="button"
              onClick={openPost}
              className="cursor-pointer rounded-full border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 flex-nowrap text-nowrap transition-colors"
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
    </>
  );
}
