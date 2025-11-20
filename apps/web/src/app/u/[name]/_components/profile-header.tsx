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
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 sm:h-64">
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
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          </div>
        )}

        {/* Edit Profile Floating Button (for own profile) */}
        {isOwnProfile && (
          <Link
            href="/account/profile"
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-zinc-900 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Edytuj profil</span>
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4">
        <div className="relative -mt-16 sm:-mt-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            {/* Avatar & Info */}
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="relative">
                {user.avatarKey ? (
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-75 blur-sm"></div>
                    <BlurHashImage
                      src={buildAvatarUrl(user.avatarKey, 'xl') || ''}
                      blurhash={user.avatarBlurhash}
                      alt={displayName}
                      width={256}
                      height={256}
                      className="relative h-32 w-32 rounded-2xl border-4 border-white object-cover shadow-xl dark:border-zinc-900"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-75 blur-sm"></div>
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl dark:border-zinc-900">
                      <span className="text-4xl font-bold text-white">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Verified Badge */}
                {user.verifiedAt && (
                  <div
                    className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg ring-4 ring-white dark:ring-zinc-900"
                    title="Zweryfikowany"
                  >
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>

              {/* Name & Info */}
              <div className="flex-1 space-y-2 pb-2">
                {/* Name & Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
                    {displayName}
                  </h1>

                  {/* Role Badge */}
                  {user.role === 'ADMIN' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      <Shield className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                  {user.role === 'MODERATOR' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <Shield className="h-3 w-3" />
                      Moderator
                    </span>
                  )}

                  {/* Status Badge */}
                  {user.lastSeenAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                      Aktywny
                    </span>
                  )}
                </div>

                {/* Username */}
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  @{user.name}
                </p>

                {/* Location & Tagline */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {(city || country) && (
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {city}
                        {city && country && ', '}
                        {country}
                      </span>
                    </div>
                  )}

                  {bioShort && (
                    <p className="text-zinc-700 dark:text-zinc-300">
                      {bioShort}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pb-2">
              {!isOwnProfile && (
                <>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.03] hover:from-blue-700 hover:to-blue-800 hover:shadow-lg active:scale-[0.97]"
                  >
                    <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
                    Wyślij wiadomość
                  </button>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:scale-[1.03] hover:border-zinc-400 hover:shadow-md active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                  >
                    <UserPlus className="h-4 w-4 transition-transform group-hover:scale-110" />
                    Zaproś
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="group inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white p-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:scale-[1.03] hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    title="Zgłoś użytkownika"
                  >
                    <Flag className="h-4 w-4 transition-transform group-hover:scale-110" />
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
