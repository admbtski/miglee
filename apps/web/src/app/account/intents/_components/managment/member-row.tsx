'use client';

import * as React from 'react';
import {
  Mail,
  XCircle,
  CheckCircle2,
  UserX,
  UserMinus,
  Ban,
  Crown,
  Shield,
  User as UserIcon,
  RotateCcw,
} from 'lucide-react';
import { ActionsDropdown, type ActionItem } from './action-dropdown';
import { Avatar, Badge, iconForRole } from './ui';
import {
  IntentMember,
  ManageCallbacks,
  READONLY_STATUSES,
  ROLE_BADGE_CLASSES,
  STATUS_BADGE_CLASSES,
} from './types';

export function MemberRow({
  member,
  canManage,
  onOpenManage,
  callbacks,
}: {
  member: IntentMember;
  canManage: boolean;
  onOpenManage: (m: IntentMember) => void;
  callbacks: ManageCallbacks;
}) {
  const readOnly = READONLY_STATUSES.includes(member.status);

  const actions: ActionItem[] = [
    {
      key: 'make-owner',
      label: 'Przekaż OWNERSHIP',
      icon: <Crown className="h-4 w-4" />,
      disabled:
        !canManage ||
        readOnly ||
        member.role === 'OWNER' ||
        member.status !== 'JOINED',
      onClick: () => callbacks.onMakeOwner?.(member),
    },
    {
      key: 'promote-mod',
      label: 'Awansuj na MODERATOR',
      icon: <Shield className="h-4 w-4" />,
      disabled: !canManage || readOnly || member.role === 'MODERATOR',
      onClick: () => callbacks.onPromoteToModerator?.(member),
    },
    {
      key: 'demote-part',
      label: 'Zdegraduj do PARTICIPANT',
      icon: <UserIcon className="h-4 w-4" />,
      disabled:
        !canManage ||
        readOnly ||
        member.role === 'PARTICIPANT' ||
        member.status !== 'JOINED',
      onClick: () => callbacks.onDemoteToParticipant?.(member),
    },
    'divider',
    ...(member.status === 'JOINED'
      ? ([
          {
            key: 'kick',
            label: 'Kick',
            icon: <UserMinus className="h-4 w-4" />,
            onClick: () => callbacks.onKick?.(member),
          },
          {
            key: 'ban',
            label: 'Ban (permanent)',
            icon: <Ban className="h-4 w-4" />,
            danger: true,
            onClick: () => callbacks.onBan?.(member),
          },
        ] as ActionItem[])
      : []),
    // Jeśli BANNED – pokaż UNBAN jako jedyną sensowną akcję
    ...(member.status === 'BANNED'
      ? ([
          {
            key: 'unban',
            label: 'Unban',
            icon: <RotateCcw className="h-4 w-4" />,
            danger: false,
            disabled: !canManage,
            onClick: () => callbacks.onUnban?.(member),
          },
        ] as ActionItem[])
      : []),
    ...(member.status === 'INVITED'
      ? ([
          {
            key: 'reinvite',
            label: 'Wyślij ponownie',
            icon: <Mail className="h-4 w-4" />,
            onClick: () => callbacks.onReinvite?.(member),
          },
          {
            key: 'cancel-invite',
            label: 'Anuluj zaproszenie',
            icon: <XCircle className="h-4 w-4" />,
            onClick: () => callbacks.onCancelInvite?.(member),
          },
        ] as ActionItem[])
      : []),
    ...(member.status === 'PENDING'
      ? ([
          {
            key: 'approve',
            label: 'Zatwierdź',
            icon: <CheckCircle2 className="h-4 w-4" />,
            onClick: () => callbacks.onApprovePending?.(member),
          },
          {
            key: 'reject',
            label: 'Odrzuć',
            icon: <UserX className="h-4 w-4" />,
            onClick: () => callbacks.onRejectPending?.(member),
          },
          {
            key: 'cancel-req',
            label: 'Anuluj prośbę',
            icon: <XCircle className="h-4 w-4" />,
            onClick: () => callbacks.onCancelInvite?.(member),
          },
        ] as ActionItem[])
      : []),
  ];

  const dropdownDisabled =
    !canManage || (readOnly && member.status !== 'BANNED');

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <Avatar src={member.user.imageUrl} name={member.user.name} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">
            {member.user.name}
          </span>
          <Badge className={ROLE_BADGE_CLASSES[member.role]}>
            {iconForRole(member.role)} {member.role}
          </Badge>
          <Badge className={STATUS_BADGE_CLASSES[member.status]}>
            {member.status}
          </Badge>
        </div>
        {member.note && (
          <p className="mt-0.5 line-clamp-1 text-xs text-zinc-600 dark:text-zinc-400">
            {member.note}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          onClick={() => onOpenManage(member)}
          title="Szczegóły"
        >
          Szczegóły
        </button>
        <ActionsDropdown disabled={dropdownDisabled} actions={actions} />
      </div>
    </div>
  );
}
