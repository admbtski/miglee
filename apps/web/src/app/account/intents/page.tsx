// app/account/intents/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Users,
  WifiIcon,
  MapPinHouseIcon,
  Lock,
  MoreVertical,
  Eye,
  Pencil,
  Ban,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, KeyboardEvent } from 'react';

import { useIntentsQuery } from '@/hooks/graphql/intents';
import {
  IntentStatus,
  Visibility,
  type GetIntentsQueryVariables,
} from '@/libs/graphql/__generated__/react-query-update';
import { CategoryPills, TagPills } from '@/components/pill/category-tag-pill';

/** ─────────────────── Utils ─────────────────── */
const MONTHS_PL_SHORT = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
] as const;
const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));
const isValidDate = (d: Date) =>
  d instanceof Date && !Number.isNaN(d.getTime());
const parseISO = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isValidDate(d) ? d : null;
};
const formatDateRange = (startISO?: string | null, endISO?: string | null) => {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (!start || !end) return '—';
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  const fmt = (d: Date) =>
    `${pad2(d.getDate())} ${MONTHS_PL_SHORT[d.getMonth()]} • ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return sameDay
    ? `${fmt(start)} – ${pad2(end.getHours())}:${pad2(end.getMinutes())}`
    : `${fmt(start)} – ${fmt(end)}`;
};
const capacityLabel = (joined: number, min: number, max: number) =>
  `${joined} / ${min}-${max}`;

/** ─────────────── Join state ─────────────── */
const hoursUntil = (date: Date) => (date.getTime() - Date.now()) / 3_600_000;
function computeJoinState(
  now: Date,
  start: Date,
  end: Date,
  joinedCount: number,
  max: number,
  lockHrs = 0
) {
  const hasStarted = now >= start;
  const isOngoing = now >= start && now <= end;
  const isFull = max > 0 && joinedCount >= max;
  const withinLock = !hasStarted && hoursUntil(start) <= lockHrs;
  const canJoin = !isFull && !hasStarted && !withinLock;
  if (isOngoing)
    return {
      canJoin,
      status: {
        label: 'Trwa teraz',
        tone: 'info' as const,
        reason: 'ONGOING' as const,
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };
  if (hasStarted)
    return {
      canJoin,
      status: {
        label: 'Rozpoczęte – dołączenie zablokowane',
        tone: 'error' as const,
        reason: 'STARTED' as const,
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };
  if (isFull)
    return {
      canJoin,
      status: {
        label: 'Brak miejsc',
        tone: 'error' as const,
        reason: 'FULL' as const,
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };
  if (withinLock) {
    const hrs = Math.max(0, Math.ceil(hoursUntil(start)));
    return {
      canJoin,
      status: {
        label: `Start za ${hrs} h – zapisy zamknięte`,
        tone: 'warn' as const,
        reason: 'LOCK' as const,
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };
  }
  return {
    canJoin,
    status: { label: 'Dostępne', tone: 'ok' as const, reason: 'OK' as const },
    isOngoing,
    hasStarted,
    isFull,
    withinLock,
  };
}
const badgeToneClass = (tone: 'ok' | 'warn' | 'error' | 'info') =>
  tone === 'error'
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    : tone === 'warn'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      : tone === 'info'
        ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
function StatusBadge({
  tone,
  reason,
  label,
}: {
  tone: 'ok' | 'warn' | 'error' | 'info';
  reason?: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${badgeToneClass(tone)}`}
      aria-live="polite"
    >
      {(reason === 'LOCK' || reason === 'STARTED') && (
        <Lock className="h-3.5 w-3.5" aria-hidden />
      )}
      {label}
    </span>
  );
}

