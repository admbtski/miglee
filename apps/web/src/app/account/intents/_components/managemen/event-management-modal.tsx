'use client';

import { Modal } from '@/components/feedback/modal';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  BadgeDollarSign,
  Bell,
  CheckCircle2,
  Link as LinkIcon,
  Loader2,
  Sparkles,
  Users,
} from 'lucide-react';
import * as React from 'react';
import { InviteUsersModal } from './panels/members/invite-users-modal';
import { MemberManageModal } from './panels/members/member-manage-modal';
import { MembersPanel } from './panels/members/members-panel';
import { PlansPanel } from './panels/plans/plans-panel';
import { SubscriptionPanel } from './panels/subscription/subscription-panel';
import { InviteLinksPanel } from './panels/invite-links/invite-links-panel';
import { JoinFormPanel } from './panels/join-form/join-form-panel';
import { EventManagementModalProps, IntentMember } from './types';
import clsx from 'clsx';

type TabKey =
  | 'MEMBERS'
  | 'PLANS'
  | 'NOTIFICATIONS'
  | 'SUBSCRIPTION'
  | 'INVITE_LINKS'
  | 'JOIN_FORM';
type SponsorPlan = 'Basic' | 'Plus' | 'Pro';

type SponsorshipState = {
  plan: SponsorPlan;
  usedBoosts: number;
  usedPushes: number;
  badgeEnabled: boolean;
};

