'use client';

import {
  Calendar1Icon,
  CreditCardIcon,
  LogOut,
  MessagesSquareIcon,
  SettingsIcon,
  UserIcon,
  Bell,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useMeQuery } from '@/lib/api/auth';
import { Avatar } from '@/components/ui/avatar';
import { buildAvatarUrl } from '@/lib/media/url';

type NavItem = {
  key: string;
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'danger';
};

const NAV_ITEMS: NavItem[] = [
  {
    key: 'profile',
    label: 'Profile',
    href: '/account/profile',
    icon: UserIcon,
  },
  {
    key: 'intents',
    label: 'My Events',
    href: '/account/intents',
    icon: Calendar1Icon,
  },
  {
    key: 'favourites',
    label: 'Favourites',
    href: '/account/favourites',
    icon: Heart,
  },
  {
    key: 'chats',
    label: 'Chats',
    href: '/account/chats',
    icon: MessagesSquareIcon,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    href: '/account/notifications',
    icon: Bell,
  },
  {
    key: 'plans-and-bills',
    label: 'Plans & Bills',
    href: '/account/plans-and-bills',
    icon: CreditCardIcon,
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/account/settings',
    icon: SettingsIcon,
  },
];

/**
 * AccountSidebar - Left column navigation
 *
 * Structure:
 * - Top section: Logo
 * - Middle section: Navigation items (icons + labels)
 * - Bottom section: User account info
 */
export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: authData } = useMeQuery();
  const user = authData?.me;

  const handleLogout = useCallback(() => {
    // TODO: Implement real logout
    router.push('/');
  }, [router]);

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Top section: Logo */}
      <div className="flex h-16 items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            miglee
          </span>
          <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
            .pl
          </span>
        </Link>
      </div>

      {/* Middle section: Navigation items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href ? pathname.startsWith(item.href) : false;
            const Icon = item.icon;

            if (!item.href) return null;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom section: User account */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          <Avatar
            url={buildAvatarUrl(user?.avatarKey, 'sm')}
            blurhash={user?.avatarBlurhash}
            alt={user?.name || 'User'}
            size={40}
            className="ring-2 ring-zinc-200 dark:ring-zinc-700"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
