'use client';

import clsx from 'clsx';
import { BarChart2, ChevronDown, Filter, UserPlus, X } from 'lucide-react';
import * as React from 'react';
import { groupMembers, IntentMember, STATUS_GROUP_ORDER } from './types';
import { MembersSection } from './member-section';
import { InviteUsersModal } from './invite-users-modal';

export interface MembersPanelProps {
  /** lista członków renderowana w sekcjach */
  members: IntentMember[];
  /** uprawnienia – przekazywane dalej do sekcji/wierszy */
  canManage: boolean;
  /** callbacki do akcji na członkach – proxy do MemberRow/MemberManageModal */
  callbacks: any;
  /** otwiera modal szczegółów dla wskazanego członka */
  onOpenManage: (m: IntentMember | null) => void;
  /** statystyki per status (gdy brak – liczone z members) */
  stats: Record<string, number>;

  /** NOWE: ID wydarzenia potrzebne do zaproszeń */
  intentId: string;
  /** NOWE: callback po zaproszeniu (zwraca udane userIds) */
  onInvited?: (invitedUserIds: string[]) => void;
}

export function MembersPanel({
  members,
  canManage,
  callbacks,
  onOpenManage,
  stats,
  intentId,
  onInvited,
}: MembersPanelProps) {
  const [query, setQuery] = React.useState('');
  const [statsOpen, setStatsOpen] = React.useState(false);
  const [openInvite, setOpenInvite] = React.useState(false);

  // filtrowanie po nazwie
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      const byName = !q || m.user.name.toLowerCase().includes(q);
      return byName;
    });
  }, [members, query]);

  const grouped = React.useMemo(() => groupMembers(filtered), [filtered]);

  // zamykanie dropdownu statystyk po kliknięciu poza
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!statsOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setStatsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [statsOpen]);

  // total do pasków
  const total =
    STATUS_GROUP_ORDER.reduce((sum, s) => sum + (stats[s] ?? 0), 0) || 1;

  // Sugestie do modala (JOINED → unikatowe osoby, max 12)
  const inviteSuggestions = React.useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{
      id: string;
      name: string;
      avatarKey?: string | null;
      email?: string | null;
    }> = [];
    for (const m of members) {
      if (m.status !== 'JOINED') continue;
      const u = m.user;
      if (!u?.id || seen.has(u.id)) continue;
      seen.add(u.id);
      out.push({
        id: u.id,
        name: u.name,
        avatarKey: (u as any).avatarKey ?? null,
        email: (u as any).email ?? null,
      });
      if (out.length >= 12) break;
    }
    return out;
  }, [members]);

  // Pasek sterujący
  const Controls = (
    <div className="mb-4 flex flex-row flex-nowrap items-start justify-between gap-2">
      {/* Left: search */}
      <div className="min-w-0 w-full">
        <label className="sr-only" htmlFor="members-search">
          Szukaj po nazwie
        </label>
        <div className="relative w-full">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="members-search"
            className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-10 pr-9 text-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:border-indigo-500/70"
            placeholder="Szukaj po nazwie…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              aria-label="Wyczyść filtr"
              title="Wyczyść"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="pointer-events-none absolute -bottom-5 left-0 text-xs text-zinc-500 dark:text-zinc-400">
            Wyniki: <b>{filtered.length}</b>
          </div>
        </div>
      </div>

      {/* Right: buttons (Invite + Stats) */}
      <div className="flex shrink-0 items-stretch gap-2">
        <div className="relative flex flex-nowrap gap-3" ref={dropdownRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={statsOpen}
            aria-label="Szybkie statystyki statusów"
            onClick={() => setStatsOpen((s) => !s)}
            className={clsx(
              'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition',
              'border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800',
              'focus:outline-none focus:ring-2 focus:ring-indigo-400/50'
            )}
          >
            <BarChart2 className="h-5 w-5" />
            <span className="hidden sm:block">Statystyki</span>
            <ChevronDown
              className={clsx(
                'h-4 w-4 transition-transform',
                statsOpen && 'rotate-180'
              )}
              aria-hidden
            />
          </button>
          <button
            type="button"
            onClick={() => setOpenInvite(true)}
            className={clsx(
              'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition',
              'border-indigo-300 bg-indigo-600 text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300',
              'dark:border-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500'
            )}
            aria-haspopup="dialog"
            aria-expanded={openInvite}
          >
            <UserPlus className="h-5 w-5" />
            <span className="hidden sm:block">Zaproś</span>
          </button>

          {statsOpen && (
            <div
              className="absolute right-0 top-[110%] z-20 w-72 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900"
              role="menu"
            >
              <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Szybkie statystyki
              </div>
              <div className="grid gap-1.5">
                {STATUS_GROUP_ORDER.map((s) => {
                  const count = stats[s] ?? 0;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div
                      key={s}
                      className="rounded-xl p-2 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                      role="menuitem"
                      aria-label={`${s}: ${count} (${pct}%)`}
                    >
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={clsx(
                              'h-1.5 w-1.5 shrink-0 rounded-full',
                              s === 'JOINED'
                                ? 'bg-emerald-500'
                                : s === 'PENDING'
                                  ? 'bg-yellow-500'
                                  : s === 'INVITED'
                                    ? 'bg-cyan-500'
                                    : s === 'LEFT'
                                      ? 'bg-zinc-400'
                                      : s === 'REJECTED'
                                        ? 'bg-orange-500'
                                        : s === 'KICKED'
                                          ? 'bg-rose-500'
                                          : 'bg-red-600'
                            )}
                          />
                          <span className="font-medium">{s}</span>
                        </div>
                        <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={clsx(
                            'h-full rounded-full',
                            s === 'JOINED'
                              ? 'bg-emerald-500'
                              : s === 'PENDING'
                                ? 'bg-yellow-500'
                                : s === 'INVITED'
                                  ? 'bg-cyan-500'
                                  : s === 'LEFT'
                                    ? 'bg-zinc-400'
                                    : s === 'REJECTED'
                                      ? 'bg-orange-500'
                                      : s === 'KICKED'
                                        ? 'bg-rose-500'
                                        : 'bg-red-600'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {Controls}

      {/* Lista sekcji wg statusu */}
      <div className="pt-4">
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
              onOpenManage={onOpenManage}
              defaultOpen={status === 'JOINED' || status === 'PENDING'}
            />
          );
        })}
      </div>

      {/* Invite modal */}
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
