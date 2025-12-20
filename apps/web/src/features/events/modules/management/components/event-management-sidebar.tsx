/**
 * Event Management Sidebar
 * Navigation for event management interface
 */

// TODO i18n: All navigation labels need translation keys
// - group labels, item labels, plan badges
// - tooltips and aria-labels

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Crown,
  DoorOpen,
  Edit3,
  Eye,
  FileText,
  HelpCircle,
  History,
  Home,
  Image,
  LayoutDashboard,
  Link as LinkIcon,
  ListCollapseIcon,
  ListOrdered,
  Lock,
  MapPin,
  MessageSquare,
  MessagesSquare,
  Paintbrush,
  Rocket,
  Send,
  Sparkles,
  Star,
  Target,
  Users,
  UsersIcon,
} from 'lucide-react';

// Hooks
import { useLocalePath } from '@/hooks/use-locale-path';
import { useEventManagement } from './event-management-provider';

// Lib
import { cn } from '@/lib/utils';

interface EventManagementSidebarProps {
  eventId: string;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  requiredPlan?: 'plus' | 'pro'; // Minimum plan required to access this feature
  highlight?: boolean; // Special highlight style for important items
}

interface PlanBadgeProps {
  plan: 'plus' | 'pro';
  size?: 'sm' | 'xs';
}

