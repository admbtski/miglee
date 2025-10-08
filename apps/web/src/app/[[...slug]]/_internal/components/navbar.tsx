'use client';

import { useState } from 'react';
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
import { twMerge } from 'tailwind-merge';

import { AuthModal } from '@/app/components/auth/auth-modal';
import { NavDrawer } from './nav-drawer';
import { UserMenu } from './user-menu';
import { CreateIntentModal } from '@/app/components/intent/create/modal/create-intent-modal';

type NavbarProps = {
  q: string;
  city: string | null;
  distanceKm: number;
  activeFilters: number;
  onOpenFilters: () => void;
};

export function Navbar({
  q,
  city,
  distanceKm,
  activeFilters,
  onOpenFilters,
}: NavbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>(
    'login'
  );

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white/70 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="mx-auto flex max-w-8xl items-center gap-3 px-4 py-3">
          {/* Logo */}
          <a href="/" className="flex shrink-0 items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-indigo-500 to-cyan-500" />
            <span className="text-lg font-semibold tracking-tight">
              miglee.pl
            </span>
          </a>

          {/* --- Desktop Search Bar --- */}
          <div className="mx-3 hidden flex-1 md:block">
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-80 blur-xl [background:conic-gradient(from_200deg,theme(colors.orange.200),theme(colors.pink.300),theme(colors.indigo.300),theme(colors.cyan.300))]" />
              <div className="rounded-full bg-[linear-gradient(90deg,theme(colors.orange.200),theme(colors.pink.300),theme(colors.indigo.300),theme(colors.cyan.300))] p-[2px] shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
                <div className="flex items-center rounded-full bg-white/90 py-2 pl-4 pr-1 text-sm text-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-100">
                  {/* Search */}
                  <SearchSegment
                    icon={<Search className="h-5 w-5 opacity-60" />}
                    value={q}
                    placeholder="Search: Job title, company, keyword"
                    className="flex-1"
                    onClick={onOpenFilters}
                  />
                  <Divider />
                  {/* City */}
                  <SearchSegment
                    icon={<MapPinIcon className="h-5 w-5 opacity-60" />}
                    value={city}
                    placeholder="Any"
                    className="flex-1"
                    onClick={onOpenFilters}
                  />
                  <Divider />
                  {/* Distance */}
                  <SearchSegment
                    icon={<RulerIcon className="h-5 w-5 opacity-60" />}
                    value={distanceKm !== 30 ? `${distanceKm} km` : ''}
                    placeholder="30 km"
                    onClick={onOpenFilters}
                  />

                  <Divider />
                  {/* Filters */}
                  <button
                    onClick={onOpenFilters}
                    className="flex shrink-0 items-center gap-2 pr-2 hover:opacity-90"
                  >
                    <Filter className="h-5 w-5 opacity-60" />
                    <span className={activeFilters ? '' : 'opacity-60'}>
                      Filters
                    </span>
                    {activeFilters > 0 && (
                      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[12px] text-white shadow-sm ring-1 ring-black/5">
                        {activeFilters}
                      </span>
                    )}
                  </button>

                  {/* CTA Circle */}
                  <button
                    onClick={() => {}}
                    className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-tr from-pink-500 to-violet-600 text-white shadow-lg hover:brightness-110"
                    aria-label="Search"
                  >
                    <SearchIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* --- Right Actions --- */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <button
              onClick={() => setNewOpen(true)}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Post an event
            </button>

            <button
              onClick={() => {
                setAuthDefaultTab('login');
                setAuthOpen(true);
              }}
              className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
            >
              Sign in
            </button>

            <UserMenu
              user={{
                name: 'Jan Kowalski',
                email: 'jan@kowalski.pl',
                avatarUrl: 'https://picsum.photos/id/99/200/300',
              }}
              onNavigate={(key) => console.log('navigate:', key)}
              onSignOut={() => console.log('sign out')}
            />

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

          {/* --- Mobile --- */}
          <div className="flex flex-1 items-center justify-end gap-2 md:hidden">
            <button
              onClick={() => {
                setAuthDefaultTab('login');
                setAuthOpen(true);
              }}
              className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
            >
              Sign in
            </button>

            <IconButton icon={Search} label="Search" onClick={onOpenFilters} />
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
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authDefaultTab}
      />

      <CreateIntentModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        interests={[
          { id: 'run', name: 'Running' },
          { id: 'gym', name: 'Gym' },
          { id: 'painting', name: 'Painting' },
        ]}
        fetchSuggestions={async () => []}
        onCreate={async () => {}}
      />
    </>
  );
}

/* --- Small helpers --- */

function SearchSegment({
  icon,
  value,
  placeholder,
  className,
  onClick,
}: {
  icon: React.ReactNode;
  value?: string | null;
  placeholder: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={twMerge('flex items-center gap-2 hover:opacity-90', className)}
    >
      {icon}
      <span className={`truncate ${value ? '' : 'opacity-60'}`}>
        {value || placeholder}
      </span>
    </button>
  );
}

function Divider() {
  return <div className="mx-3 h-5 w-px bg-zinc-300/70 dark:bg-zinc-700/70" />;
}

function IconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="cursor-pointer rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
