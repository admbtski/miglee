// file: components/manage-members/MemberManageModal.tsx
'use client';

import { Modal } from '@/components/modal/modal';
import clsx from 'clsx';
import {
  Ban,
  CheckCircle2,
  Crown,
  Info,
  RotateCcw,
  Shield,
  User as UserIcon,
  UserMinus,
  UserX,
  XCircle,
} from 'lucide-react';
import * as React from 'react';
import {
  EventMembersPanelProps,
  IntentMember,
  READONLY_STATUSES,
  ROLE_BADGE_CLASSES,
  STATUS_BADGE_CLASSES,
} from './types';
import { Avatar, Badge, iconForRole } from './ui';

export function MemberManageModal({
  open,
  onClose,
  member,
  canManage,
  callbacks,
}: {
  open: boolean;
  onClose: () => void;
  member: IntentMember | null;
  canManage: boolean;
  callbacks: Pick<
    EventMembersPanelProps,
    | 'onPromoteToModerator'
    | 'onDemoteToParticipant'
    | 'onMakeOwner'
    | 'onKick'
    | 'onBan'
    | 'onUnban'
    | 'onReinvite'
    | 'onCancelInvite'
    | 'onApprovePending'
    | 'onRejectPending'
    | 'onNotifyPremium'
  >;
}) {
  if (!member) return null;
  const readOnly = READONLY_STATUSES.includes(member.status);

  const Header = (
    <div className="flex items-start gap-3">
      <Avatar src={member.user.imageUrl} name={member.user.name} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold">
            {member.user.name}
          </h3>
          <Badge className={ROLE_BADGE_CLASSES[member.role]}>
            {' '}
            {iconForRole(member.role)} {member.role}{' '}
          </Badge>
          <Badge className={STATUS_BADGE_CLASSES[member.status]}>
            {' '}
            {member.status}{' '}
          </Badge>
        </div>
        {member.note && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {member.note}
          </p>
        )}
      </div>
    </div>
  );

  const ActionBtn = ({
    onClick,
    children,
    className,
    disabled,
  }: React.PropsWithChildren<{
    onClick?: () => void | Promise<void>;
    className?: string;
    disabled?: boolean;
  }>) => (
    <button
      className={clsx(
        'rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );

  const Content = (
    <div className="grid gap-3">
      <section className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Zarządzanie rolą
        </h4>
        <div className="flex flex-wrap gap-2">
          <ActionBtn
            disabled={!canManage || readOnly || member.role === 'MODERATOR'}
            onClick={() => callbacks.onPromoteToModerator?.(member)}
            className="border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <Shield className="mr-1 inline-block h-4 w-4" /> Awansuj na
            MODERATOR
          </ActionBtn>
          <ActionBtn
            disabled={
              !canManage ||
              readOnly ||
              member.role === 'PARTICIPANT' ||
              member.status !== 'JOINED'
            }
            onClick={() => callbacks.onDemoteToParticipant?.(member)}
            className="border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <UserIcon className="mr-1 inline-block h-4 w-4" /> Zdegraduj do
            PARTICIPANT
          </ActionBtn>
          <ActionBtn
            disabled={
              !canManage ||
              readOnly ||
              member.role === 'OWNER' ||
              member.status !== 'JOINED'
            }
            onClick={() => callbacks.onMakeOwner?.(member)}
            className="border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-900/20"
          >
            <Crown className="mr-1 inline-block h-4 w-4" /> Przekaż OWNERSHIP
          </ActionBtn>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Zarządzanie członkostwem
        </h4>
        <div className="flex flex-wrap gap-2">
          {member.status === 'JOINED' && (
            <>
              <ActionBtn
                disabled={!canManage}
                onClick={() => callbacks.onKick?.(member)}
                className="border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <UserMinus className="mr-1 inline-block h-4 w-4" /> Kick
              </ActionBtn>
              <ActionBtn
                disabled={!canManage}
                onClick={() => callbacks.onBan?.(member)}
                className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/20"
              >
                <Ban className="mr-1 inline-block h-4 w-4" /> Ban (permanent)
              </ActionBtn>
            </>
          )}
          {member.status === 'BANNED' && (
            <ActionBtn
              disabled={!canManage}
              onClick={() => callbacks.onUnban?.(member)}
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
            >
              <RotateCcw className="mr-1 inline-block h-4 w-4" /> Unban
            </ActionBtn>
          )}

          {member.status === 'PENDING' && (
            <>
              <ActionBtn
                disabled={!canManage}
                onClick={() => callbacks.onApprovePending?.(member)}
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
              >
                <CheckCircle2 className="mr-1 inline-block h-4 w-4" /> Zatwierdź
              </ActionBtn>
              <ActionBtn
                disabled={!canManage}
                onClick={() => callbacks.onRejectPending?.(member)}
                className="border-orange-300 text-orange-800 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/20"
              >
                <UserX className="mr-1 inline-block h-4 w-4" /> Odrzuć
              </ActionBtn>
              <ActionBtn
                disabled={!canManage}
                onClick={() => callbacks.onCancelInvite?.(member)}
                className="border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <XCircle className="mr-1 inline-block h-4 w-4" /> Anuluj prośbę
              </ActionBtn>
            </>
          )}

          {member.status === 'INVITED' && (
            <>
              <ActionBtn
                disabled={!canManage}
                onClick={() => callbacks.onReinvite?.(member)}
                className="border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <RotateCcw className="mr-1 inline-block h-4 w-4" /> Wyślij
                ponownie
              </ActionBtn>
              <ActionBtn
                disabled={!canManage}
                onClick={() => callbacks.onCancelInvite?.(member)}
                className="border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <XCircle className="mr-1 inline-block h-4 w-4" /> Anuluj
                zaproszenie
              </ActionBtn>
            </>
          )}
        </div>

        {readOnly && member.status !== 'BANNED' && (
          <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
            <Info className="mr-2 inline-block h-4 w-4" /> Ten członek ma status
            tylko do odczytu ({member.status}) — akcje są niedostępne.
          </div>
        )}
      </section>
    </div>
  );

  const Footer = (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={onClose}
        className="rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        Zamknij
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      header={Header}
      content={Content}
      footer={Footer}
    />
  );
}
