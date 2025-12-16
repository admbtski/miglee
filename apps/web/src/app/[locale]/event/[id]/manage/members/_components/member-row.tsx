'use client';

// TODO i18n: aria-labels and titles need translation

import clsx from 'clsx';
import { MoreVertical } from 'lucide-react';

import { buildAvatarUrl } from '@/lib/media/url';

import { EventMember, ManageCallbacks } from './types';
import { Avatar, iconForRole } from './members-ui';

// Generate consistent color from string
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-emerald-500',
    'bg-rose-500',
    'bg-violet-500',
  ];
  return colors[Math.abs(hash) % colors.length] || 'bg-blue-500';
}

export function MemberRow({
  member,
  onOpenManage,
}: {
  member: EventMember;
  canManage: boolean;
  onOpenManage: (m: EventMember) => void;
  callbacks: ManageCallbacks;
}) {
  const avatarColor = stringToColor(member.user.name);

  return (
    <div
      role="listitem"
      className={clsx(
        'group grid grid-cols-[auto_1fr_auto] items-center gap-2.5 px-3 py-1.5 transition-colors rounded-lg',
        'hover:bg-zinc-50 dark:hover:bg-white/5'
      )}
    >
      {/* Avatar */}
      <div className="relative">
        {member.user.avatarKey ? (
          <div className="overflow-hidden rounded-full shadow-sm w-9 h-9 ring-1 ring-black/5 dark:ring-white/10">
            <Avatar
              src={buildAvatarUrl(member.user.avatarKey, 'sm')}
              name={member.user.name}
            />
          </div>
        ) : (
          <div
            className={clsx(
              'flex items-center justify-center w-9 h-9 rounded-full text-white text-[13px] font-medium ring-1 ring-black/5 dark:ring-white/10 shadow-sm',
              avatarColor
            )}
          >
            {member.user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {member.user.name}
          </span>

          {/* Role Badge - only for non-participants */}
          {member.role !== 'PARTICIPANT' && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-md h-4',
                member.role === 'OWNER'
                  ? 'bg-indigo-500/15 text-indigo-600 border border-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/20'
                  : member.role === 'MODERATOR'
                    ? 'bg-purple-500/15 text-purple-600 border border-purple-500/20 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/20'
                    : 'bg-zinc-500/15 text-zinc-600 border border-zinc-500/20 dark:bg-zinc-500/15 dark:text-zinc-400 dark:border-zinc-500/20'
              )}
              title={member.role}
            >
              {iconForRole(member.role)}
              {member.role}
            </span>
          )}

          {/* Status Badge */}
          <span
            className={clsx(
              'inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-md h-4',
              member.status === 'JOINED'
                ? 'bg-green-500/15 text-green-600 border border-green-500/20 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/20'
                : member.status === 'PENDING'
                  ? 'bg-amber-500/15 text-amber-600 border border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20'
                  : member.status === 'INVITED'
                    ? 'bg-cyan-500/15 text-cyan-600 border border-cyan-500/20 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/20'
                    : member.status === 'LEFT'
                      ? 'bg-zinc-500/15 text-zinc-600 border border-zinc-500/20 dark:bg-zinc-500/15 dark:text-zinc-400 dark:border-zinc-500/20'
                      : member.status === 'REJECTED'
                        ? 'bg-orange-500/15 text-orange-600 border border-orange-500/25 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25'
                        : member.status === 'KICKED'
                          ? 'bg-red-500/15 text-red-600 border border-red-500/25 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25'
                          : 'bg-red-500/15 text-red-600 border border-red-500/30 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30'
            )}
            title={member.status}
          >
            {member.status}
          </span>
        </div>

        {/* Note - truncated, lighter, smaller, max 70% width */}
        {member.note && (
          <p className="mt-1 text-[11px] leading-tight text-zinc-500 dark:text-zinc-500 truncate max-w-[70%]">
            {member.note}
          </p>
        )}
      </div>

      {/* Action Button - Always visible but subtle */}
      <button
        type="button"
        onClick={() => onOpenManage(member)}
        className={clsx(
          'p-1.5 rounded-md transition-all',
          'text-zinc-400 opacity-40 group-hover:opacity-100',
          'hover:bg-zinc-100 hover:text-zinc-600',
          'dark:text-white dark:opacity-20 dark:group-hover:opacity-60',
          'dark:hover:bg-zinc-800 dark:hover:text-zinc-300',
          'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-300'
        )}
        title="Manage member"
        aria-label={`Zarządzaj: ${member.user.name}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
}
