'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';

import { useMeQuery } from '@/features/auth';
import { useLocalePath } from '@/hooks';

interface AccountGuardProps {
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
          {/* TODO i18n */}
          Sprawdzanie uprawnień...
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
          {/* TODO i18n */}
          Wymagane logowanie
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {/* TODO i18n */}
          Musisz być zalogowany, aby uzyskać dostęp do tej strony.
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          {/* TODO i18n */}
          Przekierowywanie na stronę główną...
        </p>
      </div>
    </div>
  );
}

/**
 * Account Guard
 * 
 * Protects account routes by checking if user is authenticated.
 * Redirects to home page if user is not logged in.
 * 
 * @example
 * ```tsx
 * <AccountGuard>
 *   <AccountContent />
 * </AccountGuard>
 * ```
 */
export function AccountGuard({ children }: AccountGuardProps) {
  const router = useRouter();
  const { localePath } = useLocalePath();
  const { data, isLoading } = useMeQuery();

  const isAuthenticated = !!data?.me;

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to home page after a short delay
      const timer = setTimeout(() => {
        router.push(localePath('/'));
      }, 2000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading, isAuthenticated, router, localePath]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingState />;
  }

  // Show unauthorized state if user is not logged in
  if (!isAuthenticated) {
    return <UnauthorizedState />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}

