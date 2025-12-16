'use client';

// TODO i18n: Polish strings need translation (button labels, confirmations, etc.)

import * as React from 'react';
import {
  ArrowUpCircle,
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
import clsx from 'clsx';

import { Modal } from '@/components/feedback/modal';
import { buildAvatarUrl } from '@/lib/media/url';

import {
  EventManagementModalProps,
  EventMember,
  READONLY_STATUSES,
  ROLE_BADGE_CLASSES,
  STATUS_BADGE_CLASSES,
} from './types';
import { Avatar, Badge, iconForRole } from './members-ui';

type BtnVariant =
  | 'solid'
  | 'soft'
  | 'outline'
  | 'danger'
  | 'danger-soft'
  | 'success-soft'
  | 'warning-soft';

function btnClasses(variant: BtnVariant, extra?: string) {
  const common =
    'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed';

  const map: Record<BtnVariant, string> = {
    solid:
      'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-300 dark:focus:ring-indigo-700',
    soft: 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 focus:ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:ring-zinc-700',
    outline:
      'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 focus:ring-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:ring-indigo-700',
    danger:
      'bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-300 dark:focus:ring-rose-700',
    'danger-soft':
      'border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 focus:ring-rose-300 dark:border-rose-700 dark:text-rose-300 dark:bg-zinc-900 dark:hover:bg-rose-900/20 dark:focus:ring-rose-700',
    'success-soft':
      'border border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 focus:ring-emerald-300 dark:border-emerald-700 dark:text-emerald-300 dark:bg-zinc-900 dark:hover:bg-emerald-900/20 dark:focus:ring-emerald-700',
    'warning-soft':
      'border border-orange-300 text-orange-800 bg-white hover:bg-orange-50 focus:ring-orange-300 dark:border-orange-700 dark:text-orange-300 dark:bg-zinc-900 dark:hover:bg-orange-900/20 dark:focus:ring-orange-700',
  };

  return clsx(common, map[variant], extra);
}

export function MemberManageModal({
  open,
  onClose,
  member,
  canManage,
  callbacks,
}: {
  open: boolean;
  onClose: () => void;
  member: EventMember | null;
  canManage: boolean;
  callbacks: Pick<
    EventManagementModalProps,
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
    | 'onUnreject'
    | 'onNotifyPremium'
    | 'onPromoteFromWaitlist'
    | 'onRemoveFromWaitlist'
  >;
}) {
  if (!member) return null;
  const readOnly = READONLY_STATUSES.includes(member.status);

  // skróty klawiszowe
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key === 'Enter' && member.status === 'PENDING') {
        e.preventDefault();
        callbacks.onApprovePending?.(member);
      }
      if (
        e.altKey &&
        (e.key === 'Backspace' || e.key === 'Delete') &&
        member.status === 'PENDING'
      ) {
        e.preventDefault();
        callbacks.onRejectPending?.(member);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, callbacks, member]);

  const Header = React.useMemo(
    () => (
      <div className="flex items-start gap-3">
        <Avatar
          src={buildAvatarUrl(member.user.avatarKey, 'sm')}
          name={member.user.name}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {member.user.name}
            </h3>
            <Badge
              className={clsx(
                'ring-1 ring-inset ring-black/5 dark:ring-white/5',
                ROLE_BADGE_CLASSES[member.role]
              )}
            >
              {iconForRole(member.role)} {member.role}
            </Badge>
            <Badge
              className={clsx(
                'ring-1 ring-inset ring-black/5 dark:ring-white/5',
                STATUS_BADGE_CLASSES[member.status]
              )}
            >
              {member.status}
            </Badge>
          </div>
          {member.note && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {member.note}
            </p>
          )}
        </div>
      </div>
    ),
    [member]
  );

  const Section = ({
    title,
    children,
    icon,
  }: React.PropsWithChildren<{ title: string; icon?: React.ReactNode }>) => (
    <section className="rounded-2xl border border-zinc-200 bg-white/60 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <h4 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {icon} {title}
      </h4>
      {children}
    </section>
  );

  const Confirm = async (message: string) => {
    // prosty guard — możesz wymienić na własny dialog
    return window.confirm(message);
  };

  const Content = React.useMemo(
    () => (
      <div className="grid gap-4">
        {/* Quick actions (kontekstowe) */}
        {member.status === 'PENDING' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={btnClasses('success-soft')}
              onClick={() => callbacks.onApprovePending?.(member)}
              title="Ctrl/Cmd + Enter"
            >
              <CheckCircle2 className="h-4 w-4" />
              Zatwierdź
            </button>
            <button
              className={btnClasses('warning-soft')}
              onClick={() => callbacks.onRejectPending?.(member)}
              title="Alt + Backspace"
            >
              <UserX className="h-4 w-4" />
              Odrzuć
            </button>
          </div>
        )}

        {member.status === 'WAITLIST' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={btnClasses('success-soft')}
              onClick={() => callbacks.onPromoteFromWaitlist?.(member)}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Promuj z listy oczekujących
            </button>
            <button
              className={btnClasses('warning-soft')}
              onClick={async () => {
                if (
                  await Confirm(
                    'Na pewno usunąć użytkownika z listy oczekujących?'
                  )
                ) {
                  callbacks.onRemoveFromWaitlist?.(member);
                }
              }}
            >
              <XCircle className="h-4 w-4" />
              Usuń z listy
            </button>
          </div>
        )}

        {/* Role */}
        <Section
          title="Zarządzanie rolą"
          icon={<Shield className="h-4 w-4 text-indigo-500" />}
        >
          <div className="flex flex-wrap gap-2">
            <button
              className={btnClasses('soft')}
              disabled={!canManage || readOnly || member.role === 'MODERATOR'}
              onClick={() => callbacks.onPromoteToModerator?.(member)}
            >
              <Shield className="h-4 w-4" />
              Awansuj na MODERATOR
            </button>

            <button
              className={btnClasses('outline')}
              disabled={
                !canManage ||
                readOnly ||
                member.role === 'PARTICIPANT' ||
                member.status !== 'JOINED'
              }
              onClick={() => callbacks.onDemoteToParticipant?.(member)}
            >
              <UserIcon className="h-4 w-4" />
              Zdegraduj do PARTICIPANT
            </button>

            <button
              className={btnClasses('solid')}
              disabled={
                !canManage ||
                readOnly ||
                member.role === 'OWNER' ||
                member.status !== 'JOINED'
              }
              onClick={async () => {
                if (
                  await Confirm(
                    'Na pewno przekazać OWNERSHIP temu użytkownikowi?'
                  )
                ) {
                  callbacks.onMakeOwner?.(member);
                }
              }}
            >
              <Crown className="h-4 w-4" />
              Przekaż OWNERSHIP
            </button>
          </div>
        </Section>

        {/* Membership */}
        <Section
          title="Zarządzanie członkostwem"
          icon={<UserIcon className="h-4 w-4 text-indigo-500" />}
        >
          <div className="flex flex-wrap gap-2">
            {member.status === 'JOINED' && (
              <>
                <button
                  className={btnClasses('outline')}
                  disabled={!canManage}
                  onClick={async () => {
                    if (
                      await Confirm(
                        'Na pewno usunąć użytkownika z wydarzenia (kick)?'
                      )
                    ) {
                      callbacks.onKick?.(member);
                    }
                  }}
                >
                  <UserMinus className="h-4 w-4" />
                  Kick
                </button>

                <button
                  className={btnClasses('danger')}
                  disabled={!canManage}
                  onClick={async () => {
                    if (
                      await Confirm(
                        'Trwale zbanować użytkownika na tym wydarzeniu?'
                      )
                    ) {
                      callbacks.onBan?.(member);
                    }
                  }}
                >
                  <Ban className="h-4 w-4" />
                  Ban (permanent)
                </button>
              </>
            )}

            {member.status === 'BANNED' && (
              <button
                className={btnClasses('success-soft')}
                disabled={!canManage}
                onClick={() => callbacks.onUnban?.(member)}
              >
                <RotateCcw className="h-4 w-4" />
                Unban
              </button>
            )}

            {member.status === 'REJECTED' && (
              <button
                className={btnClasses('success-soft')}
                disabled={!canManage}
                onClick={() => callbacks.onUnreject?.(member)}
              >
                <RotateCcw className="h-4 w-4" />
                Cofnij odrzucenie
              </button>
            )}

            {member.status === 'PENDING' && (
              <>
                <button
                  className={btnClasses('success-soft')}
                  disabled={!canManage}
                  onClick={() => callbacks.onApprovePending?.(member)}
                  title="Ctrl/Cmd + Enter"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Zatwierdź
                </button>
                <button
                  className={btnClasses('warning-soft')}
                  disabled={!canManage}
                  onClick={() => callbacks.onRejectPending?.(member)}
                  title="Alt + Backspace"
                >
                  <UserX className="h-4 w-4" />
                  Odrzuć
                </button>
                <button
                  className={btnClasses('outline')}
                  disabled={!canManage}
                  onClick={() => callbacks.onCancelInvite?.(member)}
                >
                  <XCircle className="h-4 w-4" />
                  Anuluj prośbę
                </button>
              </>
            )}

            {member.status === 'INVITED' && (
              <>
                <button
                  className={btnClasses('outline')}
                  disabled={!canManage}
                  onClick={() => callbacks.onReinvite?.(member)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Wyślij ponownie
                </button>
                <button
                  className={btnClasses('outline')}
                  disabled={!canManage}
                  onClick={() => callbacks.onCancelInvite?.(member)}
                >
                  <XCircle className="h-4 w-4" />
                  Anuluj zaproszenie
                </button>
              </>
            )}
          </div>

          {readOnly && member.status !== 'BANNED' && (
            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
              <Info className="mr-2 inline-block h-4 w-4" />
              Ten członek ma status tylko do odczytu ({member.status}) — akcje
              są niedostępne.
            </div>
          )}
        </Section>
      </div>
    ),
    [member, canManage, readOnly, callbacks, Confirm]
  );

  const Footer = React.useMemo(
    () => (
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          <kbd className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
            Esc
          </kbd>{' '}
          zamknij
          {member.status === 'PENDING' && (
            <>
              <span className="mx-2">•</span>
              <kbd className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
                Ctrl/Cmd
              </kbd>{' '}
              +{' '}
              <kbd className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
                Enter
              </kbd>{' '}
              zatwierdź
              <span className="mx-2">•</span>
              <kbd className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
                Alt
              </kbd>{' '}
              +{' '}
              <kbd className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
                Backspace
              </kbd>{' '}
              odrzuć
            </>
          )}
        </div>
        <button onClick={onClose} className={btnClasses('soft')}>
          Zamknij
        </button>
      </div>
    ),
    [member, onClose]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      header={Header}
      content={Content}
      footer={Footer}
      // Jeżeli Twój <Modal> wspiera klasę dla body: lekkie tło i lepsze przewijanie:
      // bodyClassName="max-h-[70vh] overflow-auto bg-gradient-to-b from-white/50 to-white/20 dark:from-zinc-900/50 dark:to-zinc-900/20"
    />
  );
}
