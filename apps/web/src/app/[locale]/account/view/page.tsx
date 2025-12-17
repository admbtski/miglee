'use client';

/**
 * Profile View Page
 *
 * Shows how the user's profile appears to others.
 * Uses the PublicProfileClient component for the actual profile rendering.
 *
 * TODO: add translation (i18n) - hardcoded strings marked inline
 */

import { ExternalLink, Eye } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { useMeQuery } from '@/features/auth';
import {
  PublicProfileClient,
  PublicProfileClientLoader,
} from '@/features/public-profile';
import { useLocalePath } from '@/hooks/use-locale-path';

export default function ProfileViewPage() {
  // Data should be cached from sidebar, so no loading state needed
  const { data, isLoading } = useMeQuery();
  const username = data?.me?.name;

  return (
    <div className="space-y-6">
      {/* Header - always visible */}
      <ProfileHeader username={username ?? null} />

      {/* Profile View Container - with Suspense for lazy loading */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {isLoading && <PublicProfileClientLoader />}
        {username && (
          <Suspense fallback={<PublicProfileClientLoader />}>
            <PublicProfileClient username={username} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

interface ProfileHeaderProps {
  username: string | null;
}

function ProfileHeader({ username }: ProfileHeaderProps) {
  const { localePath } = useLocalePath();
  const hasUsername = Boolean(username);

  const cta = hasUsername ? (
    <Link
      href={localePath(`/u/${username}`)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-indigo-500 hover:to-indigo-400 hover:shadow-lg"
    >
      <ExternalLink className="h-4 w-4" strokeWidth={2} />
      {/* TODO i18n: Open in new tab */}
      Open in New Tab
    </Link>
  ) : (
    <button
      type="button"
      disabled
      className="inline-flex items-center gap-2 rounded-2xl bg-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-500 shadow-sm"
    >
      <ExternalLink className="h-4 w-4" strokeWidth={2} />
      {/* TODO i18n: Loading profile... */}
      Loading profile...
    </button>
  );

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-200/60 bg-white text-indigo-600 shadow-sm dark:border-indigo-800/50 dark:bg-zinc-900 dark:text-indigo-400">
          <Eye
            className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
            strokeWidth={2}
          />
        </div>
        <div>
          {/* TODO i18n: Profile Preview (t.account.viewProfile.title) */}
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Profile Preview
          </h2>
          {/* TODO i18n: This is how your profile appears to other users (t.account.viewProfile.description) */}
          <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            This is how your profile appears to other users
          </p>
        </div>
      </div>
      {cta}
    </div>
  );
}
