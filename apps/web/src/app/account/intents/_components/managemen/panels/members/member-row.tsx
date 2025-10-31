'use client';

import clsx from 'clsx';
import { SettingsIcon } from 'lucide-react';
import {
  IntentMember,
  ManageCallbacks,
  ROLE_BADGE_CLASSES,
  STATUS_BADGE_CLASSES,
} from '../../types';
import { Avatar, Badge, iconForRole } from '../../ui';

export function MemberRow({
  member,
  onOpenManage,
}: {
  member: IntentMember;
  canManage: boolean;
  onOpenManage: (m: IntentMember) => void;
  callbacks: ManageCallbacks;
}) {
  return (
    <div
      role="listitem"
      className={clsx(
        'grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-zinc-200/70 bg-white/60 p-3 shadow-sm transition',
        'hover:border-zinc-300 hover:shadow-md dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:hover:border-zinc-700'
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Avatar src={member.user.imageUrl} name={member.user.name} />
        <div className="min-w-0 flex-1 items-center self-center">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {member.user.name}
            </span>

            {/* Chips: mają się wrapować — dlatego flex-wrap na kontenerze powyżej */}
            <Badge
              className={clsx(
                'ring-1 ring-inset ring-white/40 dark:ring-black/20',
                ROLE_BADGE_CLASSES[member.role]
              )}
              title={member.role}
            >
              {iconForRole(member.role)} {member.role}
            </Badge>

            <Badge
              className={clsx(
                'ring-1 ring-inset ring-white/40 dark:ring-black/20',
                STATUS_BADGE_CLASSES[member.status]
              )}
              title={member.status}
            >
              {member.status}
            </Badge>
          </div>

          {member.note && (
            <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
              {member.note}
            </p>
          )}
        </div>
      </div>

      {/* Prawa kolumna: „Szczegóły” – zawsze przy prawej krawędzi */}
      <div className="ml-auto">
        <button
          type="button"
          onClick={() => onOpenManage(member)}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-lg border border-zinc-300/80 bg-white px-3 py-1.5 text-xs text-zinc-700 shadow-sm transition',
            'hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-300',
            'dark:border-zinc-700/80 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
          )}
          title="Szczegóły członka"
          aria-label={`Zarządzaj: ${member.user.name}`}
        >
          <SettingsIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:block">Zarządzaj</span>
        </button>
      </div>
    </div>
  );
}
