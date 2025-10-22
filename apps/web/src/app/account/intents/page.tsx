'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AccountIntentCard } from './_components/account-intent-card';

import {
  IntentsResultCoreFragment_IntentsResult_items_Intent,
  IntentStatus,
  MeetingKind,
  Visibility,
  type GetIntentsQueryVariables,
} from '@/libs/graphql/__generated__/react-query-update';

import { useIntentsInfiniteQuery } from '@/hooks/graphql/intents';
import clsx from 'clsx';
import { KindFilter } from './_components/kind-filter';
import { StatusFilter } from './_components/status-filter';
import { EventDetailsModal } from '@/components/event/event-details-modal';
import { appLanguage } from '@/const/language';
import { computeJoinState } from './_components/status-badge';

/** ─────────────── Page ─────────────── */
type ViewMode = 'owned' | 'member';
const DEFAULT_LIMIT = 12;

export default function IntentsPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<ViewMode>('owned');
  const [preview, setPreview] =
    useState<IntentsResultCoreFragment_IntentsResult_items_Intent>();

  // FILTRY
  const [status, setStatus] = useState<IntentStatus>(IntentStatus.Any);
  const [kinds, setKinds] = useState<MeetingKind[]>([]);

  // tymczasowy fallback dla dev
  const ownerId = searchParams.get('ownerId') ?? 'u_admin_00000000000000000001';

  // Query vars (bez offsetu; infinite hook sam zarządza stronicowaniem)
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
    }),
    [ownerId, status, kinds]
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
    }),
    [status, kinds]
  );

  // Dwie niezależne „paginowalne” kwerendy – aktywna wg zakładki
  const owned = useIntentsInfiniteQuery(ownedVars, {
    enabled: !!ownerId && mode === 'owned',
  });
  const member = useIntentsInfiniteQuery(memberVars, {
    enabled: mode === 'member',
  });

  const active = mode === 'owned' ? owned : member;

  const pages = active.data?.pages ?? [];
  const flatItems = pages.flatMap((p) => p.intents.items) ?? [];
  const total = pages[0]?.intents.pageInfo.total ?? 0;
  const loadedCount = flatItems.length;

  const anyFilterActive = status !== IntentStatus.Any || kinds.length > 0;

  return (
    <>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Intents</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage automations and saved flows.
        </p>

        {/* Segmented control */}
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

        {/* FILTRY */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusFilter value={status} onChange={setStatus} />
          <KindFilter values={kinds} onChange={setKinds} />
          {anyFilterActive && (
            <button
              className="rounded-full px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={() => {
                setStatus(IntentStatus.Any);
                setKinds([]);
              }}
              title="Wyczyść filtry"
            >
              Wyczyść filtry
            </button>
          )}
        </div>

        {!ownerId && mode === 'owned' && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
            Brak <code>ownerId</code>. Dodaj parametr w URL (np.{' '}
            <code>?ownerId=&lt;UUID&gt;</code>) lub zepnij z mechanizmem sesji.
          </div>
        )}

        <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {active.isLoading ? (
            'Ładowanie…'
          ) : active.error ? (
            'Błąd ładowania'
          ) : (
            <>
              <span className="opacity-70">
                {mode === 'owned' ? 'Twoje intenty' : 'Intenty (Członek)'}:{' '}
                <b>{loadedCount}</b>
                {typeof total === 'number' && total >= loadedCount && (
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

      {/* Skeletony */}
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

      {/* Błąd */}
      {active.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {active.error?.message ?? 'Unknown error'}
        </div>
      )}

      {/* Pusta lista */}
      {!active.isLoading && !active.error && loadedCount === 0 && (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {mode === 'owned'
            ? 'Nie masz jeszcze żadnych intentów.'
            : 'Brak wyników (tymczasowy widok członka).'}
        </div>
      )}

      {/* Lista */}
      {!active.isLoading && !active.error && loadedCount > 0 && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {flatItems.map((it) => (
              <AccountIntentCard
                key={it.id}
                id={it.id}
                owned={mode === 'owned'}
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
                  setPreview(flatItems.find((item) => item.id === id));
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
                onManage={(id) => {
                  console.log(mode, 'delete', id);
                }}
                onLeave={(id) => {
                  console.log(mode, 'delete', id);
                }}
              />
            ))}
          </div>

          {/* Load more */}
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
                Wszystko załadowane ({loadedCount})
              </span>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      <EventDetailsModal
        open={!!preview}
        onClose={() => setPreview(undefined)}
        onJoin={() => {}}
        data={{
          startISO: preview?.startAt!,
          endISO: preview?.endAt!,
          description: preview?.description!,
          address: preview?.description!,
          onlineUrl: preview?.description!,
          categories: preview?.categories.map((c) => c.names[appLanguage])!,
          tags: preview?.tags.map((c) => c.label)!,
          min: preview?.min!,
          max: preview?.max!,
          joinedCount: preview?.joinedCount!,
          organizerName: preview?.owner?.name!,
          avatarUrl: preview?.owner?.imageUrl!,
          verifiedAt: preview?.owner?.verifiedAt!,
          status: computeJoinState(
            new Date(),
            new Date(preview?.startAt!),
            new Date(preview?.endAt!),
            preview?.joinedCount!,
            preview?.max!,
            // @ts-expect-error – jeśli nie masz w typach, zostanie 0
            preview?.lockHoursBeforeStart ?? 0
          ).status,
          canJoin: computeJoinState(
            new Date(),
            new Date(preview?.startAt!),
            new Date(preview?.endAt!),
            preview?.joinedCount!,
            preview?.max!,
            // @ts-expect-error – jeśli nie masz w typach, zostanie 0
            preview?.lockHoursBeforeStart ?? 0
          ).canJoin,
          members: preview?.members ?? [],
        }}
      />
    </>
  );
}