export function EventManagementModal({
  open,
  onClose,
  intentId,
  members,
  canManage,
  isPremium,
  stats,
  onPromoteToModerator,
  onDemoteToParticipant,
  onMakeOwner,
  onKick,
  onBan,
  onUnban,
  onReinvite,
  onCancelInvite,
  onApprovePending,
  onRejectPending,
  onUnreject,
  onNotifyPremium,
  onInvited,

  // NEW: Sponsorship wiring (opcjonalne — podepnij do GraphQL)
  currentSponsorship = {
    badgeEnabled: true,
    plan: 'Basic',
    usedBoosts: 0,
    usedPushes: 0,
  },
  onBoostEvent,
  onSendLocalPush,
  onToggleSponsoredBadge,
  onPurchaseSponsorship,
  onUpgradeSponsorshipPlan,
}: EventManagementModalProps & {
  currentSponsorship?: SponsorshipState | null;
  onPurchaseSponsorship?: (
    intentId: string,
    plan: 'Basic' | 'Plus' | 'Pro'
  ) => Promise<void> | void;
  onBoostEvent?: (intentId: string) => Promise<void> | void;
  onSendLocalPush?: (intentId: string) => Promise<void> | void;
  onToggleSponsoredBadge?: (
    intentId: string,
    enabled: boolean
  ) => Promise<void> | void;
  onUpgradeSponsorshipPlan?: (
    intentId: string,
    newPlan: 'Basic' | 'Plus' | 'Pro'
  ) => Promise<void> | void;

  onInvited?: (ids: string[]) => void;
}) {
  const [activeTab, setActiveTab] = React.useState<TabKey>('MEMBERS');
  const [selected, setSelected] = React.useState<IntentMember | null>(null);
  const [openInvite, setOpenInvite] = React.useState(false);

  // Zamknięcie modala klawiszem Esc
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const callbacks = React.useMemo(
    () => ({
      onPromoteToModerator,
      onDemoteToParticipant,
      onMakeOwner,
      onKick,
      onBan,
      onUnban,
      onReinvite,
      onCancelInvite,
      onApprovePending,
      onRejectPending,
      onUnreject,
      onNotifyPremium,
    }),
    [
      onPromoteToModerator,
      onDemoteToParticipant,
      onMakeOwner,
      onKick,
      onBan,
      onUnban,
      onReinvite,
      onCancelInvite,
      onApprovePending,
      onRejectPending,
      onUnreject,
      onNotifyPremium,
    ]
  );

  const counts: Record<string, number> = React.useMemo(() => {
    const out: Record<string, number> = {
      JOINED: 0,
      INVITED: 0,
      PENDING: 0,
      REJECTED: 0,
      LEFT: 0,
      KICKED: 0,
      BANNED: 0,
    };
    if (stats) {
      for (const k of Object.keys(out)) out[k] = (stats as any)[k] ?? 0;
    } else {
      for (const m of members) out[m.status]! += 1;
    }
    return out;
  }, [stats, members]);

  // ---- NOTIFICATIONS tab state ----
  const [notifyTargets, setNotifyTargets] = React.useState<{
    JOINED: boolean;
    INVITED: boolean;
    PENDING: boolean;
  }>({ JOINED: true, INVITED: false, PENDING: false });
  const [notifyMsg, setNotifyMsg] = React.useState(
    'Hej! Mamy aktualizację dot. wydarzenia…'
  );
  const [sending, setSending] = React.useState(false);

  async function handleSendNotifications() {
    try {
      setSending(true);
      await onNotifyPremium?.(intentId);
      console.info('[notify]', {
        intentId,
        targets: notifyTargets,
        message: notifyMsg,
      });
    } finally {
      setSending(false);
    }
  }

  // Suggestions for Invite modal
  const inviteSuggestions = React.useMemo(
    () =>
      members
        .filter((m) => m.status === 'JOINED')
        .slice(0, 8)
        .map((m) => ({
          id: m.user.id,
          name: m.user.name,
          avatarKey: m.user.avatarKey ?? undefined,
          email: undefined as string | undefined,
        })),
    [members]
  );

  const Header = (
    <div className="flex flex-col gap-2 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Przycisk zamykający modal */}
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="icon-sm"
            className="shrink-0 rounded-full border border-zinc-700/30 bg-white/5 text-zinc-200 hover:bg-white/10 dark:bg-zinc-800/30"
            aria-label="Zamknij"
            title="Zamknij (Esc)"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <h2 className="truncate text-xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text">
            Zarządzanie wydarzeniem
          </h2>
        </div>

        {isPremium && (
          <span className="shrink-0 w-min h-min inline-flex items-center text-nowrap gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-600 px-3 py-1 text-xs font-medium text-white shadow-sm">
            🌟 Premium
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-400">
        Panel dostępny dla właściciela i moderatorów.
      </p>
    </div>
  );

  const Tabs = (
    <div className="mb-5 flex flex-nowrap justify-center gap-1 sm:gap-3">
      {(
        [
          { key: 'MEMBERS', label: 'Uczestnicy', Icon: Users },
          { key: 'JOIN_FORM', label: 'Formularz', Icon: CheckCircle2 },
          { key: 'INVITE_LINKS', label: 'Linki zaproszeń', Icon: LinkIcon },
          { key: 'PLANS', label: 'Sponsorowanie', Icon: BadgeDollarSign },
          { key: 'SUBSCRIPTION', label: 'Pakiet (aktywny)', Icon: Sparkles },
          { key: 'NOTIFICATIONS', label: 'Powiadomienia', Icon: Bell },
        ] as const
      ).map(({ key, label, Icon }) => {
        if (key === 'SUBSCRIPTION' && !currentSponsorship) return null;
        const active = activeTab === (key as TabKey);
        return (
          <button
            key={key}
            onClick={() => setActiveTab(key as TabKey)}
            className={clsx(
              'w-full inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 truncate',
              active
                ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-sm'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 dark:bg-zinc-800/30'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate text-xs sm:text-md">{label}</span>
          </button>
        );
      })}
    </div>
  );

  const NotificationsContent = (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="text-base font-semibold">Szybkie powiadomienie</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Wyślij krótką wiadomość do wybranych grup. (Wpięte pod{' '}
          <code>onNotifyPremium</code> jako placeholder).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3 text-sm font-medium">Odbiorcy</div>
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
              checked={notifyTargets.JOINED}
              onChange={(e) =>
                setNotifyTargets((s) => ({ ...s, JOINED: e.target.checked }))
              }
            />
            JOINED ({counts.JOINED})
          </label>
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
              checked={notifyTargets.INVITED}
              onChange={(e) =>
                setNotifyTargets((s) => ({ ...s, INVITED: e.target.checked }))
              }
            />
            INVITED ({counts.INVITED})
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
              checked={notifyTargets.PENDING}
              onChange={(e) =>
                setNotifyTargets((s) => ({ ...s, PENDING: e.target.checked }))
              }
            />
            PENDING ({counts.PENDING})
          </label>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-2 text-sm font-medium">Wiadomość</div>
          <textarea
            className="h-28 w-full resize-none rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
            value={notifyMsg}
            onChange={(e) => setNotifyMsg(e.target.value)}
            placeholder="Treść komunikatu…"
          />
          <div className="mt-3 flex items-center justify-end">
            <Button
              type="button"
              disabled={sending}
              onClick={handleSendNotifications}
              variant="default"
              size="default"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Wysyłanie…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Wyślij
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        variant="default"
        density="compact"
        labelledById="members-title"
        ariaLabel="Zarządzanie uczestnikami"
        className="max-w-4xl"
        header={<>{Header}</>}
        content={
          <>
            {Tabs}
            <div className="rounded-2xl border border-white/10 bg-white/1 p-4 backdrop-blur-sm dark:border-zinc-800/40">
              {activeTab === 'MEMBERS' && (
                <MembersPanel
                  members={members}
                  canManage={canManage}
                  callbacks={callbacks}
                  onOpenManage={setSelected}
                  stats={counts}
                  intentId={intentId}
                  onInvited={onInvited}
                />
              )}

              {activeTab === 'INVITE_LINKS' && (
                <InviteLinksPanel intentId={intentId} />
              )}

              {activeTab === 'JOIN_FORM' && (
                <JoinFormPanel intentId={intentId} />
              )}

              {activeTab === 'PLANS' && (
                <PlansPanel
                  intentId={intentId}
                  onPurchase={onPurchaseSponsorship}
                />
              )}

              {activeTab === 'SUBSCRIPTION' && currentSponsorship && (
                <SubscriptionPanel
                  intentId={intentId}
                  sponsorship={currentSponsorship}
                  onBoostEvent={onBoostEvent}
                  onSendLocalPush={onSendLocalPush}
                  onToggleSponsoredBadge={onToggleSponsoredBadge}
                  onUpgradeSponsorshipPlan={onUpgradeSponsorshipPlan}
                />
              )}
              {activeTab === 'NOTIFICATIONS' && NotificationsContent}
            </div>
          </>
        }
      />

      {/* Inner member modal */}
      <MemberManageModal
        open={!!selected}
        onClose={() => setSelected(null)}
        member={selected}
        canManage={canManage}
        callbacks={{
          ...callbacks,
          onKick: async (m) => {
            await callbacks.onKick?.(m);
            setSelected(null);
          },
          onBan: async (m) => {
            await callbacks.onBan?.(m);
            setSelected(null);
          },
          onApprovePending: async (m) => {
            await callbacks.onApprovePending?.(m);
            setSelected(null);
          },
          onRejectPending: async (m) => {
            await callbacks.onRejectPending?.(m);
            setSelected(null);
          },
          onCancelInvite: async (m) => {
            await callbacks.onCancelInvite?.(m);
            setSelected(null);
          },
        }}
      />

      {/* Invite users modal */}
      <InviteUsersModal
        open={openInvite}
        onClose={() => setOpenInvite(false)}
        intentId={intentId}
        suggestions={inviteSuggestions}
        onInvited={(ids) => {
          onInvited?.(ids);
          setOpenInvite(false);
        }}
      />
    </>
  );
}
