'use client';

import { Bell, Heart, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useLocalePath } from '@/hooks/use-locale-path';
import { useMeQuery } from '@/features/auth/hooks/auth';
import { NotificationBell } from '@/features/notifications/components/notifications-bell';
import { FavouritesBell } from '@/features/favourites/components/favourites-bell';
import { UserMenuControlled } from './user-menu-controlled';
import { AuthModalDev } from '@/features/auth/components/auth-modal-dev';

/**
 * NavbarActions - Reusable right-side actions for navbars
 *
 * Includes:
 * - Create Event button
 * - Notifications
 * - Favourites
 * - User menu / Sign in
 */
export function NavbarActions() {
  const router = useRouter();
  const { localePath } = useLocalePath();
  const [authOpen, setAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'signin' | 'signup'>(
    'signin'
  );

  const { data } = useMeQuery();
  const isAuthed = !!data?.me;

  const openPost = useCallback(() => {
    router.push(localePath('/eventnew'));
  }, [router, localePath]);

  const openAuthSignin = useCallback(() => {
    setAuthDefaultTab('signin');
    setAuthOpen(true);
  }, []);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Create Event Button */}
        <button
          type="button"
          onClick={openPost}
          className="hidden md:inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Post an event</span>
        </button>

        {/* Mobile Create Button */}
        <button
          type="button"
          onClick={openPost}
          className="md:hidden inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors flex-nowrap"
          aria-label="Post an event"
        >
          <Plus className="h-4 w-4" />
          <span>Event</span>
        </button>

        {/* Auth/User Section */}
        {!isAuthed ? (
          <>
            {/* Sign In Button */}
            <button
              type="button"
              onClick={openAuthSignin}
              className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 transition-colors"
            >
              Sign in
            </button>

            {/* Placeholder Notifications (opens auth) */}
            <button
              type="button"
              onClick={openAuthSignin}
              className="hidden md:flex cursor-pointer rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            </button>

            {/* Placeholder Favourites (opens auth) */}
            <button
              type="button"
              onClick={openAuthSignin}
              className="hidden md:flex cursor-pointer rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Favourites"
              aria-label="Favourites"
            >
              <Heart className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            </button>
          </>
        ) : (
          <>
            {/* Notifications Bell */}
            <div className="hidden md:block">
              <NotificationBell
                recipientId={data.me?.id!}
                limit={10}
                className=""
              />
            </div>

            {/* Favourites Bell */}
            <div className="hidden md:block">
              <FavouritesBell />
            </div>

            {/* User Menu */}
            <UserMenuControlled
              onNavigate={(key) => console.log('navigate:', key)}
            />

            {/* Mobile: Notifications + Favourites */}
            <div className="flex md:hidden items-center gap-1">
              <FavouritesBell />
              <NotificationBell recipientId={data.me?.id!} limit={8} />
            </div>
          </>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModalDev
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authDefaultTab}
      />
    </>
  );
}
