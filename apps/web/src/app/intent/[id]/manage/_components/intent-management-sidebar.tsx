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
  MessageSquare,
  BarChart3,
  Home,
  ListCollapseIcon,
  Link as LinkIcon,
  CheckCircle2,
  BadgeDollarSign,
  Sparkles,
  Bell,
  FileText,
  UsersIcon,
  Clock,
  MapPin,
  Lock,
  Eye,
  Image,
  Star,
  AlertTriangle,
  MessagesSquare,
  Edit3,
  UserCog,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
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
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(['overview'])
  );

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

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

  const navGroups: NavGroup[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      defaultOpen: true,
      items: [
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
          icon: Eye,
        },
        {
          id: 'analytics',
          label: 'Analytics',
          href: `/intent/${intentId}/manage/analytics`,
          icon: BarChart3,
        },
      ],
    },
    {
      id: 'settings',
      label: 'Event Settings',
      icon: Edit3,
      defaultOpen: true,
      items: [
        {
          id: 'basics',
          label: 'Basics',
          href: `/intent/${intentId}/manage/edit/basics`,
          icon: FileText,
        },
        {
          id: 'cover',
          label: 'Cover Image',
          href: `/intent/${intentId}/manage/edit/cover`,
          icon: Image,
        },
        {
          id: 'schedule',
          label: 'Schedule',
          href: `/intent/${intentId}/manage/edit/when`,
          icon: Clock,
        },
        {
          id: 'location',
          label: 'Location',
          href: `/intent/${intentId}/manage/edit/where`,
          icon: MapPin,
        },
        {
          id: 'capacity',
          label: 'Capacity',
          href: `/intent/${intentId}/manage/edit/capacity`,
          icon: UsersIcon,
        },
        {
          id: 'privacy',
          label: 'Privacy',
          href: `/intent/${intentId}/manage/edit/settings`,
          icon: Lock,
        },
      ],
    },
    {
      id: 'access',
      label: 'Members & Access',
      icon: UserCog,
      defaultOpen: true,
      items: [
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
      ],
    },
    {
      id: 'engagement',
      label: 'Engagement',
      icon: MessagesSquare,
      defaultOpen: true,
      items: [
        {
          id: 'chat',
          label: 'Chat',
          href: `/intent/${intentId}/manage/chat`,
          icon: MessagesSquare,
        },
        {
          id: 'comments',
          label: 'Comments',
          href: `/intent/${intentId}/manage/comments`,
          icon: MessageSquare,
        },
        {
          id: 'reviews',
          label: 'Reviews',
          href: `/intent/${intentId}/manage/reviews`,
          icon: Star,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          href: `/intent/${intentId}/manage/notifications`,
          icon: Bell,
        },
      ],
    },
    {
      id: 'monetization',
      label: 'Monetization',
      icon: DollarSign,
      defaultOpen: false,
      items: [
        {
          id: 'plans',
          label: 'Sponsorship Plans',
          href: `/intent/${intentId}/manage/plans`,
          icon: BadgeDollarSign,
        },
        {
          id: 'subscription',
          label: 'Active Subscription',
          href: `/intent/${intentId}/manage/subscription`,
          icon: Sparkles,
        },
      ],
    },
    {
      id: 'danger',
      label: 'Danger Zone',
      icon: AlertTriangle,
      defaultOpen: false,
      items: [
        {
          id: 'danger',
          label: 'Cancel & Delete',
          href: `/intent/${intentId}/manage/danger`,
          icon: AlertTriangle,
        },
      ],
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
      className="flex-col hidden h-screen overflow-hidden bg-white border-r border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 lg:flex"
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
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
          {navGroups.map((group) => {
            const GroupIcon = group.icon;
            const isGroupOpen = openGroups.has(group.id);
            const hasActiveItem = group.items.some((item) =>
              isActive(item.href)
            );

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
                      className="overflow-hidden space-y-1"
                    >
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        const showTooltip =
                          isCollapsed && hoveredItem === item.id;

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
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                                active
                                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                                isCollapsed && 'justify-center',
                                !isCollapsed && 'ml-2'
                              )}
                              aria-current={active ? 'page' : undefined}
                            >
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

      {/* Bottom Section: Back to Event (always visible, not scrollable) */}
      <div className="flex-shrink-0 p-3 border-t border-zinc-200 dark:border-zinc-800">
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
                <Home className="flex-shrink-0 w-5 h-5" />
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
                className="p-2 transition-all rounded-lg text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="Back to Event"
                title="Back to Event"
              >
                <Home className="w-5 h-5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