function PlanBadge({ plan, size = 'xs' }: PlanBadgeProps) {
  const isPro = plan === 'pro';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap',
        size === 'xs' && 'px-1.5 py-0.5 text-[10px]',
        size === 'sm' && 'px-2 py-1 text-xs',
        isPro
          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
          : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white'
      )}
    >
      {isPro ? (
        <>
          <Crown className={cn(size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
          PRO
        </>
      ) : (
        <>
          <Sparkles className={cn(size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
          PLUS
        </>
      )}
    </span>
  );
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
  requiredPlan?: 'plus' | 'pro'; // Minimum plan required to access this group
}

/**
 * Event Management Sidebar Component
 * Collapsible sidebar with navigation for event management
 */
export function EventManagementSidebar({
  eventId,
}: EventManagementSidebarProps) {
  const pathname = usePathname();
  const { localePath } = useLocalePath();
  const { event } = useEventManagement();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['main']));

  // Get publication status
  const isDraft = (event?.publicationStatus ?? 'DRAFT') === 'DRAFT';

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
      id: 'main',
      label: 'Main',
      icon: LayoutDashboard,
      defaultOpen: true,
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: localePath(`/event/${eventId}/manage`),
          icon: LayoutDashboard,
        },
        {
          id: 'publish',
          label: 'Publish',
          href: localePath(`/event/${eventId}/manage/publish`),
          icon: Send,
        },
        {
          id: 'view',
          label: 'View Event',
          href: localePath(`/event/${eventId}/manage/view`),
          icon: Eye,
        },
        {
          id: 'members',
          label: 'Members',
          href: localePath(`/event/${eventId}/manage/members`),
          icon: Users,
        },
        {
          id: 'plans',
          label: 'Upgrade Plan',
          href: localePath(`/event/${eventId}/manage/plans`),
          icon: Rocket,
          highlight: true,
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
          href: localePath(`/event/${eventId}/manage/edit/basics`),
          icon: FileText,
        },
        {
          id: 'cover',
          label: 'Cover Image',
          href: localePath(`/event/${eventId}/manage/edit/cover`),
          icon: Image,
        },
        {
          id: 'schedule',
          label: 'Schedule',
          href: localePath(`/event/${eventId}/manage/edit/schedule`),
          icon: Clock,
        },
        {
          id: 'location',
          label: 'Location',
          href: localePath(`/event/${eventId}/manage/edit/location`),
          icon: MapPin,
        },
        {
          id: 'capacity',
          label: 'Capacity',
          href: localePath(`/event/${eventId}/manage/edit/capacity`),
          icon: UsersIcon,
        },
        {
          id: 'privacy',
          label: 'Privacy',
          href: localePath(`/event/${eventId}/manage/edit/privacy`),
          icon: Lock,
        },
        {
          id: 'join-rules',
          label: 'Join Rules',
          href: localePath(`/event/${eventId}/manage/edit/join-rules`),
          icon: DoorOpen,
        },
        {
          id: 'audience',
          label: 'Audience',
          href: localePath(`/event/${eventId}/manage/edit/audience`),
          icon: Target,
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
          href: localePath(`/event/${eventId}/manage/chat`),
          icon: MessagesSquare,
        },
        {
          id: 'comments',
          label: 'Comments',
          href: localePath(`/event/${eventId}/manage/comments`),
          icon: MessageSquare,
        },
        {
          id: 'reviews',
          label: 'Reviews',
          href: localePath(`/event/${eventId}/manage/reviews`),
          icon: Star,
        },
        {
          id: 'faq',
          label: 'FAQ',
          href: localePath(`/event/${eventId}/manage/faq`),
          icon: HelpCircle,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          href: localePath(`/event/${eventId}/manage/notifications`),
          icon: Bell,
        },
      ],
    },
    {
      id: 'plus-features',
      label: 'Plus Features',
      icon: Sparkles,
      defaultOpen: false,
      requiredPlan: 'plus',
      items: [
        {
          id: 'agenda',
          label: 'Agenda',
          href: localePath(`/event/${eventId}/manage/agenda`),
          icon: ListOrdered,
        },
        {
          id: 'join-form',
          label: 'Join Form',
          href: localePath(`/event/${eventId}/manage/join-form`),
          icon: CheckCircle2,
        },
        {
          id: 'invite-links',
          label: 'Invite Links',
          href: localePath(`/event/${eventId}/manage/invite-links`),
          icon: LinkIcon,
        },
        {
          id: 'feedback',
          label: 'Feedback',
          href: localePath(`/event/${eventId}/manage/feedback`),
          icon: FileText,
        },
        {
          id: 'boost',
          label: 'Event Boost',
          href: localePath(`/event/${eventId}/manage/boost`),
          icon: Rocket,
        },
        {
          id: 'local-push',
          label: 'Local Push',
          href: localePath(`/event/${eventId}/manage/local-push`),
          icon: Target,
        },
        {
          id: 'appearance',
          label: 'Appearance',
          href: localePath(`/event/${eventId}/manage/appearance`),
          icon: Paintbrush,
        },
      ],
    },
    {
      id: 'pro-features',
      label: 'Pro Features',
      icon: Crown,
      defaultOpen: false,
      requiredPlan: 'pro',
      items: [
        {
          id: 'checkin',
          label: 'Check-in & Presence',
          href: localePath(`/event/${eventId}/manage/checkin`),
          icon: CheckCircle,
        },
        {
          id: 'analytics',
          label: 'Analytics',
          href: localePath(`/event/${eventId}/manage/analytics`),
          icon: BarChart3,
        },
        {
          id: 'activity',
          label: 'Activity Log',
          href: localePath(`/event/${eventId}/manage/activity`),
          icon: History,
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
          href: localePath(`/event/${eventId}/manage/danger`),
          icon: AlertTriangle,
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    const dashboardPath = localePath(`/event/${eventId}/manage`);
    if (href === dashboardPath) {
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
                  appname
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
                        ? group.requiredPlan === 'pro'
                          ? 'text-amber-700 dark:text-amber-400'
                          : group.requiredPlan === 'plus'
                            ? 'text-indigo-700 dark:text-indigo-400'
                            : 'text-indigo-700 dark:text-indigo-400'
                        : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <GroupIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{group.label}</span>
                      {group.requiredPlan && (
                        <PlanBadge plan={group.requiredPlan} size="xs" />
                      )}
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
                          ? group.requiredPlan === 'pro'
                            ? 'bg-amber-300 dark:bg-amber-700'
                            : group.requiredPlan === 'plus'
                              ? 'bg-indigo-300 dark:bg-indigo-700'
                              : 'bg-indigo-300 dark:bg-indigo-700'
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
                        const showDraftWarning =
                          isDraft && item.id === 'publish';

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
                                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                                active
                                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                                  : item.highlight
                                    ? 'text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20'
                                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                                isCollapsed && 'justify-center',
                                !isCollapsed && 'ml-2'
                              )}
                              aria-current={active ? 'page' : undefined}
                            >
                              <Icon
                                className={cn(
                                  'w-4 h-4 flex-shrink-0',
                                  item.highlight &&
                                    !active &&
                                    'text-violet-500 dark:text-violet-400'
                                )}
                              />
                              <AnimatePresence>
                                {!isCollapsed && (
                                  <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center flex-1 gap-2 overflow-hidden whitespace-nowrap"
                                  >
                                    {item.highlight ? (
                                      <motion.span
                                        animate={{
                                          opacity: [1, 0.5, 1],
                                          scale: [1, 1.02, 1],
                                        }}
                                        transition={{
                                          duration: 1,
                                          repeat: Infinity,
                                          repeatDelay: 2,
                                          ease: 'easeInOut',
                                        }}
                                      >
                                        {item.label}
                                      </motion.span>
                                    ) : (
                                      <span>{item.label}</span>
                                    )}
                                    {showDraftWarning && (
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                                    )}
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
                                <div className="flex items-center gap-2">
                                  {item.label}
                                  {showDraftWarning && (
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                  )}
                                </div>
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
                href={localePath(`/event/${eventId}`)}
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
                href={localePath(`/event/${eventId}`)}
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
