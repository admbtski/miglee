/**
 * Intent Management Mobile Sidebar
 * Mobile drawer navigation for event management
 */

'use client';

import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Shield,
  Settings,
  Calendar,
  Home,
  X,
  Link as LinkIcon,
  CheckCircle2,
  BadgeDollarSign,
  Sparkles,
  Bell,
  Edit3,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIntentManagement } from './intent-management-provider';

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

interface IntentManagementMobileSidebarProps {
  intentId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Intent Management Mobile Sidebar
 * Slide-in drawer from left side on mobile devices
 */
export function IntentManagementMobileSidebar({
  intentId,
  open,
  onClose,
}: IntentManagementMobileSidebarProps) {
  const pathname = usePathname();
  const { intent } = useIntentManagement();

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
      id: 'edit',
      label: 'Edit Event',
      href: `/intent/${intentId}/manage/edit`,
      icon: Edit3,
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
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Manage Event
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 transition-colors rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Title */}
            {intent && (
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-medium tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
                  Current Event
                </p>
                <p className="mt-1 text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">
                  {intent.title}
                </p>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      active
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                        : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        active
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-300'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer - Back to Event */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href={`/intent/${intentId}`}
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
