'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { CreateEditIntentModalConnect } from '@/features/intents/components/create-edit-intent-modal-connect';
import { EventDetailsModal } from '@/features/intents/components/event-details-modal';

import { appLanguage } from '@/lib/config/language';
import { computeJoinState } from '@/components/ui/status-badge';

import { Modal } from '@/components/feedback/modal';
import { useIntentsInfiniteQuery } from '@/lib/api/intents';
import { useMeQuery } from '@/lib/api/auth';
import {
  AddressVisibility,
  MembersVisibility,
  IntentsResultCoreFragment_IntentsResult_items_Intent as IntentItem,
  Visibility,
  type GetIntentsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { CancelIntentModals } from './_components/cancel-intent-modals';
import { DeleteIntentModals } from './_components/delete-intent-modals';
import { LeaveIntentModals } from './_components/leave-intent-modals';
import { EventManagementModalConnect } from './_components/managemen/event-management-modal-connect';

// New components
import { IntentsHeader } from './_components/intents-header';
import { IntentsGrid } from './_components/intents-grid';
import { IntentsLoadMore } from './_components/intents-load-more';
import { StatusFilter } from './_components/status-filter';
import { KindFilter } from './_components/kind-filter';
import { SortFilter } from './_components/sort-filter';

// New hooks
import { useIntentsFilters } from './_hooks/use-intents-filters';
import { useIntentsModals } from './_hooks/use-intents-modals';
import { useIntentsDraftFilters } from './_hooks/use-intents-draft-filters';

/* ───────────────────────────── Constants ───────────────────────────── */

type ViewMode = 'owned' | 'member';
const DEFAULT_LIMIT = 12;

/* ───────────────────────────── Page ───────────────────────────── */

export default function IntentsPage() {
  const searchParams = useSearchParams();

  // Get current user
  const { data: authData, isLoading: isLoadingAuth } = useMeQuery();
  const currentUserId = authData?.me?.id;

  // View mode (tab)
  const [mode, setMode] = useState<ViewMode>('owned');

  // Filters
  const {
    status,
    kinds,
    sortBy,
    sortDir,
    setStatus,
    setKinds,
    setSortBy,
    setSortDir,
    anyFilterActive,
    activeFiltersCount,
    clearFilters,
  } = useIntentsFilters();

  // Modals
  const {
    preview,
    editId,
    leaveId,
    cancelId,
    deleteId,
    manageId,
    setEditId,
    setLeaveId,
    setCancelId,
    setDeleteId,
    setManageId,
    openPreview,
    closePreview,
    closeEdit,
    closeLeave,
    closeCancel,
    closeDelete,
    closeManage,
  } = useIntentsModals();

  // Mobile filters modal
  const [filtersOpen, setFiltersOpen] = useState(false);
  const {
    draftStatus,
    draftKinds,
    draftSort,
    setDraftStatus,
    setDraftKinds,
    setDraftSort,
    clearDrafts,
  } = useIntentsDraftFilters(status, kinds, sortBy, sortDir, filtersOpen);

  // Use current user ID or fallback to search params
  const ownerId = currentUserId ?? searchParams.get('ownerId') ?? undefined;

  // Build variables for queries
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

  // Two independent infinite queries
  const owned = useIntentsInfiniteQuery(ownedVars, {
    enabled: Boolean(ownerId) && mode === 'owned',
  });
  const member = useIntentsInfiniteQuery(memberVars, {
    enabled: mode === 'member',
  });

  // Currently active query
  const active = mode === 'owned' ? owned : member;

  // Flat items and meta
  const pages = active.data?.pages ?? [];
  const flatItems = useMemo(
    () => pages.flatMap((p) => p.intents.items) ?? [],
    [pages]
  );
  const total = pages[0]?.intents.pageInfo.total ?? 0;

  // Callbacks
  const handleModeChange = useCallback((newMode: ViewMode) => {
    setMode(newMode);
  }, []);

  const handleSortChange = useCallback(
    (next: { by: any; dir: any }) => {
      setSortBy(next.by);
      setSortDir(next.dir);
    },
    [setSortBy, setSortDir]
  );

  const handleOpenFilters = useCallback(() => setFiltersOpen(true), []);
  const handleCloseFilters = useCallback(() => setFiltersOpen(false), []);

  const handlePreview = useCallback(
    (id: string) => openPreview(id, flatItems),
    [openPreview, flatItems]
  );

  const handleApplyDraft = useCallback(() => {
    setStatus(draftStatus);
    setKinds(draftKinds);
    setSortBy(draftSort.by);
    setSortDir(draftSort.dir);
    setFiltersOpen(false);
  }, [
    draftKinds,
    draftSort,
    draftStatus,
    setKinds,
    setSortBy,
    setSortDir,
    setStatus,
  ]);

  // Loading authentication state
  if (isLoadingAuth) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!currentUserId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Not authenticated
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Please log in to view your intents
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <IntentsHeader
        mode={mode}
        onModeChange={handleModeChange}
        status={status}
        kinds={kinds}
        sortBy={sortBy}
        sortDir={sortDir}
        onStatusChange={setStatus}
        onKindsChange={setKinds}
        onSortChange={handleSortChange}
        anyFilterActive={anyFilterActive}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={clearFilters}
        onOpenFilters={handleOpenFilters}
        isLoading={active.isLoading}
        hasError={!!active.error}
        loadedCount={flatItems.length}
        total={total}
        isFetching={active.isFetching}
      />

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
          <IntentsGrid
            items={flatItems}
            mode={mode}
            onPreview={handlePreview}
            onEdit={setEditId}
            onDelete={setDeleteId}
            onLeave={setLeaveId}
            onCancel={setCancelId}
            onManage={setManageId}
          />

          <div className="mt-6 flex justify-center">
            <IntentsLoadMore
              hasNextPage={!!active.hasNextPage}
              isFetchingNextPage={active.isFetchingNextPage}
              loadedCount={flatItems.length}
              onLoadMore={active.fetchNextPage}
            />
          </div>
        </>
      )}

      {/* Modals */}
      <DeleteIntentModals
        deleteId={deleteId}
        onClose={closeDelete}
        onSuccess={() => {}}
      />

      <LeaveIntentModals
        leaveId={leaveId}
        onClose={closeLeave}
        leaveAction={async () => Promise.resolve()}
        onSuccess={() => {}}
      />

      <CancelIntentModals
        cancelId={cancelId}
        onClose={closeCancel}
        onSuccess={() => {}}
      />

      {/* Preview */}
      <EventDetailsModal
        open={!!preview}
        onClose={closePreview}
        onJoin={closePreview}
        detailsHref={
          preview?.id ? `/intent/${encodeURIComponent(preview.id)}` : undefined
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
          members: (preview?.members ?? []) as any,
          addressVisibility:
            (preview?.addressVisibility as AddressVisibility) ??
            AddressVisibility.Public,
          plan: 'default',
          showSponsoredBadge: true,
        }}
      />

      {/* Edit */}
      <CreateEditIntentModalConnect
        intentId={editId ?? undefined}
        open={!!editId}
        onClose={closeEdit}
      />

      <EventManagementModalConnect
        intentId={manageId ?? ''}
        canManage={true}
        isPremium={true}
        open={!!manageId}
        onClose={closeManage}
      />

      {/* Mobile Filters Modal */}
      <Modal
        open={filtersOpen}
        onClose={handleCloseFilters}
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
              onClick={clearDrafts}
              className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Wyczyść
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCloseFilters}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleApplyDraft}
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
