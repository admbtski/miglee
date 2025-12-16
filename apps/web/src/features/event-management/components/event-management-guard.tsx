/**
 * Event Management Guard
 * Checks if user has permission to access management interface
 * Redirects to event page if not authorized
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';

import { useEventPermissions } from '@/features/events/hooks/use-event-permissions';

interface EventManagementGuardProps {
  eventId: string;
  children: React.ReactNode;
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <Loader2 className="w-8 h-8 mx-auto text-indigo-600 animate-spin dark:text-indigo-400" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Checking permissions...
        </p>
      </div>
    </div>
  );
}

/**
 * Unauthorized state component
 */
function UnauthorizedState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <ShieldAlert className="w-12 h-12 mx-auto text-red-500" />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Access Denied
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          You don't have permission to manage this event.
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          Redirecting to event page...
        </p>
      </div>
    </div>
  );
}

/**
 * Event Management Guard Component
 * Checks user permissions and redirects if not authorized
 */
export function EventManagementGuard({
  eventId,
  children,
}: EventManagementGuardProps) {
  const router = useRouter();
  const permissions = useEventPermissions(eventId);

  // Redirect if user doesn't have management permissions
  useEffect(() => {
    if (!permissions.isLoading && !permissions.canManage) {
      // Redirect to event page after a short delay
      const timer = setTimeout(() => {
        router.push(`/event/${eventId}`);
      }, 2000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [permissions.isLoading, permissions.canManage, eventId, router]);

  // Show loading state while checking permissions
  if (permissions.isLoading) {
    return <LoadingState />;
  }

  // Show unauthorized state if user doesn't have permission
  if (!permissions.canManage) {
    return <UnauthorizedState />;
  }

  // User has permission, render children
  return <>{children}</>;
}
