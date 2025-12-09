'use client';

import { ExternalLink, Eye } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { useMeQuery } from '@/features/auth/hooks/auth';
import {
  PublicProfileClient,
  PublicProfileClientLoader,
} from '@/features/users/components/public-profile-client';
import { useI18n } from '@/lib/i18n/provider-ssr';

export default function ProfileViewPage() {
  // Data should be cached from sidebar, so no loading state needed
  const { data, isLoading } = useMeQuery();
  const username = data?.me?.name;

  return (
    <div className="space-y-6">
      {/* Header - always visible */}
      <ProfileHeader username={username ?? null} />

      {/* Profile View Container - with Suspense for lazy loading */}
      <div className="overflow-hidden rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#0a0a0b] shadow-sm">
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
  const { locale } = useI18n();
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
      <Link
        href={username ? `${locale}/u/${username}` : ''}
        style={{
          opacity: !!username ? 1 : 0.8,
          pointerEvents: !!username ? 'auto' : 'none',
        }}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white transition-all bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl hover:from-indigo-500 hover:to-indigo-400 shadow-md hover:shadow-lg"
      >
        <ExternalLink className="w-4 h-4" strokeWidth={2} />
        {/* TODO: Add i18n key for "Open in New Tab" */}
        Open in New Tab
      </Link>
    </div>
  );
}
