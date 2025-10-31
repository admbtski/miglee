'use client';

import * as React from 'react';
import { ChevronDown, Filter, Info } from 'lucide-react';
import { MembersSection } from '../member-section';
import {
  groupMembers,
  IntentMember,
  STATUS_BADGE_CLASSES,
  STATUS_GROUP_ORDER,
} from '../types';

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

export interface MembersContentProps {
  members: IntentMember[];
  canManage: boolean;
  callbacks: any;
  onOpenManage: (m: IntentMember | null) => void;
  stats: Record<string, number>;
}

/**
 * Wydzielony komponent listy członków z filtrem i statystykami.
 * Zmiany w tej wersji:
 * - usunięto modal statystyk
 * - usunięto osobny przycisk otwierający dropdown
 * - przycisk z ikoną "Info" otwiera dropdown ze statusem
 */
export function MembersContent({
  members,
  canManage,
  callbacks,
  onOpenManage,
  stats,
}: MembersContentProps) {
  const [query, setQuery] = React.useState('');
  const [statsOpen, setStatsOpen] = React.useState(false);

  // filtrowanie tylko po nazwie
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      const byName = !q || m.user.name.toLowerCase().includes(q);
      return byName;
    });
  }, [members, query]);

  const grouped = React.useMemo(() => groupMembers(filtered), [filtered]);

  // zamykanie dropdownu po kliknięciu poza
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

  // Pasek sterujący: input po lewej, po prawej tylko Info (otwiera dropdown)
  const Controls = (
    <div className="mb-4 flex items-center justify-between gap-3">
      {/* Left: filter input */}
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Filter className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            className="w-full rounded-md border border-zinc-300 py-1.5 pl-8 pr-2 text-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:border-zinc-500"
            placeholder="Szukaj po nazwie…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right: tylko Info — otwiera dropdown ze statusem */}
      <div
        className="relative flex shrink-0 items-center gap-2"
        ref={dropdownRef}
      >
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={statsOpen}
          aria-label="Szybkie statystyki statusów"
          onClick={() => setStatsOpen((s) => !s)}
          className={cx(
            'inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition',
            'border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800'
          )}
        >
          <Info className="h-4 w-4" />
          <ChevronDown
            className={cx(
              'h-4 w-4 transition-transform',
              statsOpen && 'rotate-180'
            )}
            aria-hidden
          />
        </button>

        {/* Dropdown panel (po prawej od inputa) */}
        {statsOpen && (
          <div
            className="absolute right-0 top-[120%] z-20 w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            role="menu"
          >
            <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Szybkie statystyki
            </div>
            <div className="grid grid-cols-2 gap-1">
              {STATUS_GROUP_ORDER.map((s) => (
                <div
                  key={s}
                  className={cx(
                    'flex items-center justify-between rounded-lg px-2 py-1 text-xs',
                    'hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
                    STATUS_BADGE_CLASSES[s]
                  )}
                  role="menuitem"
                >
                  <span>{s}</span>
                  <b>{stats[s] ?? 0}</b>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {Controls}

      {/* Lista sekcji wg statusu */}
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
              onOpenManage={onOpenManage}
              defaultOpen={status === 'JOINED' || status === 'PENDING'}
            />
          );
        })}
      </div>
    </>
  );
}
