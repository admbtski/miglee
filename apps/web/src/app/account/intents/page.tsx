'use client';

import clsx from 'clsx';
import { SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AccountIntentCard } from './_components/account-intent-card';
import { KindFilter } from './_components/kind-filter';
import { SortFilter } from './_components/sort-filter';
import { StatusFilter } from './_components/status-filter';

import { CreateEditIntentModalConnect } from '@/features/intents/components/create-edit-intent-modal-connect';
import { EventDetailsModal } from '@/features/intents/components/event-details-modal';

import { appLanguage } from '@/lib/config/language';
import { computeJoinState } from '@/components/ui/status-badge';

import { Modal } from '@/components/feedback/modal';
import { useIntentsInfiniteQuery } from '@/lib/api/intents';
import {
  AddressVisibility,
  MembersVisibility,
  IntentsResultCoreFragment_IntentsResult_items_Intent as IntentItem,
  IntentsSortBy,
  IntentStatus,
  MeetingKind,
  SortDir,
  Visibility,
  type GetIntentsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { CancelIntentModals } from './_components/cancel-intent-modals';
import { DeleteIntentModals } from './_components/delete-intent-modals';
import { LeaveIntentModals } from './_components/leave-intent-modals';
import { EventManagementModalConnect } from './_components/managemen/event-management-modal-connect';
import { Plan } from '@/components/ui/plan-theme';

function planForIndex(i: number): Plan {
  if (i % 7 === 0) return 'premium';
  if (i % 5 === 0) return 'plus';
  if (i % 3 === 0) return 'basic';
  return 'default';
}

/** ──────────────────────────────────────────────────────────────────────────
 *  Constants / types
 *  ───────────────────────────────────────────────────────────────────────── */
type ViewMode = 'owned' | 'member';
const DEFAULT_LIMIT = 12;

/** ──────────────────────────────────────────────────────────────────────────
 *  Page
 *  ───────────────────────────────────────────────────────────────────────── */
export default function IntentsPage() {
  const searchParams = useSearchParams();

  /** View mode state (tab) */
  const [mode, setMode] = useState<ViewMode>('owned');

  /** Selection / dialogs state */
  const [preview, setPreview] = useState<IntentItem | undefined>();
  const [editId, setEditId] = useState<string | null>(null);
  const [leaveId, setLeaveId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [manageId, setManageId] = useState<string | null>(null);

  /** Active filters state (applied to queries) */
  const [status, setStatus] = useState<IntentStatus>(IntentStatus.Any);
  const [kinds, setKinds] = useState<MeetingKind[]>([]);
  const [sortBy, setSortBy] = useState<IntentsSortBy>(IntentsSortBy.StartAt);
  const [sortDir, setSortDir] = useState<SortDir>(SortDir.Asc);

  /** Mobile filters modal state */
  const [filtersOpen, setFiltersOpen] = useState(false);

  /** Draft filters used inside the modal; only committed on "Apply" */
  const [draftStatus, setDraftStatus] = useState<IntentStatus>(
    IntentStatus.Any
  );
  const [draftKinds, setDraftKinds] = useState<MeetingKind[]>([]);
  const [draftSort, setDraftSort] = useState<{
    by: IntentsSortBy;
    dir: SortDir;
  }>({ by: IntentsSortBy.StartAt, dir: SortDir.Asc });

  /** When opening the modal, copy current values into drafts */
  useEffect(() => {
    if (!filtersOpen) return;
    setDraftStatus(status);
    setDraftKinds(kinds);
    setDraftSort({ by: sortBy, dir: sortDir });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersOpen]);

  /** Temporary fallback for dev (ownerId taken from URL or default) */
  const ownerId = searchParams.get('ownerId') ?? 'u_admin_00000000000000000001';

  /** Build variables for the "owned" list (infinite query manages the offset) */
  const ownedVars = useMemo<Omit<GetIntentsQueryVariables, 'offset'>>(
    () => ({
      limit: DEFAULT_LIMIT,
      ownerId,
      status,
      visibility: undefined as unknown as Visibility | undefined,
      upcomingAfter: undefined,
      endingBefore: undefined,
      categorySlugs: [],
      tagSlugs: [],
      kinds,
      levels: [],
      keywords: [],
      verifiedOnly: false,
      memberId: undefined,
      distanceKm: null,
      near: undefined,
      sortBy,
      sortDir,
    }),
    [ownerId, status, kinds, sortBy, sortDir]
  );

  /** Build variables for the "member" list */
  const memberVars = useMemo<Omit<GetIntentsQueryVariables, 'offset'>>(
    () => ({
      limit: DEFAULT_LIMIT,
      status,
      visibility: Visibility.Public,
      upcomingAfter: undefined,
      endingBefore: undefined,
      categorySlugs: [],
      tagSlugs: [],
      kinds,
      levels: [],
      keywords: [],
      verifiedOnly: false,
      ownerId: undefined,
      memberId: undefined,
      distanceKm: null,
      near: undefined,
      sortBy,
      sortDir,
    }),
    [status, kinds, sortBy, sortDir]
  );

  /** Two independent infinite queries (only one is enabled at a time) */
  const owned = useIntentsInfiniteQuery(ownedVars, {
    enabled: Boolean(ownerId) && mode === 'owned',
  });
  const member = useIntentsInfiniteQuery(memberVars, {
    enabled: mode === 'member',
  });

  /** Currently active query (based on the tab) */
  const active = mode === 'owned' ? owned : member;

  /** Flat items and meta */
  const pages = active.data?.pages ?? [];
  const flatItems = useMemo(
    () => pages.flatMap((p) => p.intents.items) ?? [],
    [pages]
  );
  const total = pages[0]?.intents.pageInfo.total ?? 0;

  /** Derived flags and counters for filters */
  const anyFilterActive =
    status !== IntentStatus.Any ||
    kinds.length > 0 ||
    sortBy !== IntentsSortBy.StartAt ||
    sortDir !== SortDir.Asc;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (status !== IntentStatus.Any) count += 1;
    if (kinds.length > 0) count += 1;
    if (sortBy !== IntentsSortBy.StartAt || sortDir !== SortDir.Asc) count += 1;
    return count;
  }, [status, kinds.length, sortBy, sortDir]);

  /** Clear all active filters */
  const clearFilters = useCallback(() => {
    setStatus(IntentStatus.Any);
    setKinds([]);
    setSortBy(IntentsSortBy.StartAt);
    setSortDir(SortDir.Asc);
  }, []);

  /** Apply drafts from the modal → active filters */
  const applyDraft = useCallback(() => {
    setStatus(draftStatus);
    setKinds(draftKinds);
    setSortBy(draftSort.by);
    setSortDir(draftSort.dir);
    setFiltersOpen(false);
  }, [draftKinds, draftSort, draftStatus]);

  /** Helper: open preview by id */
  const handlePreview = useCallback(
    (id: string) => {
      const found = flatItems.find((item) => item.id === id);
      if (found) setPreview(found);
    },
    [flatItems]
  );

  /** Extracted lock-hours fallback (field might not be in the fragment) */
  const lockHoursFallback = (item?: unknown) =>
    (item as Record<string, unknown> | undefined)?.['lockHoursBeforeStart'] ??
    0;

  return (
    <>
      <header className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Intents</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Manage automations and saved flows.
            </p>

            {/* Segmented control (view mode) */}
            <div className="mt-4 inline-flex rounded-lg border border-zinc-200 p-1 text-sm dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setMode('owned')}
                className={clsx(
                  'rounded-md px-3 py-1.5',
                  mode === 'owned'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                )}
                aria-pressed={mode === 'owned'}
              >
                Moje
              </button>
              <button
                type="button"
                onClick={() => setMode('member')}
                className={clsx(
                  'rounded-md px-3 py-1.5',
                  mode === 'member'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                )}
                aria-pressed={mode === 'member'}
              >
                Członek
              </button>
            </div>

            {/* Desktop filters (pills) */}
            <div className="mt-3 hidden flex-wrap items-center gap-2 md:flex">
              <StatusFilter value={status} onChange={setStatus} />
              <KindFilter values={kinds} onChange={setKinds} />
              <SortFilter
                value={{ by: sortBy, dir: sortDir }}
                onChange={(next) => {
                  setSortBy(next.by);
                  setSortDir(next.dir);
                }}
              />
              {anyFilterActive && (
                <button
                  className="rounded-full px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  onClick={clearFilters}
                  title="Wyczyść filtry"
                >
                  Wyczyść filtry
                </button>
              )}
            </div>
          </div>

          {/* Mobile: Filters button */}
          <div className="mt-1 md:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-sm text-white shadow-sm dark:border-zinc-700"
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
              aria-controls="filters-modal"
              title="Filtry"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtry
              {activeFiltersCount > 0 && (
                <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-zinc-800 px-2 text-sm">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Counter / loading / refresh indicator */}
        <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {active.isLoading ? (
            'Ładowanie…'
          ) : active.error ? (
            'Błąd ładowania'
          ) : (
            <>
              <span className="opacity-70">
                {mode === 'owned' ? 'Twoje intenty' : 'Intenty (Członek)'}:{' '}
                <b>{flatItems.length}</b>
                {typeof total === 'number' && total >= flatItems.length && (
                  <>
                    {' '}
                    / <b>{total}</b>
                  </>
                )}
              </span>
              {active.isFetching && (
                <span className="ml-2 opacity-60">(odświeżanie…)</span>
              )}
            </>
          )}
        </div>
      </header>

      {/* List / skeleton / error states */}
      {active.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900"
            />
          ))}
        </div>
      )}

      {active.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {active.error?.message ?? 'Unknown error'}
        </div>
      )}

      {!active.isLoading && !active.error && flatItems.length === 0 && (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {mode === 'owned'
            ? 'Nie masz jeszcze żadnych intentów.'
            : 'Brak wyników (tymczasowy widok członka).'}
        </div>
      )}

      {!active.isLoading && !active.error && flatItems.length > 0 && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {flatItems.map((it, index) => (
              <AccountIntentCard
                key={it.id}
                id={it.id}
                owned={mode === 'owned'}
                title={it.title}
                description={it.description}
                startAt={it.startAt}
                endAt={it.endAt}
                address={it.address}
                onlineUrl={it.onlineUrl}
                joinedCount={it.joinedCount}
                min={it.min}
                max={it.max}
                isCanceled={it.isCanceled}
                isDeleted={it.isDeleted}
                addressVisibility={it.addressVisibility}
                isFull={it.isFull}
                hasStarted={it.hasStarted}
                withinLock={it.withinLock}
                categories={it.categories?.map((c) => c.slug)}
                tags={it.tags?.map((t) => t.label)}
                levels={it.levels ?? []}
                isOngoing={it.isOngoing}
                isOnline={it.isOnline}
                isOnsite={it.isOnsite}
                isHybrid={it.isHybrid}
                plan={planForIndex(index)}
                lockHoursBeforeStart={Number(lockHoursFallback(it))}
                onPreview={handlePreview}
                onEdit={setEditId}
                onDelete={setDeleteId}
                onLeave={setLeaveId}
                onCancel={setCancelId}
                onManage={setManageId}
              />
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            {active.hasNextPage ? (
              <button
                type="button"
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                onClick={() => active.fetchNextPage()}
                disabled={active.isFetchingNextPage}
              >
                {active.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            ) : (
              <span className="text-xs opacity-60">
                Wszystko załadowane ({flatItems.length})
              </span>
            )}
          </div>
        </>
      )}

      <DeleteIntentModals
        deleteId={deleteId}
        onClose={() => setDeleteId(null)}
        onSuccess={() => {
          // Optional: invalidate/refetch after deletion
          // active.refetch?.();
        }}
      />

      {/* Leave flow (confirm + success/error) */}
      <LeaveIntentModals
        leaveId={leaveId}
        onClose={() => setLeaveId(null)}
        // Inject your actual leave mutation here:
        leaveAction={async () => {
          // TODO wire real mutation
          return Promise.resolve();
        }}
        onSuccess={() => {
          // Optional refetch
        }}
      />

      <CancelIntentModals
        cancelId={cancelId}
        onClose={() => setCancelId(null)}
        onSuccess={() => {}}
      />

      {/* Preview */}
      <EventDetailsModal
        open={!!preview}
        onClose={() => setPreview(undefined)}
        onJoin={() => {
          // Możesz tu zawołać join mutation lub przejść do detalu
          // Na razie zamykamy modal po kliknięciu "Dołącz"
          setPreview(undefined);
        }}
        detailsHref={
          preview?.id ? `/intents/${encodeURIComponent(preview.id)}` : undefined
        }
        data={{
          eventId: preview?.id,
          title: preview?.title ?? '—',
          startISO: preview?.startAt!,
          endISO: preview?.endAt ?? preview?.startAt!,
          organizerName: preview?.owner?.name ?? '—',
          avatarUrl: preview?.owner?.imageUrl ?? '/avatar.svg',
          description: preview?.description ?? '',
          address: preview?.address ?? undefined,
          onlineUrl: preview?.onlineUrl ?? undefined,
          categories:
            preview?.categories?.map((c) => c.names?.[appLanguage] ?? c.slug) ??
            [],
          tags: preview?.tags?.map((t) => t.label) ?? [],
          levels: preview?.levels ?? [],
          min: preview?.min ?? 2,
          max: preview?.max ?? Math.max(2, preview?.min ?? 2),
          joinedCount: preview?.joinedCount ?? 0,
          verifiedAt: preview?.owner?.verifiedAt ?? undefined,
          status: computeJoinState({
            hasStarted: preview?.hasStarted ?? false,
            isFull: preview?.isFull ?? false,
            isOngoing: preview?.isOngoing ?? false,
            isDeleted: preview?.isDeleted ?? false,
            isCanceled: preview?.isCanceled ?? false,
            withinLock: preview?.withinLock ?? false,
            startAt: new Date(preview?.startAt ?? Date.now()),
          }).status,
          canJoin: preview?.canJoin ?? false,
          membersVisibility:
            (preview?.membersVisibility as MembersVisibility) ??
            MembersVisibility.Public,
          members: preview?.members ?? [],
          addressVisibility:
            (preview?.addressVisibility as AddressVisibility) ??
            AddressVisibility.Public,
          plan: 'default',
          showSponsoredBadge: true,
          lockHoursBeforeStart: Number(lockHoursFallback(preview)),
        }}
      />

      {/* Edit (kept mounted with controlled props) */}
      <CreateEditIntentModalConnect
        intentId={editId ?? undefined}
        open={!!editId}
        onClose={() => setEditId(null)}
      />

      <EventManagementModalConnect
        intentId={manageId ?? ''}
        canManage={true}
        isPremium={true}
        open={!!manageId}
        onClose={() => setManageId(null)}
      />

      {/* ── MODAL: Filters (mobile) ─────────────────────────────────────────── */}
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        variant="centered"
        labelledById="filters-title"
        ariaLabel="Filtry i sortowanie"
        className="px-0 py-0"
        header={
          <h3 className="text-base font-semibold">Filtry i sortowanie</h3>
        }
        content={
          <div className="space-y-6">
            <section>
              <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Status
              </h4>
              <StatusFilter value={draftStatus} onChange={setDraftStatus} />
            </section>

            <section>
              <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Rodzaj
              </h4>
              <KindFilter values={draftKinds} onChange={setDraftKinds} />
            </section>

            <section>
              <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Sortowanie
              </h4>
              <SortFilter value={draftSort} onChange={setDraftSort} />
            </section>
          </div>
        }
        footer={
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setDraftStatus(IntentStatus.Any);
                setDraftKinds([]);
                setDraftSort({ by: IntentsSortBy.StartAt, dir: SortDir.Asc });
              }}
              className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Wyczyść
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={applyDraft}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Zastosuj
              </button>
            </div>
          </div>
        }
      />
    </>
  );
}
