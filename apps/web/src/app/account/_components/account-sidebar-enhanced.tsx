'use client';

import { Avatar } from '@/components/ui/avatar';
import { useMeQuery } from '@/lib/api/auth';
import { buildAvatarUrl } from '@/lib/media/url';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bell,
  Calendar1Icon,
  ChevronDown,
  CreditCardIcon,
  Eye,
  Heart,
  HelpCircle,
  ListCollapseIcon,
  LogOut,
  MessagesSquareIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Grouped navigation items
const NAV_GROUPS: NavGroup[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: UserIcon,
    defaultOpen: true,
    items: [
      {
        id: 'profile-settings',
        label: 'Edit Profile',
        href: '/account/profile',
        icon: UserIcon,
      },
      {
        id: 'view',
        label: 'View Profile',
        href: '/account/view',
        icon: Eye,
      },
    ],
  },
  {
    id: 'events',
    label: 'Events & Activity',
    icon: Calendar1Icon,
    defaultOpen: true,
    items: [
      {
        id: 'intents',
        label: 'My Events',
        href: '/account/intents',
        icon: Calendar1Icon,
      },
      {
        id: 'favourites',
        label: 'Favourites',
        href: '/account/favourites',
        icon: Heart,
      },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessagesSquareIcon,
    defaultOpen: true,
    items: [
      {
        id: 'chats',
        label: 'Chats',
        href: '/account/chats',
        icon: MessagesSquareIcon,
      },
      {
        id: 'notifications',
        label: 'Notifications',
        href: '/account/notifications',
        icon: Bell,
      },
    ],
  },
  {
    id: 'account-settings',
    label: 'Account & Settings',
    icon: SettingsIcon,
    defaultOpen: false,
    items: [
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/account/analytics',
        icon: BarChart3,
      },
      {
        id: 'plans-and-bills',
        label: 'Plans & Bills',
        href: '/account/plans-and-bills',
        icon: CreditCardIcon,
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/account/settings',
        icon: SettingsIcon,
      },
      {
        id: 'help',
        label: 'Help',
        href: '/account/help',
        icon: HelpCircle,
      },
    ],
  },
];

/**
 * AccountSidebarEnhanced - Advanced sidebar with collapse/expand functionality
 *
 * Features:
 * - 100vh height with internal scroll
 * - Collapsed/Expanded modes
 * - Grouped navigation with collapsible sections
 * - Sticky top (logo + toggle) and bottom (user zone)
 * - Scrollable middle section
 * - Smooth animations
 * - Tooltips in collapsed mode
 */
export function AccountSidebarEnhanced() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: authData } = useMeQuery();
  const user = authData?.me;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(NAV_GROUPS.filter((g) => g.defaultOpen).map((g) => g.id))
  );

  const handleLogout = useCallback(() => {
    // TODO: Implement real logout
    router.push('/');
  }, [router]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const isActive = (item: NavItem) => {
    return pathname.startsWith(item.href);
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden h-screen overflow-hidden bg-white border-r lg:flex lg:flex-col border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Top Section: Logo + Toggle (always visible, not scrollable) */}
        <div className="flex items-center justify-center flex-shrink-0 h-16 px-4 border-b border-zinc-200 dark:border-zinc-800">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between w-full"
              >
                <Link href="/" className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text">
                    miglee
                  </span>
                  <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                    .pl
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={toggleCollapse}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  aria-label="Collapse sidebar"
                >
                  <ListCollapseIcon className="w-5 h-5 rotate-180" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="menu-collapsed"
                type="button"
                onClick={toggleCollapse}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center w-full p-2 transition-colors rounded-lg text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="Expand sidebar"
              >
                <ListCollapseIcon className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Middle Section: Navigation (scrollable, flex-grow) */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <div className="space-y-2">
            {NAV_GROUPS.map((group) => {
              const GroupIcon = group.icon;
              const isGroupOpen = openGroups.has(group.id);
              const hasActiveItem = group.items.some((item) => isActive(item));

              return (
                <div key={group.id} className="space-y-1">
                  {/* Group Header */}
                  {!isCollapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
                        hasActiveItem
                          ? 'text-indigo-700 dark:text-indigo-400'
                          : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <GroupIcon className="w-4 h-4" />
                        <span>{group.label}</span>
                      </div>
                      <motion.div
                        animate={{ rotate: isGroupOpen ? 0 : -90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                  ) : (
                    <div className="flex justify-center py-2">
                      <div
                        className={cn(
                          'h-px w-8',
                          hasActiveItem
                            ? 'bg-indigo-300 dark:bg-indigo-700'
                            : 'bg-zinc-200 dark:bg-zinc-700'
                        )}
                      />
                    </div>
                  )}

                  {/* Group Items */}
                  <AnimatePresence initial={false}>
                    {(isGroupOpen || isCollapsed) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-1 overflow-hidden"
                      >
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(item);
                          const showTooltip =
                            isCollapsed && hoveredItem === item.id;

                          const content = (
                            <>
                              <Icon className="flex-shrink-0 w-4 h-4" />
                              <AnimatePresence>
                                {!isCollapsed && (
                                  <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden whitespace-nowrap"
                                  >
                                    {item.label}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </>
                          );

                          const className = cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                            active
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                              : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                            isCollapsed && 'justify-center',
                            !isCollapsed && 'ml-2'
                          );

                          return (
                            <div
                              key={item.id}
                              className="relative"
                              onMouseEnter={() => setHoveredItem(item.id)}
                              onMouseLeave={() => setHoveredItem(null)}
                            >
                              <Link
                                href={item.href}
                                className={className}
                                aria-current={active ? 'page' : undefined}
                              >
                                {content}
                              </Link>

                              {/* Tooltip for collapsed mode */}
                              {showTooltip && (
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-zinc-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap dark:bg-zinc-100 dark:text-zinc-900"
                                >
                                  {item.label}
                                  <div className="absolute -translate-y-1/2 border-4 border-transparent right-full top-1/2 border-r-zinc-900 dark:border-r-zinc-100" />
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section: User Zone (always visible, not scrollable) */}
        <div className="flex-shrink-0 p-3 border-t border-zinc-200 dark:border-zinc-800">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                key="user-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-3 p-2 transition-colors rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <Avatar
                    url={buildAvatarUrl(user?.avatarKey, 'sm')}
                    blurhash={user?.avatarBlurhash}
                    alt={user?.name || 'User'}
                    size={40}
                    className="ring-2 ring-zinc-200 dark:ring-zinc-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs truncate text-zinc-500 dark:text-zinc-400">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all"
                >
                  <LogOut className="flex-shrink-0 w-5 h-5" />
                  <span>Sign out</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="user-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center space-y-2"
              >
                <Avatar
                  url={buildAvatarUrl(user?.avatarKey, 'sm')}
                  blurhash={user?.avatarBlurhash}
                  alt={user?.name || 'User'}
                  size={40}
                  className="transition-all cursor-pointer ring-2 ring-zinc-200 dark:ring-zinc-700 hover:ring-indigo-400"
                />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-red-600 transition-all rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
}
