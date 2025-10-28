// file: components/manage-members/EventMembersPanel.tsx
'use client';

import * as React from 'react';
import { Bell, Filter } from 'lucide-react';
import { Modal } from '@/components/modal/modal';
import { Badge } from './ui';
import {
  EventMembersPanelProps,
  IntentMember,
  READONLY_STATUSES,
  STATUS_BADGE_CLASSES,
  STATUS_GROUP_ORDER,
} from './types';
import { groupMembers } from './types';
import { MemberManageModal } from './member-manage-modal';
import { MembersSection } from './member-section';

export function EventMembersPanel({
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
  onReinvite,
  onCancelInvite,
  onApprovePending,
  onRejectPending,
  onNotifyPremium,
}: EventMembersPanelProps) {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<IntentMember | null>(null);
  const [onlyManageable, setOnlyManageable] = React.useState(false);

  const callbacks = React.useMemo(
    () => ({
      onPromoteToModerator,
      onDemoteToParticipant,
      onMakeOwner,
      onKick,
      onBan,
      onReinvite,
      onCancelInvite,
      onApprovePending,
      onRejectPending,
      onNotifyPremium,
    }),
    [
      onPromoteToModerator,
      onDemoteToParticipant,
      onMakeOwner,
      onKick,
      onBan,
      onReinvite,
      onCancelInvite,
      onApprovePending,
      onRejectPending,
      onNotifyPremium,
    ]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      const byName = !q || m.user.name.toLowerCase().includes(q);
      const manageable =
        !onlyManageable ||
        (!READONLY_STATUSES.includes(m.status) &&
          (canManage ||
            m.status === 'JOINED' ||
            m.status === 'INVITED' ||
            m.status === 'PENDING'));
      return byName && manageable;
    });
  }, [members, query, onlyManageable, canManage]);

  const grouped = React.useMemo(() => groupMembers(filtered), [filtered]);

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
      for (const m of members) out[m.status] += 1;
    }
    return out;
  }, [stats, members]);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        variant="centered"
        labelledById="members-title"
        ariaLabel="Zarządzanie uczestnikami"
        className="max-w-3xl"
        header={
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 id="members-title" className="text-xl font-semibold">
                Zarządzanie uczestnikami
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Panel dostępny dla właściciela i moderatorów. Tylko odczyt dla:
                LEFT, REJECTED, KICKED, BANNED.
              </p>
            </div>
            {isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500/10 to-blue-500/10 px-3 py-1 text-xs font-medium text-fuchsia-600 ring-1 ring-fuchsia-500/20 dark:text-fuchsia-300">
                Premium
              </span>
            )}
          </div>
        }
        content={
          <div className="w-full">
            {/* Controls */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    className="w-44 rounded-md border border-zinc-300 py-1.5 pl-8 pr-2 text-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:border-zinc-500 sm:w-60"
                    placeholder="Szukaj po nazwie…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
                    checked={onlyManageable}
                    onChange={(e) => setOnlyManageable(e.target.checked)}
                  />
                  Tylko zarządzalni
                </label>
              </div>
              {isPremium && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  onClick={() => onNotifyPremium?.(intentId)}
                  title="Wyślij powiadomienie"
                >
                  <Bell className="h-4 w-4" /> Wyślij powiadomienie
                </button>
              )}
            </div>

            {/* Stat pills */}
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              {STATUS_GROUP_ORDER.map((s) => (
                <Badge key={s} className={STATUS_BADGE_CLASSES[s]}>
                  {s}: <b className="ml-1">{counts[s]}</b>
                </Badge>
              ))}
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {STATUS_GROUP_ORDER.map((status) => {
                const items = grouped.get(status) ?? [];
                if (items.length === 0) return null;
                return (
                  <MembersSection
                    key={status}
                    status={status}
                    items={items}
                    canManage={canManage}
                    callbacks={callbacks}
                    onOpenManage={setSelected}
                    defaultOpen={status === 'JOINED' || status === 'PENDING'}
                  />
                );
              })}
            </div>
          </div>
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
    </>
  );
}
