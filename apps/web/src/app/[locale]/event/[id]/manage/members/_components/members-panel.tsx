'use client';

import clsx from 'clsx';
import { BarChart2, ChevronDown, Filter, UserPlus, X } from 'lucide-react';
import * as React from 'react';
import { groupMembers, EventMember, STATUS_GROUP_ORDER } from './types';
import { MembersSection } from './member-section';
import { InviteUsersModal } from './invite-users-modal';

export interface MembersPanelProps {
  /** lista członków renderowana w sekcjach */
  members: EventMember[];
  /** uprawnienia – przekazywane dalej do sekcji/wierszy */
  canManage: boolean;
  /** callbacki do akcji na członkach – proxy do MemberRow/MemberManageModal */
  callbacks: any;
  /** otwiera modal szczegółów dla wskazanego członka */
  onOpenManage: (m: EventMember | null) => void;
  /** statystyki per status (gdy brak – liczone z members) */
  stats: Record<string, number>;

  /** NOWE: ID wydarzenia potrzebne do zaproszeń */
  eventId: string;
  /** NOWE: callback po zaproszeniu (zwraca udane userIds) */
  onInvited?: (invitedUserIds: string[]) => void;
}

export function MembersPanel({
  members,
  canManage,
  callbacks,
  onOpenManage,
  stats,
  eventId,
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
    <div className="mb-6 flex flex-row flex-nowrap items-start justify-between gap-3">
      {/* Left: search */}
      <div className="min-w-0 w-full">
        <label className="sr-only" htmlFor="members-search">
          Szukaj po nazwie
        </label>
        <div className="relative w-full">
          <Filter className="absolute w-4 h-4 text-zinc-400 dark:text-white/35 pointer-events-none left-3 top-1/2 -translate-y-1/2" />
          <input
            id="members-search"
            className="w-full py-2.5 pl-10 pr-9 text-sm transition bg-white border outline-none rounded-xl border-zinc-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700 dark:focus:border-indigo-500/70"
            placeholder="Szukaj członków…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute p-1 text-zinc-400 rounded-full right-2 top-1/2 -translate-y-1/2 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              aria-label="Wyczyść filtr"
              title="Wyczyść"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="pointer-events-none absolute -bottom-5 left-0 text-[11px] text-zinc-400 dark:text-zinc-500">
            Znaleziono:{' '}
            <span className="font-semibold text-zinc-600 dark:text-zinc-400">
              {filtered.length}
            </span>
          </div>
        </div>
      </div>

      {/* Right: buttons (Invite + Stats) */}
      <div className="flex shrink-0 items-stretch gap-2">
        <div className="relative flex flex-nowrap gap-2" ref={dropdownRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={statsOpen}
            aria-label="Szybkie statystyki statusów"
            onClick={() => setStatsOpen((s) => !s)}
            className={clsx(
              'inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium transition border rounded-xl shadow-sm',
              'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800',
              'focus:outline-none focus:ring-2 focus:ring-indigo-300/50'
            )}
          >
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:block">Stats</span>
            <ChevronDown
              className={clsx(
                'w-3.5 h-3.5 transition-transform',
                statsOpen && 'rotate-180'
              )}
              aria-hidden
            />
          </button>
          <button
            type="button"
            onClick={() => setOpenInvite(true)}
            className={clsx(
              'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition border rounded-xl shadow-sm',
              'border-indigo-500 bg-indigo-600 hover:bg-indigo-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300',
              'dark:border-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500'
            )}
            aria-haspopup="dialog"
            aria-expanded={openInvite}
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:block">Invite</span>
          </button>

          {statsOpen && (
            <div
              className="absolute right-0 top-[110%] z-20 w-72 p-3 bg-white border shadow-xl rounded-2xl border-zinc-200 ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900"
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
                      className="p-2 transition rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                      role="menuitem"
                      aria-label={`${s}: ${count} (${pct}%)`}
                    >
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={clsx(
                              'w-1.5 h-1.5 shrink-0 rounded-full',
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
                      <div className="overflow-hidden rounded-full h-1.5 bg-zinc-100 dark:bg-zinc-800">
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

      {/* Top Separator */}
      <div className="border-b border-zinc-200 dark:border-white/5 mb-6" />

      {/* Lista sekcji wg statusu */}
      <div>
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
        eventId={eventId}
        suggestions={inviteSuggestions}
        onInvited={(ids) => {
          onInvited?.(ids);
          setOpenInvite(false);
        }}
      />
    </>
  );
}
