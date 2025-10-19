'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  Settings,
  MessageSquare,
  User,
  Bot,
  CreditCardIcon,
} from 'lucide-react';
import { useCallback } from 'react';

type Item = {
  key:
    | 'profile'
    | 'chats'
    | 'intents'
    | 'plans-and-bills'
    | 'settings'
    | 'logout';
  label: string;
  href?: string;
  tone?: 'danger';
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: Item[] = [
  { key: 'profile', label: 'Profile', href: '/account/profile', icon: User },
  { key: 'chats', label: 'Chats', href: '/account/chats', icon: MessageSquare },
  { key: 'intents', label: 'Intents', href: '/account/intents', icon: Bot },
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
    icon: Settings,
  },
  { key: 'logout', label: 'Log out', icon: LogOut, tone: 'danger' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  const onLogout = useCallback(() => {
    // Plug your real logout here (e.g. mutation / next-auth signOut)
    console.log('Logout clicked');
    router.push('/'); // fallback redirect
  }, [router]);

  return (
    <nav className="grid gap-1 p-2">
      {NAV.map(({ key, label, href, icon: Icon, tone }) => {
        const isActive = href ? pathname.startsWith(href) : false;
        const base =
          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors';

        const cls = isActive
          ? 'bg-pink-200/60 text-pink-800 dark:bg-pink-800/25 dark:text-pink-200'
          : tone === 'danger'
            ? 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20'
            : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/60';

        const iconWrap = isActive
          ? 'bg-pink-200/70 text-pink-900 dark:bg-pink-800/30 dark:text-pink-100'
          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200';

        if (key === 'logout') {
          return (
            <button
              key={key}
              type="button"
              onClick={onLogout}
              className={`${base} ${cls}`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-lg ${iconWrap}`}
              >
                <LogOut className="w-4 h-4" />
              </span>
              <span className="font-medium">{label}</span>
            </button>
          );
        }

        return (
          <Link key={key} href={href!} className={`${base} ${cls}`}>
            <span
              className={`grid h-8 w-8 place-items-center rounded-lg ${iconWrap}`}
            >
              <Icon className="w-4 h-4" />
            </span>
            <span className="font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
