'use client';

// TODO i18n: All Polish strings need translation keys
// - Button labels, badges, stat labels, date formatting

import { format, pl, enUS } from '@/lib/date';
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
  MoreHorizontal,
  Lock,
  Ban,
  Copy,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import type { GetUserProfileQuery } from '@/lib/api/__generated__/react-query-update';
import { useMeQuery } from '@/features/auth';
import { ReportUserModal } from '@/features/reports';
import { buildAvatarUrl, buildUserCoverUrl } from '@/lib/media/url';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { useI18n } from '@/lib/i18n/provider-ssr';

type ProfileHeaderProps = {
  user: NonNullable<GetUserProfileQuery['user']>;
  isOwnProfile: boolean;
};

// Avatar gradient generator based on user id/name
function getAvatarGradient(seed: string): string {
  const gradients = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-blue-600',
    'from-amber-500 to-orange-500',
    'from-cyan-500 to-blue-500',
  ] as const;
  const index =
    seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    gradients.length;
  return gradients[index] as string;
}

// Check if user was recently active (within last 15 minutes)
function isRecentlyActive(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  const lastSeen = new Date(lastSeenAt);
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  return lastSeen > fifteenMinutesAgo;
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const { locale } = useI18n();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Check if current user is admin/moderator (can see user IDs for debugging)
  const { data: meData } = useMeQuery();
  const isAppAdminOrModerator =
    meData?.me?.role === 'ADMIN' || meData?.me?.role === 'MODERATOR';

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.error('Failed to copy user ID:', err);
    }
  };

  const displayName = user.profile?.displayName || user.name;
  const city = user.profile?.city;
  const country = user.profile?.country;
  const bioShort = user.profile?.bioShort;
  const memberSince = user.createdAt ? new Date(user.createdAt) : null;
  const isActive = isRecentlyActive(user.lastSeenAt);
  const avatarGradient = getAvatarGradient(user.id);

  // Stats with defaults
  const stats = {
    eventsCreated: user.stats?.eventsCreated ?? 0,
    eventsJoined: user.stats?.eventsJoined ?? 0,
    hostRatingAvg: user.stats?.hostRatingAvg ?? null,
  };

  // TODO i18n: use locale-aware date formatting
  const dateLocale = locale === 'pl' ? pl : enUS;

  return (
    <div className="relative bg-white dark:bg-zinc-900">
      {/* Cover with enhanced overlay for better contrast */}
      <div className="relative h-40 sm:h-48 md:h-56 overflow-hidden">
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

        {/* Enhanced gradient overlay for better text/avatar contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent h-24" />

        {/* Top right actions on cover */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {isOwnProfile ? (
            <>
              <Link
                href={`/${locale}/account/profile`}
                className="inline-flex items-center gap-2 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 shadow-lg hover:bg-white dark:hover:bg-zinc-800 transition-all"
              >
                <Settings className="h-4 w-4" strokeWidth={2} />
                <span className="hidden sm:inline">Edytuj profil</span>
              </Link>
              <Link
                href={`/${locale}/account/privacy`}
                className="inline-flex items-center justify-center rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm p-2.5 text-zinc-700 dark:text-zinc-300 shadow-lg hover:bg-white dark:hover:bg-zinc-800 transition-all"
                title="Ustawienia prywatności"
              >
                <Lock className="h-4 w-4" strokeWidth={2} />
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center justify-center rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm p-2.5 text-zinc-700 dark:text-zinc-300 shadow-lg hover:bg-white dark:hover:bg-zinc-800 transition-all"
              >
                <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 z-50">
                    <button
                      type="button"
                      onClick={() => {
                        setReportModalOpen(true);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <Flag className="h-4 w-4" strokeWidth={2} />
                      Zgłoś użytkownika
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Ban className="h-4 w-4" strokeWidth={2} />
                      Zablokuj
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 pb-6">
          {/* Top row: Avatar + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0 self-start sm:self-auto">
              {user.avatarKey ? (
                <BlurHashImage
                  src={buildAvatarUrl(user.avatarKey, 'xl') || ''}
                  blurhash={user.avatarBlurhash}
                  alt={displayName}
                  width={256}
                  height={256}
                  className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 rounded-2xl ring-4 ring-white dark:ring-zinc-900 object-cover shadow-xl"
                />
              ) : (
                <div
                  className={`flex h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 items-center justify-center rounded-2xl ring-4 ring-white dark:ring-zinc-900 bg-gradient-to-br ${avatarGradient} shadow-xl`}
                >
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Verified Badge */}
              {user.verifiedAt && (
                <div
                  className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-indigo-600 shadow-lg ring-2 ring-white dark:ring-zinc-900"
                  title="Zweryfikowany"
                >
                  <CheckCircle
                    className="h-4 w-4 sm:h-5 sm:w-5 text-white"
                    strokeWidth={2.5}
                  />
                </div>
              )}

              {/* Online indicator */}
              {isActive && (
                <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-emerald-500 shadow-lg ring-2 ring-white dark:ring-zinc-900">
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-white animate-pulse" />
                </div>
              )}
            </div>

            {/* CTA Actions - visible on desktop next to avatar */}
            <div className="hidden sm:flex items-center gap-2 pb-2">
              {!isOwnProfile && (
                <>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900 shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-95"
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={2} />
                    Wiadomość
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all active:scale-95"
                  >
                    <UserPlus className="h-4 w-4" strokeWidth={2} />
                    Obserwuj
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User info section */}
          <div className="mt-4 sm:mt-5">
            {/* Name row with badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl md:text-[28px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {displayName}
              </h1>

              {/* Role Badge */}
              {user.role === 'ADMIN' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">
                  <Shield className="h-3 w-3" strokeWidth={2.5} />
                  Admin
                </span>
              )}
              {user.role === 'MODERATOR' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                  <Shield className="h-3 w-3" strokeWidth={2.5} />
                  Moderator
                </span>
              )}

              {/* Activity status badge */}
              {isActive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Aktywny
                </span>
              )}
            </div>

            {/* Username */}
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              @{user.name}
            </p>

            {/* User ID for admins/moderators - debug info (development only) */}
            {process.env.NODE_ENV === 'development' && isAppAdminOrModerator && (
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors font-mono mb-3 group"
                title="Kliknij aby skopiować ID użytkownika" // TODO i18n
              >
                <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                  ID: {user.id}
                </span>
                {copiedId ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                )}
              </button>
            )}

            {/* Spacer when no ID shown */}
            {!(process.env.NODE_ENV === 'development' && isAppAdminOrModerator) && <div className="mb-2" />}

            {/* Bio */}
            {bioShort ? (
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-2xl mb-4 text-sm sm:text-base">
                {bioShort}
              </p>
            ) : (
              isOwnProfile && (
                <Link
                  href={`/${locale}/account/profile`}
                  className="inline-block text-sm text-zinc-400 dark:text-zinc-500 italic mb-4 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Napisz kilka słów o sobie…
                </Link>
              )
            )}

            {/* Meta info row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              {/* Location */}
              {(city || country) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
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
                  <Calendar className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                  <span>
                    Dołączył{' '}
                    {format(memberSince, 'LLLL yyyy', { locale: dateLocale })}
                  </span>
                </div>
              )}
            </div>

            {/* Stats - always visible */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80">
                <Calendar
                  className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
                  strokeWidth={2}
                />
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {stats.eventsCreated}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  wydarzeń
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80">
                <Users
                  className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                  strokeWidth={2}
                />
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {stats.eventsJoined}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  uczestnictw
                </span>
              </div>
              {stats.hostRatingAvg !== null && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80">
                  <Star
                    className="h-4 w-4 text-amber-500"
                    strokeWidth={2}
                    fill="currentColor"
                  />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {stats.hostRatingAvg.toFixed(1)}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    ocena
                  </span>
                </div>
              )}
            </div>

            {/* Mobile CTA - full width buttons */}
            {!isOwnProfile && (
              <div className="flex sm:hidden items-center gap-2 mt-5">
                <button
                  type="button"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-4 py-3 text-sm font-medium text-white dark:text-zinc-900 shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2} />
                  Wiadomość
                </button>
                <button
                  type="button"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all active:scale-[0.98]"
                >
                  <UserPlus className="h-4 w-4" strokeWidth={2} />
                  Obserwuj
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom border */}
      <div className="border-b border-zinc-200 dark:border-zinc-800" />

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
