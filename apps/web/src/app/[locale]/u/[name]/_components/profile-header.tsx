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
    <div className="relative bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
      {/* Cover - Clean gradient or user cover */}
      <div className="relative h-40">
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
          <div className="h-40 bg-gradient-to-r from-amber-300 via-orange-400 to-emerald-400" />
        )}

        {/* Edit Button */}
        {isOwnProfile && (
          <Link
            href="/account/profile"
            className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-lg bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Edit</span>
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-6">
          {/* Avatar */}
          <div className="relative -mt-20">
            {user.avatarKey ? (
              <BlurHashImage
                src={buildAvatarUrl(user.avatarKey, 'xl') || ''}
                blurhash={user.avatarBlurhash}
                alt={displayName}
                width={256}
                height={256}
                className="h-28 w-28 rounded-full ring-4 ring-white dark:ring-zinc-900 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full ring-4 ring-white dark:ring-zinc-900 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                <span className="text-3xl font-semibold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Verified Badge */}
            {user.verifiedAt && (
              <div
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 shadow-sm ring-2 ring-white dark:ring-zinc-900"
                title="Verified"
              >
                <CheckCircle className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
            )}
          </div>

          {/* Name & Info */}
          <div className="space-y-1 min-w-0">
            {/* Name & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {displayName}
              </h1>

              {/* Role Badge - Neutral, light */}
              {user.role === 'ADMIN' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                  <Shield className="h-3 w-3" strokeWidth={2} />
                  Admin
                </span>
              )}
              {user.role === 'MODERATOR' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                  <Shield className="h-3 w-3" strokeWidth={2} />
                  Moderator
                </span>
              )}

              {/* Status */}
              {user.lastSeenAt && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                  Active
                </span>
              )}
            </div>

            {/* Bio Short */}
            {bioShort && (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                {bioShort}
              </p>
            )}

            {/* Location */}
            {(city || country) && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                <span>
                  {city}
                  {city && country && ', '}
                  {country}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!isOwnProfile && (
              <>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2} />
                  Message
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <UserPlus className="h-4 w-4" strokeWidth={2} />
                  Connect
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 hover:border-red-300 dark:hover:border-red-800 transition-colors"
                  title="Report"
                >
                  <Flag className="h-4 w-4" strokeWidth={2} />
                </button>
              </>
            )}
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