/** ─────────────── ActionMenu ─────────────── */
function ActionMenu(props: {
  onPreview?: () => void | Promise<void>;
  onEdit?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  disabledCancel?: boolean;
  disabledDelete?: boolean;
  label?: string;
}) {
  const {
    onPreview,
    onEdit,
    onCancel,
    onDelete,
    disabledCancel = false,
    disabledDelete = false,
    label = 'Menu akcji',
  } = props;
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<HTMLButtonElement[]>([]);
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current || !btnRef.current) return;
      if (!panelRef.current.contains(t) && !btnRef.current.contains(t))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent | any) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey as any);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey as any);
    };
  }, [open]);
  const toggle = () => setOpen((v) => !v);
  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabled = itemsRef.current.filter((el) => el && !el.disabled);
    if (!enabled.length) return;
    const idx = enabled.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      enabled[(idx + 1 + enabled.length) % enabled.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      enabled[(idx - 1 + enabled.length) % enabled.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      enabled[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      enabled[enabled.length - 1]?.focus();
    }
  };
  const setItemRef = (el: HTMLButtonElement | null, i: number) => {
    if (el) itemsRef.current[i] = el;
  };
  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 shadow-sm hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <MoreVertical className="w-4 h-4" aria-hidden />
      </button>
      {open && (
        <div
          ref={panelRef}
          role="menu"
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white p-1.5 text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <button
            ref={(el) => setItemRef(el, 0)}
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
            onClick={() => {
              setOpen(false);
              onPreview?.();
            }}
          >
            <Eye className="w-4 h-4" /> Podgląd
          </button>
          <button
            ref={(el) => setItemRef(el, 1)}
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
            onClick={() => {
              setOpen(false);
              onEdit?.();
            }}
          >
            <Pencil className="w-4 h-4" /> Edytuj
          </button>
          <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
          <button
            ref={(el) => setItemRef(el, 2)}
            role="menuitem"
            disabled={disabledCancel}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
            onClick={async () => {
              setOpen(false);
              if (await confirmAsync('Anulować wydarzenie?')) onCancel?.();
            }}
          >
            <Ban className="w-4 h-4" /> Anuluj
          </button>
          <button
            ref={(el) => setItemRef(el, 3)}
            role="menuitem"
            disabled={disabledDelete}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-red-600 hover:bg-red-50 focus:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30 dark:focus:bg-red-950/30"
            onClick={async () => {
              setOpen(false);
              if (
                await confirmAsync(
                  'Usunąć wydarzenie? Tej operacji nie można cofnąć.'
                )
              )
                onDelete?.();
            }}
          >
            <Trash2 className="w-4 h-4" /> Usuń
          </button>
        </div>
      )}
    </div>
  );
}
async function confirmAsync(message: string) {
  return Promise.resolve(window.confirm(message));
}

