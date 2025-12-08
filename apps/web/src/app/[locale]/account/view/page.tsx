'use client';

/**
 * Profile View Page (within Account Management)
 * Shows the public profile view inside the account management interface
 *
 * Note: useMeQuery data should already be in cache from AccountSidebarEnhanced,
 * so we don't show a loading state for it - only for PublicProfileClient.
 */

import { ExternalLink, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

// Features
import { useMeQuery } from '@/features/auth/hooks/auth';
import { PublicProfileClient } from '@/features/users/components/public-profile-client';

function ProfileLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 mx-auto text-indigo-600 dark:text-indigo-400 animate-spin" />
        {/* TODO: Add i18n key for "Loading profile..." */}
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Loading profile...
        </p>
      </div>
    </div>
  );
}

export default function ProfileViewPage() {
  // Data should be cached from sidebar, so no loading state needed
  const { data } = useMeQuery();
  const username = data?.me?.name;

  // If no username yet (edge case - data not in cache), show minimal state
  // This shouldn't happen in normal flow since sidebar loads it first
  if (!username) {
    return (
      <div className="space-y-6">
        {/* Header - always visible */}
        <ProfileHeader username={null} />

        {/* Profile View Container - show loader */}
        <div className="overflow-hidden rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#0a0a0b] shadow-sm">
          <ProfileLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - always visible */}
      <ProfileHeader username={username} />

      {/* Profile View Container - with Suspense for lazy loading */}
      <div className="overflow-hidden rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#0a0a0b] shadow-sm">
        <Suspense fallback={<ProfileLoader />}>
          <PublicProfileClient username={username} />
        </Suspense>
      </div>
    </div>
  );
}

interface ProfileHeaderProps {
  username: string | null;
}

function ProfileHeader({ username }: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border border-indigo-200/80 dark:border-indigo-800/50 rounded-[24px] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-indigo-200/50 dark:border-indigo-800/50">
          <Eye
            className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
            strokeWidth={2}
          />
        </div>
        <div>
          {/* TODO: Add i18n key for "Profile Preview" */}
          <h2 className="text-base font-bold tracking-[-0.02em] text-indigo-900 dark:text-indigo-100">
            Profile Preview
          </h2>
          {/* TODO: Add i18n key for "This is how your profile appears to other users" */}
          <p className="mt-1 text-sm leading-relaxed text-indigo-700 dark:text-indigo-300 max-w-[60ch]">
            This is how your profile appears to other users
          </p>
        </div>
      </div>
      {username && (
        <Link
          href={`/u/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white transition-all bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl hover:from-indigo-500 hover:to-indigo-400 shadow-md hover:shadow-lg"
        >
          <ExternalLink className="w-4 h-4" strokeWidth={2} />
          {/* TODO: Add i18n key for "Open in New Tab" */}
          Open in New Tab
        </Link>
      )}
    </div>
  );
}
