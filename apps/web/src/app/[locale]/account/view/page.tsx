'use client';
/**
 * Profile View Page (within Account Management)
 * Shows the public profile view inside the account management interface
 */

import { useMeQuery } from '@/features/auth/hooks/auth';
import { Suspense } from 'react';
import { ProfileViewManagement } from './_components/profile-view-management';
import { Loader2 } from 'lucide-react';

export default function ProfileViewPage() {
  const { data, isLoading } = useMeQuery();

  const username = data?.me?.name;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto text-indigo-600 dark:text-indigo-400 animate-spin" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Loading profile view...
          </p>
        </div>
      </div>
    );
  }

  if (!username) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Unable to load profile
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Please log in to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto text-indigo-600 dark:text-indigo-400 animate-spin" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading profile view...
            </p>
          </div>
        </div>
      }
    >
      <ProfileViewManagement username={username} />
    </Suspense>
  );
}