/** ─────────────── Karta ─────────────── */
function AccountIntentCard(props: {
  id?: string;
  description?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  address?: string | null;
  onlineUrl?: string | null;
  joinedCount: number;
  min: number;
  max: number;
  categories?: string[];
  tags?: string[];
  lockHoursBeforeStart?: number;
  onPreview?: (id: string) => void | Promise<void>;
  onEdit?: (id: string) => void | Promise<void>;
  onCancel?: (id: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
}) {
  const {
    id = '',
    description,
    startAt,
    endAt,
    address,
    onlineUrl,
    joinedCount,
    min,
    max,
    categories,
    tags,
    lockHoursBeforeStart = 0,
    onPreview,
    onEdit,
    onCancel,
    onDelete,
  } = props;

  const when = formatDateRange(startAt, endAt);
  const isOnsite = !!address && !onlineUrl;
  const isOnline = !address && !!onlineUrl;
  const isHybrid = !!address && !!onlineUrl;

  const { status, hasStarted } = useMemo(() => {
    const now = new Date();
    const start = parseISO(startAt) ?? now;
    const end = parseISO(endAt) ?? now;
    return computeJoinState(
      now,
      start,
      end,
      joinedCount,
      max,
      lockHoursBeforeStart
    );
  }, [startAt, endAt, joinedCount, max, lockHoursBeforeStart]);

  return (
    <div className="relative p-4 transition bg-white border shadow-sm rounded-2xl border-zinc-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2 mb-1 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="flex min-w-0 items-center gap-1.5">
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="truncate" title={when}>
            {when}
          </span>
        </div>

        <StatusBadge
          tone={status.tone}
          reason={status.reason}
          label={status.label}
        />
      </div>

      <p
        className="mt-1 text-sm line-clamp-3 text-zinc-900 dark:text-zinc-100"
        title={description ?? ''}
      >
        {description || '—'}
      </p>

      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-600 dark:text-zinc-400">
        {isOnsite && (
          <span
            className="inline-flex items-center min-w-0 gap-1"
            title={address ?? ''}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{address}</span>
          </span>
        )}
        {isOnline && (
          <span className="inline-flex items-center gap-1" title="Online">
            <WifiIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Online</span>
          </span>
        )}
        {isHybrid && (
          <span
            className="inline-flex items-center min-w-0 gap-1"
            title={`${address ?? ''} • Hybrid`}
          >
            <MapPinHouseIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{address}, Hybrid</span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="inline-flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
          <Users className="w-4 h-4" />{' '}
          <span>{capacityLabel(joinedCount, min, max)} osób</span>
        </div>
      </div>

      <div className="flex items-end self-end justify-between gap-3 mt-2">
        <div className="flex gap-3">
          <CategoryPills categories={categories ?? []} />
          <TagPills tags={tags ?? []} />
        </div>
        <ActionMenu
          label="Menu akcji intentu"
          onPreview={() => onPreview?.(id)}
          onEdit={() => onEdit?.(id)}
          onCancel={() => onCancel?.(id)}
          onDelete={() => onDelete?.(id)}
          disabledCancel={hasStarted}
          disabledDelete={false}
        />
      </div>
    </div>
  );
}

/** ─────────────── Page ─────────────── */
type ViewMode = 'owned' | 'member';

export default function IntentsPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<ViewMode>('owned');

  // tymczasowy fallback dla dev
  const ownerId = searchParams.get('ownerId') ?? 'u_admin_00000000000000000001';

  // Query dla "Moje" (owner)
  const ownedVars = useMemo<GetIntentsQueryVariables>(
    () => ({
      limit: 60,
      offset: 0,
      ownerId,
      status: IntentStatus.Any,
      visibility: undefined as unknown as Visibility | undefined,
      upcomingAfter: undefined,
      endingBefore: undefined,
      categorySlugs: [],
      tagSlugs: [],
      kinds: [],
      levels: [],
      keywords: [],
      verifiedOnly: false,
      distanceKm: null,
    }),
    [ownerId]
  );

  // Query dla "Członek" – na razie BEZ ownerId (placeholder pod membership)
  const memberVars = useMemo<GetIntentsQueryVariables>(
    () => ({
      limit: 60,
      offset: 0,
      status: IntentStatus.Any,
      visibility: Visibility.Public, // rozsądny default, żeby nie wyświetlać cudzych HIDDEN
      upcomingAfter: undefined,
      endingBefore: undefined,
      categorySlugs: [],
      tagSlugs: [],
      kinds: [],
      levels: [],
      keywords: [],
      verifiedOnly: false,
      distanceKm: null,
    }),
    []
  );

  const {
    data: ownedData,
    isLoading: ownedLoading,
    isFetching: ownedFetching,
    error: ownedError,
  } = useIntentsQuery(ownedVars, {
    enabled: !!ownerId && mode === 'owned',
    placeholderData: (p) => p,
  });

  const {
    data: memberData,
    isLoading: memberLoading,
    isFetching: memberFetching,
    error: memberError,
  } = useIntentsQuery(memberVars, {
    enabled: mode === 'member',
    placeholderData: (p) => p,
  });

  const activeData = mode === 'owned' ? ownedData : memberData;
  const activeError = mode === 'owned' ? ownedError : memberError;
  const activeLoading = mode === 'owned' ? ownedLoading : memberLoading;
  const activeFetching = mode === 'owned' ? ownedFetching : memberFetching;

  return (
    <>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Intents</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage automations and saved flows.
        </p>

        {/* Segmented control */}
        <div className="inline-flex p-1 mt-4 text-sm border rounded-lg border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setMode('owned')}
            className={`rounded-md px-3 py-1.5 ${mode === 'owned' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}
            aria-pressed={mode === 'owned'}
          >
            Moje
          </button>
          <button
            type="button"
            onClick={() => setMode('member')}
            className={`rounded-md px-3 py-1.5 ${mode === 'member' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}
            aria-pressed={mode === 'member'}
          >
            Członek
          </button>
        </div>

        {!ownerId && mode === 'owned' && (
          <div className="px-3 py-2 mt-3 text-sm border rounded-lg border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
            Brak <code>ownerId</code>. Dodaj parametr w URL (np.{' '}
            <code>?ownerId=&lt;UUID&gt;</code>) lub zepnij z mechanizmem sesji.
          </div>
        )}
      </header>

      {/* Stany dla aktywnego widoku */}
      {activeLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900"
            />
          ))}
        </div>
      )}

      {activeError && (
        <div className="px-3 py-2 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {(activeError as any)?.message ?? 'Unknown error'}
        </div>
      )}

      {!activeLoading &&
        !activeError &&
        (activeData?.intents?.length ?? 0) === 0 && (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {mode === 'owned'
              ? 'Nie masz jeszcze żadnych intentów.'
              : 'Brak wyników (tymczasowy widok członka).'}
          </div>
        )}

      {!activeLoading &&
        !activeError &&
        (activeData?.intents?.length ?? 0) > 0 && (
          <>
            <div className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="opacity-70">
                {mode === 'owned' ? 'Twoje intenty' : 'Intenty (Członek)'}:{' '}
                <b>{activeData?.intents.length}</b>
                {activeFetching && (
                  <span className="ml-2 opacity-60">(odświeżanie…)</span>
                )}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {activeData!.intents.map((it) => (
                <AccountIntentCard
                  key={it.id}
                  id={it.id}
                  description={it.description}
                  startAt={it.startAt}
                  endAt={it.endAt}
                  address={it.address}
                  onlineUrl={it.onlineUrl}
                  joinedCount={it.joinedCount}
                  min={it.min}
                  max={it.max}
                  categories={it.categories?.map((c) => c.slug)}
                  tags={it.tags?.map((t) => t.label)}
                  lockHoursBeforeStart={
                    // @ts-expect-error – jeśli nie masz w typach, zostanie 0
                    it.lockHoursBeforeStart ?? 0
                  }
                  onPreview={(id) => {
                    console.log(mode, 'preview', id);
                  }}
                  onEdit={(id) => {
                    console.log(mode, 'edit', id);
                  }}
                  onCancel={(id) => {
                    console.log(mode, 'cancel', id);
                  }}
                  onDelete={(id) => {
                    console.log(mode, 'delete', id);
                  }}
                />
              ))}
            </div>
          </>
        )}
    </>
  );
}
