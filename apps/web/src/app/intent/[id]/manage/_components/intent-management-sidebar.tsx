/**
 * Intent Management Sidebar
 * Navigation for intent management interface
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Settings,
  MessageSquare,
  BarChart3,
  Shield,
  Calendar,
  Home,
  ListCollapseIcon,
  Link as LinkIcon,
  CheckCircle2,
  BadgeDollarSign,
  Sparkles,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntentManagement } from './intent-management-provider';
import { motion, AnimatePresence } from 'framer-motion';

interface IntentManagementSidebarProps {
  intentId: string;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

/**
 * Intent Management Sidebar Component
 * Collapsible sidebar with navigation for intent management
 */
export function IntentManagementSidebar({
  intentId,
}: IntentManagementSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: `/intent/${intentId}/manage`,
      icon: LayoutDashboard,
    },
    {
      id: 'view',
      label: 'View Event',
      href: `/intent/${intentId}/manage/view`,
      icon: Calendar,
    },
    {
      id: 'members',
      label: 'Members',
      href: `/intent/${intentId}/manage/members`,
      icon: Users,
    },
    {
      id: 'join-form',
      label: 'Join Form',
      href: `/intent/${intentId}/manage/join-form`,
      icon: CheckCircle2,
    },
    {
      id: 'invite-links',
      label: 'Invite Links',
      href: `/intent/${intentId}/manage/invite-links`,
      icon: LinkIcon,
    },
    {
      id: 'plans',
      label: 'Sponsorship',
      href: `/intent/${intentId}/manage/plans`,
      icon: BadgeDollarSign,
    },
    {
      id: 'subscription',
      label: 'Active Plan',
      href: `/intent/${intentId}/manage/subscription`,
      icon: Sparkles,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      href: `/intent/${intentId}/manage/notifications`,
      icon: Bell,
    },
    {
      id: 'chat',
      label: 'Chat',
      href: `/intent/${intentId}/manage/chat`,
      icon: MessageSquare,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: `/intent/${intentId}/manage/analytics`,
      icon: BarChart3,
    },
    {
      id: 'moderation',
      label: 'Moderation',
      href: `/intent/${intentId}/manage/moderation`,
      icon: Shield,
    },
    {
      id: 'settings',
      label: 'Settings',
      href: `/intent/${intentId}/manage/settings`,
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === `/intent/${intentId}/manage`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden h-screen flex-col overflow-hidden border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:flex"
    >
      {/* Top Section: Logo + Toggle (always visible, not scrollable) */}
      <div className="flex h-16 flex-shrink-0 items-center justify-center border-b border-zinc-200 px-4 dark:border-zinc-800">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex w-full items-center justify-between"
            >
              <Link href="/" className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                  miglee
                </span>
                <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                  .pl
                </span>
              </Link>

              <button
                type="button"
                onClick={toggleCollapse}
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Collapse sidebar"
              >
                <ListCollapseIcon className="h-5 w-5 rotate-180" />
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
              className="flex w-full items-center justify-center rounded-lg p-2 text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Expand sidebar"
            >
              <ListCollapseIcon className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Middle Section: Navigation (scrollable, flex-grow) */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const showTooltip = isCollapsed && hoveredItem === item.id;

            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    active
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                    isCollapsed && 'justify-center'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
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
                </Link>

                {/* Tooltip for collapsed mode */}
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-900 dark:border-r-zinc-100" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section: Back to Event (always visible, not scrollable) */}
      <div className="flex-shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-800">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="back-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href={`/intent/${intentId}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <Home className="h-5 w-5 flex-shrink-0" />
                <span>Back to Event</span>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="back-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              <Link
                href={`/intent/${intentId}`}
                className="rounded-lg p-2 text-zinc-700 transition-all hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="Back to Event"
                title="Back to Event"
              >
                <Home className="h-5 w-5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
