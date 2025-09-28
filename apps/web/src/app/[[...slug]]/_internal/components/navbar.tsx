'use client';

import {
  Bell,
  Filter,
  Globe,
  Heart,
  MapPinIcon,
  Menu as MenuIcon,
  Ruler as RulerIcon,
  Search,
  SearchIcon,
} from 'lucide-react';
import { useState } from 'react';
import { NavDrawer } from './nav-drawer';
import { AuthModal } from '@/app/components/auth/auth-modal';
import { UserMenu } from './user-menu';

export function Navbar({
  q,
  city,
  distanceKm,
  onOpenFilters,
  activeFilters,
}: {
  q: string;
  city: string | null;
  distanceKm: number;
  onOpenFilters: () => void;
  activeFilters: number;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>(
    'login'
  );

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white/70 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-8xl">
          {/* Logo */}
          <a className="flex items-center gap-2 shrink-0" href="/">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-500 to-cyan-500" />
            <span className="text-lg font-semibold tracking-tight">
              miglee.pl
            </span>
          </a>

          {/* Big glowing segmented search bar (desktop) */}
          <div className="flex-1 hidden mx-3 md:block">
            <div className="relative">
              <div
                className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-80 blur-xl
                [background:conic-gradient(from_200deg,theme(colors.orange.200),theme(colors.pink.300),theme(colors.indigo.300),theme(colors.cyan.300))] "
              />
              <div className="rounded-full p-[2px] bg-[linear-gradient(90deg,theme(colors.orange.200),theme(colors.pink.300),theme(colors.indigo.300),theme(colors.cyan.300))] shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
                <div className="flex items-center py-2 pl-4 pr-1 text-sm rounded-full bg-white/90 text-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-100">
                  {/* search segment */}
                  <button
                    onClick={onOpenFilters}
                    className="flex items-center flex-1 min-w-0 gap-2 text-left cursor-pointer hover:opacity-90"
                  >
                    <Search className="w-5 h-5 opacity-60" />
                    <span className={`truncate ${q ? '' : 'opacity-60'}`}>
                      {q || 'Search: Job title, company, keyword'}
                    </span>
                  </button>

                  <div className="w-px h-5 mx-3 bg-zinc-300/70 dark:bg-zinc-700/70" />

                  {/* city segment */}
                  <button
                    onClick={onOpenFilters}
                    className="flex items-center gap-2 cursor-pointer shrink-0 hover:opacity-90"
                  >
                    <MapPinIcon className="w-5 h-5 opacity-60" />
                    <span className={`${city ? '' : 'opacity-60'}`}>
                      {city || 'Dowolne'}
                    </span>
                  </button>

                  <div className="w-px h-5 mx-3 bg-zinc-300/70 dark:bg-zinc-700/70" />

                  {/* distance segment */}
                  <button
                    onClick={onOpenFilters}
                    className="flex items-center gap-2 pr-2 cursor-pointer shrink-0 hover:opacity-90"
                  >
                    <RulerIcon className="w-5 h-5 opacity-60" />
                    <span
                      className={`${distanceKm !== 30 ? '' : 'opacity-60'}`}
                    >
                      {distanceKm} km
                    </span>
                  </button>

                  <div className="w-px h-5 mx-3 bg-zinc-300/70 dark:bg-zinc-700/70" />

                  {/* 4. Filtry + badge z liczbą */}
                  <button
                    onClick={onOpenFilters}
                    className="flex items-center gap-2 pr-2 cursor-pointer shrink-0 hover:opacity-90"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="w-5 h-5 opacity-60" />
                      <span className={activeFilters > 0 ? '' : 'opacity-60'}>
                        Filtry
                      </span>
                      {activeFilters > 0 && (
                        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[12px] text-white shadow-sm ring-1 ring-black/5">
                          {activeFilters}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* CTA circle */}
                  <button
                    onClick={() => {}}
                    className="grid w-8 h-8 text-white rounded-full shadow-lg cursor-pointer place-items-center bg-gradient-to-tr from-pink-500 to-violet-600 hover:brightness-110"
                    aria-label="Search"
                  >
                    <SearchIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="items-center hidden gap-2 ml-auto md:flex">
            <button className="px-4 py-2 text-sm border rounded-full cursor-pointer border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
              Post an event
            </button>
            <button
              className="px-4 py-2 text-sm font-medium rounded-full cursor-pointer bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              onClick={() => {
                setAuthDefaultTab('login');
                setAuthOpen(true);
              }}
            >
              Sign in
            </button>
            <UserMenu
              user={{
                name: 'Jan Kowalski',
                email: 'jan@kowalski.pl',
                avatarUrl: 'https://picsum.photos/id/99/200/300',
              }}
              onNavigate={(key) => {
                console.log('go to ->', key);
              }}
              onSignOut={() => console.log('sign out')}
            />
            <button
              className="p-2 rounded-full cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Favourites"
            >
              <Heart className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-full cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-full cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Language"
            >
              <Globe className="w-5 h-5" />
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-full cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Compact (mobile) search & hamburger */}
          <div className="flex items-center justify-end flex-1 gap-2 md:hidden">
            <button
              onClick={onOpenFilters}
              className="p-2 rounded-full cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-full cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer from separate file */}
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* 🔐 Auth modal */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authDefaultTab}
      />
    </>
  );
}
