'use client';

import clsx from 'clsx';
import {
  BarChart3,
  Bell,
  Calendar,
  DollarSign,
  Flag,
  Folder,
  LayoutDashboard,
  MessageSquare,
  Shield,
  Star,
  Tag,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: 'Użytkownicy',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Wydarzenia',
    href: '/admin/events',
    icon: Calendar,
  },
  {
    name: 'Raporty',
    href: '/admin/reports',
    icon: Flag,
    badge: 'ready',
  },
  {
    name: 'Komentarze',
    href: '/admin/comments',
    icon: MessageSquare,
  },
  {
    name: 'Recenzje',
    href: '/admin/reviews',
    icon: Star,
  },
  {
    name: 'Kategorie',
    href: '/admin/categories',
    icon: Folder,
    badge: 'ready',
  },
  {
    name: 'Tagi',
    href: '/admin/tags',
    icon: Tag,
    badge: 'ready',
  },
  {
    name: 'Powiadomienia',
    href: '/admin/notifications',
    icon: Bell,
  },
  {
    name: 'Sponsoring',
    href: '/admin/sponsorship',
    icon: DollarSign,
  },
  {
    name: 'Statystyki',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Bezpieczeństwo',
    href: '/admin/security',
    icon: Shield,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Admin Panel
        </h1>
      </div>

      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
