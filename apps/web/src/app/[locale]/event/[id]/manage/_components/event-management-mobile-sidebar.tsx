/**
 * Event Management Mobile Sidebar
 * Mobile drawer navigation for event management
 */

'use client';

import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Home,
  X,
  Link as LinkIcon,
  CheckCircle2,
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
  Crown,
  Edit3,
  ChevronDown,
  Rocket,
  Target,
  HelpCircle,
  Paintbrush,
  Send,
  DoorOpen,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEventManagement } from './event-management-provider';
import { useLocalePath } from '@/hooks/use-locale-path';

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPlan?: 'plus' | 'pro';
  highlight?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
  requiredPlan?: 'plus' | 'pro';
};

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

interface EventManagementMobileSidebarProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Event Management Mobile Sidebar
 * Slide-in drawer from left side on mobile devices
 */
export function EventManagementMobileSidebar({
  eventId,
  open,
  onClose,
}: EventManagementMobileSidebarProps) {
  const pathname = usePathname();
  const { event } = useEventManagement();
  const { localePath } = useLocalePath();
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(['main', 'settings', 'engagement'])
  );

  // Close on route change
  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

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
          id: 'analytics',
          label: 'Analytics',
          href: localePath(`/event/${eventId}/manage/analytics`),
          icon: BarChart3,
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
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r w-80 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-200 dark:border-zinc-800">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text">
                  miglee
                </span>
                <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                  .pl
                </span>
              </Link>
              <button
                onClick={onClose}
                className="p-2 transition-colors rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Title */}
            {event && (
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-medium tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
                  Current Event
                </p>
                <p className="mt-1 text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">
                  {event.title}
                </p>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
              {navGroups.map((group) => {
                const GroupIcon = group.icon;
                const isGroupOpen = openGroups.has(group.id);
                const hasActiveItem = group.items.some((item) =>
                  isActive(item.href)
                );

                return (
                  <div key={group.id} className="space-y-1">
                    {/* Group Header */}
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
                      <div className="flex items-center gap-2">
                        <GroupIcon className="w-4 h-4" />
                        <span>{group.label}</span>
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

                    {/* Group Items */}
                    <AnimatePresence initial={false}>
                      {isGroupOpen && (
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

                            return (
                              <Link
                                key={item.id}
                                href={item.href}
                                className={cn(
                                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ml-2',
                                  active
                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300'
                                    : item.highlight
                                      ? 'text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20'
                                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                                )}
                              >
                                <Icon
                                  className={cn(
                                    'flex-shrink-0 w-4 h-4',
                                    item.highlight &&
                                      !active &&
                                      'text-violet-500 dark:text-violet-400'
                                  )}
                                />
                                <span className="flex items-center flex-1">
                                  {item.label}
                                  {item.requiredPlan && (
                                    <span className="ml-auto">
                                      <PlanBadge
                                        plan={item.requiredPlan}
                                        size="xs"
                                      />
                                    </span>
                                  )}
                                </span>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            {/* Footer - Back to Event */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href={localePath(`/event/${eventId}`)}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <Home className="flex-shrink-0 w-5 h-5 text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-300" />
                <span>Back to Event</span>
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
