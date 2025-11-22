'use client';

import { useState } from 'react';
import {
  MessageCircle,
  UserPlus,
  Flag,
  Settings,
  MapPin,
  CheckCircle,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import type { GetUserProfileQuery } from '@/lib/api/__generated__/react-query-update';
import { ReportUserModal } from './report-user-modal';
import { buildAvatarUrl, buildUserCoverUrl } from '@/lib/media/url';
import { BlurHashImage } from '@/components/ui/blurhash-image';

type ProfileHeaderProps = {
  user: NonNullable<GetUserProfileQuery['user']>;
  isOwnProfile: boolean;
};

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const displayName = user.profile?.displayName || user.name;
  const city = user.profile?.city;
  const country = user.profile?.country;
  const bioShort = user.profile?.bioShort;

  return (
    <div className="relative">
      {/* Cover Image / Gradient */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        {user.profile?.coverKey ? (
          <>
            <BlurHashImage
              src={buildUserCoverUrl(user.profile.coverKey, 'detail') || ''}
              blurhash={user.profile.coverBlurhash}
              alt="Cover"
              width={1280}
              height={720}
              className="h-full w-full object-cover"
            />
            {/* Subtle overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 dark:from-black/40 dark:to-black/60" />
          </>
        ) : (
          <>
            {/* Light theme: warm gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 dark:hidden" />
            {/* Dark theme: cooler, more subdued */}
            <div className="hidden dark:block absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
            {/* Pattern overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20 dark:opacity-10" />
          </>
        )}

        {/* Edit Profile Floating Button (for own profile) */}
        {isOwnProfile && (
          <Link
            href="/account/profile"
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50 shadow-lg transition-all hover:bg-white dark:hover:bg-zinc-900 hover:shadow-xl"
          >
            <Settings className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">Edit profile</span>
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4">
        <div className="bg-white dark:bg-[#0d0d0f] rounded-3xl shadow-lg dark:shadow-2xl border border-zinc-200/80 dark:border-white/10 px-6 py-6 -mt-10 relative">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            {/* Avatar & Info */}
            <div className="flex items-start gap-4 flex-1">
              {/* Avatar */}
              <div className="relative -mt-16 sm:-mt-20">
                {user.avatarKey ? (
                  <BlurHashImage
                    src={buildAvatarUrl(user.avatarKey, 'xl') || ''}
                    blurhash={user.avatarBlurhash}
                    alt={displayName}
                    width={256}
                    height={256}
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-full ring-4 ring-white dark:ring-zinc-900 object-cover shadow-xl"
                  />
                ) : (
                  <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full ring-4 ring-white dark:ring-zinc-900 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl">
                    <span className="text-3xl sm:text-4xl font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Verified Badge */}
                {user.verifiedAt && (
                  <div
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-lg ring-2 ring-white dark:ring-zinc-900"
                    title="Verified"
                  >
                    <CheckCircle
                      className="h-4 w-4 text-white"
                      strokeWidth={2.5}
                    />
                  </div>
                )}
              </div>

              {/* Name & Info */}
              <div className="flex-1 space-y-2 pt-1">
                {/* Name & Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
                    {displayName}
                  </h1>

                  {/* Role Badge */}
                  {user.role === 'ADMIN' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300">
                      <Shield className="h-3 w-3" strokeWidth={2} />
                      Admin
                    </span>
                  )}
                  {user.role === 'MODERATOR' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                      <Shield className="h-3 w-3" strokeWidth={2} />
                      Moderator
                    </span>
                  )}

                  {/* Status Badge */}
                  {user.lastSeenAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
                      Active
                    </span>
                  )}
                </div>

                {/* Bio Short */}
                {bioShort && (
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-[60ch]">
                    {bioShort}
                  </p>
                )}

                {/* Location */}
                {(city || country) && (
                  <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-500">
                    <MapPin className="h-4 w-4" strokeWidth={2} />
                    <span>
                      {city}
                      {city && country && ', '}
                      {country}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 sm:pt-1">
              {!isOwnProfile && (
                <>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-400 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 dark:shadow-indigo-400/20 transition-all hover:shadow-xl hover:shadow-indigo-500/30 dark:hover:shadow-indigo-400/25 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={2} />
                    Message
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <UserPlus className="h-4 w-4" strokeWidth={2} />
                    Connect
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-400 shadow-sm transition-all hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 hover:scale-[1.02] active:scale-[0.98]"
                    title="Report user"
                  >
                    <Flag className="h-4 w-4" strokeWidth={2} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportUserModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        userId={user.id}
        userName={displayName}
      />
    </div>
  );
}
