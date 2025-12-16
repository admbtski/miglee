/**
 * Event Management Navbar
 * Top bar for management interface content area
 */

// TODO i18n: aria-label for mobile menu button

'use client';

import {
  ListCollapseIcon,
  FileEdit,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { NavbarActions } from '@/components/layout/navbar-actions';
import { EventManagementMobileSidebar } from './event-management-mobile-sidebar';
import { useEventManagement } from './event-management-provider';
import { useLocalePath } from '@/hooks/use-locale-path';
import { cn } from '@/lib/utils';

interface EventManagementNavbarProps {
  eventId: string;
}

enum PublicationStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Scheduled = 'SCHEDULED',
}

/**
 * EventManagementNavbar - Top bar for content area
 *
 * Features:
 * - Right-aligned elements (notifications, user menu)
 * - Mobile menu toggle
 * - Sticky positioning
 * - Publication status badge
 */
export function EventManagementNavbar({ eventId }: EventManagementNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { event } = useEventManagement();
  const { localePath } = useLocalePath();

  const status: PublicationStatus =
    (event?.publicationStatus as PublicationStatus) ?? PublicationStatus.Draft;

  const statusConfig = {
    [PublicationStatus.Draft]: {
      icon: FileEdit,
      label: 'Draft',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-700 dark:text-amber-300',
      borderColor: 'border-amber-300 dark:border-amber-700',
      pulseColor: 'bg-amber-500',
    },
    [PublicationStatus.Published]: {
      icon: CheckCircle2,
      label: 'Published',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      borderColor: 'border-emerald-300 dark:border-emerald-700',
      pulseColor: 'bg-emerald-500',
    },
    [PublicationStatus.Scheduled]: {
      icon: Clock,
      label: 'Scheduled',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-300',
      borderColor: 'border-blue-300 dark:border-blue-700',
      pulseColor: 'bg-blue-500',
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;
  const isDraft = status === PublicationStatus.Draft;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex h-16 items-center justify-between gap-4 px-6">
          {/* Left side: Mobile menu button + Status Badge */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:hidden"
              aria-label="Open menu"
            >
              <ListCollapseIcon className="h-6 w-6" />
            </button>

            {/* Publication Status Badge */}
            {event && (
              <Link
                href={localePath(`/event/${eventId}/manage/publish`)}
                className={cn(
                  'group relative flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 transition-all hover:scale-[1.02] hover:shadow-md',
                  currentStatus.bgColor,
                  currentStatus.textColor,
                  currentStatus.borderColor
                )}
              >
                {/* Pulse animation for draft */}
                {isDraft && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={cn(
                        'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                        currentStatus.pulseColor
                      )}
                    />
                    <span
                      className={cn(
                        'relative inline-flex h-2.5 w-2.5 rounded-full',
                        currentStatus.pulseColor
                      )}
                    />
                  </span>
                )}

                <StatusIcon className="h-4 w-4" />
                <span className="text-sm font-bold hidden sm:inline">
                  {currentStatus.label}
                </span>

                {/* Warning icon for draft */}
                {isDraft && (
                  <AlertTriangle className="h-3.5 w-3.5 opacity-75" />
                )}
              </Link>
            )}
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center">
            {/* Shared Actions: Notifications, Favourites, User Menu */}
            <NavbarActions />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <EventManagementMobileSidebar
        eventId={eventId}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
