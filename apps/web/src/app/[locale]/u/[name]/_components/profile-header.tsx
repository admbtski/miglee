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
  Calendar,
  Users,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import type { GetUserProfileQuery } from '@/lib/api/__generated__/react-query-update';
import { ReportUserModal } from './report-user-modal';
import { buildAvatarUrl, buildUserCoverUrl } from '@/lib/media/url';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useI18n } from '@/lib/i18n/provider-ssr';

type ProfileHeaderProps = {
  user: NonNullable<GetUserProfileQuery['user']>;
  isOwnProfile: boolean;
};

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const { locale } = useI18n();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const displayName = user.profile?.displayName || user.name;
  const city = user.profile?.city;
  const country = user.profile?.country;
  const bioShort = user.profile?.bioShort;
  const memberSince = user.createdAt ? new Date(user.createdAt) : null;

  return (
    <div className="relative bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      {/* Cover - Gradient or user cover */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        {user.profile?.coverKey ? (
          <BlurHashImage
            src={buildUserCoverUrl(user.profile.coverKey, 'detail') || ''}
            blurhash={user.profile.coverBlurhash}
            alt="Cover"
            width={1280}
            height={720}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-600" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

        {/* Edit Button */}
        {isOwnProfile && (
          <Link
            href={`${locale}/account/profile`}
            className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 shadow-lg border border-white/20 hover:bg-white dark:hover:bg-zinc-800 transition-all"
          >
            <Settings className="h-4 w-4" strokeWidth={2} />
            <span>Edytuj profil</span>
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="relative -mt-16 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user.avatarKey ? (
                <BlurHashImage
                  src={buildAvatarUrl(user.avatarKey, 'xl') || ''}
                  blurhash={user.avatarBlurhash}
                  alt={displayName}
                  width={256}
                  height={256}
                  className="h-32 w-32 rounded-2xl ring-4 ring-white dark:ring-zinc-900 object-cover shadow-xl"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl ring-4 ring-white dark:ring-zinc-900 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl">
                  <span className="text-4xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Verified Badge */}
              {user.verifiedAt && (
                <div
                  className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 shadow-lg ring-3 ring-white dark:ring-zinc-900"
                  title="Zweryfikowany"
                >
                  <CheckCircle
                    className="h-5 w-5 text-white"
                    strokeWidth={2.5}
                  />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-2 md:pt-0">
              {/* Name & Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {displayName}
                </h1>

                {/* Role Badge */}
                {user.role === 'ADMIN' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
                    <Shield className="h-3.5 w-3.5" strokeWidth={2} />
                    Admin
                  </span>
                )}
                {user.role === 'MODERATOR' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                    <Shield className="h-3.5 w-3.5" strokeWidth={2} />
                    Moderator
                  </span>
                )}

                {/* Status */}
                {user.lastSeenAt && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                    Aktywny
                  </span>
                )}
              </div>

              {/* Username */}
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                @{user.name}
              </p>

              {/* Bio Short */}
              {bioShort && (
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-2xl mb-3">
                  {bioShort}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                {/* Location */}
                {(city || country) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" strokeWidth={2} />
                    <span>
                      {city}
                      {city && country && ', '}
                      {country}
                    </span>
                  </div>
                )}

                {/* Member since */}
                {memberSince && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" strokeWidth={2} />
                    <span>
                      Dołączył{' '}
                      {format(memberSince, 'LLLL yyyy', { locale: pl })}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              {user.stats && (
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {user.stats.eventsCreated}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      wydarzeń
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {user.stats.eventsJoined}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      uczestnictw
                    </span>
                  </div>
                  {user.stats.hostRatingAvg !== null && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {user.stats.hostRatingAvg?.toFixed(1) ?? '0.0'}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        ocena
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 md:mt-0 md:self-center">
              {!isOwnProfile && (
                <>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900 shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={2} />
                    Wiadomość
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                  >
                    <UserPlus className="h-4 w-4" strokeWidth={2} />
                    Obserwuj
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 text-zinc-500 dark:text-zinc-400 shadow-sm hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 hover:border-red-300 dark:hover:border-red-800 transition-all"
                    title="Zgłoś"
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
