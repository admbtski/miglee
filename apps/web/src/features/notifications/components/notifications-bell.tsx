'use client';

import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  offset,
  shift,
  size,
  useFloating,
  type Placement,
} from '@floating-ui/react';
import { Bell, Plus, RefreshCcw, Settings2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLocalePath } from '@/hooks/use-locale-path';
import { NotificationItem } from './notification-item';

import {
  // Subskrypcje / badge
  appendNotificationToCache, // zostawiamy: może aktualizować cache (jeśli Twoje hooki to wspierają)
  useNotificationAdded,
  useNotificationBadge,
  // Mutacje
  useAddNotificationMutation,
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  // NEW: infinite query
  useNotificationsInfiniteQuery,
} from '@/features/notifications/api/notifications';

import type {
  GetNotificationsQuery,
  GetNotificationsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';

type NotificationBellProps = {
  recipientId: string;
  limit?: number;
  resetBadgeOnOpen?: boolean;
  className?: string;
  placement?: Placement;
  strategy?: 'absolute' | 'fixed';
};

type NotificationNode = NonNullable<
  GetNotificationsQuery['notifications']['items']
>[number];

/* ===== Localized labels ===== */
type Labels = {
  notifications: string;
  add: string;
  refresh: string;
  settings: string;
  loading: string;
  noNotifications: string;
  loadMore: string;
  viewAll: string;
  markAllRead: string;
};

const labelsMap: Record<string, Labels> = {
  pl: {
    notifications: 'Powiadomienia',
    add: 'Dodaj',
    refresh: 'Odśwież',
    settings: 'Ustawienia',
    loading: 'Ładowanie…',
    noNotifications: 'Brak powiadomień.',
    loadMore: 'Załaduj więcej',
    viewAll: 'Zobacz wszystkie',
    markAllRead: 'Oznacz wszystkie jako przeczytane',
  },
  de: {
    notifications: 'Benachrichtigungen',
    add: 'Hinzufügen',
    refresh: 'Aktualisieren',
    settings: 'Einstellungen',
    loading: 'Laden…',
    noNotifications: 'Keine Benachrichtigungen.',
    loadMore: 'Mehr laden',
    viewAll: 'Alle anzeigen',
    markAllRead: 'Alle als gelesen markieren',
  },
  en: {
    notifications: 'Notifications',
    add: 'Add',
    refresh: 'Refresh',
    settings: 'Settings',
    loading: 'Loading…',
    noNotifications: 'No notifications yet.',
    loadMore: 'Load more',
    viewAll: 'View all',
    markAllRead: 'Mark all as read',
  },
};

function getLabels(locale: string): Labels {
  return labelsMap[locale] ?? labelsMap['en']!;
}

export function NotificationBell({
  recipientId,
  limit = 10,
  resetBadgeOnOpen = true,
  className = '',
  placement = 'bottom-end',
  strategy = 'fixed',
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const { localePath } = useLocalePath();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const labels = getLabels(locale);

  // ========= Infinite Query =========
  const baseVars: GetNotificationsQueryVariables = useMemo(
    () => ({ recipientId, limit, offset: 0 }),
    [recipientId, limit]
  );

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotificationsInfiniteQuery(baseVars, {
    // Jeśli w hooku masz domyślne getNextPageParam, nie musisz tu nic podawać
    refetchOnWindowFocus: false,
    staleTime: 10_000,
  });

  // Płaskie, unikatowe „items” ze wszystkich stron
  const pagesItems = useMemo(() => {
    const items =
      data?.pages.flatMap((p) => p.notifications?.items ?? []) ?? [];
    return mergeUniqueById(items);
  }, [data?.pages]);

  // ========= Optimistic UI (read/delete) bez grzebania w cache =========
  const [optimistic, setOptimistic] = useState<
    Record<string, Partial<NotificationNode>>
  >({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const list: NotificationNode[] = useMemo(() => {
    const applied = pagesItems
      .filter((x) => !deletedIds.has(x.id))
      .map((x) => ({ ...x, ...(optimistic[x.id] ?? {}) }));
    return applied;
  }, [pagesItems, optimistic, deletedIds]);

  const headerCount = list.length;

  // ========= Floating + size =========
  const headerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (next) => {
      setOpen(next);
      if (next && resetBadgeOnOpen) setHasNew(false);
      if (next) void refetch();
    },
    placement,
    strategy,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({ padding: 8, fallbackPlacements: ['top-end', 'bottom-start'] }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, elements }) {
          const root = elements.floating as HTMLElement;
          const headerH = headerRef.current?.offsetHeight ?? 0;
          const footerH = footerRef.current?.offsetHeight ?? 0;
          const innerMax = Math.max(0, availableHeight - headerH - footerH);

          root.style.maxHeight = `${availableHeight}px`;
          if (listRef.current)
            listRef.current.style.maxHeight = `${innerMax}px`;
        },
      }),
    ],
  });

  // Zamknij na klik poza
  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      const refEl = refs.reference.current as HTMLElement | null;
      const floatEl = refs.floating.current as HTMLElement | null;
      const t = ev.target as Node;
      if (floatEl?.contains(t) || refEl?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, refs.reference, refs.floating]);

  // ========= Subskrypcje =========
  useNotificationAdded({
    recipientId,
    onMessage: (n) => {
      // Jeśli masz wsparcie dla infinite-key w appendNotificationToCache — użyj go.
      // W przeciwnym razie po prostu odśwież pierwszą stronę (refetch()) albo
      // polegaj na local optimistic „wstrzyknięciu” – tu robimy refetch + badge:
      try {
        appendNotificationToCache(n, baseVars);
      } catch {
        // ignorujemy jeśli append nie wspiera infinite
      }
      setHasNew(true);
      void refetch();
    },
  });
  useNotificationBadge({
    recipientId,
    onChange: () => setHasNew(true),
  });

  // ========= Mutacje =========
  const { mutate: addNotif, isPending: adding } = useAddNotificationMutation(
    baseVars,
    { onSuccess: () => void refetch() }
  );

  const { mutate: markRead, isPending: marking } =
    useMarkNotificationReadMutation(baseVars, {
      onSuccess: () => void refetch(),
    });

  const { mutate: delNotif, isPending: deleting } =
    useDeleteNotificationMutation(baseVars, {
      onSuccess: () => void refetch(),
    });

  const { mutate: markAll, isPending: markingAll } =
    useMarkAllNotificationsReadMutation(baseVars, {
      onSuccess: () => void refetch(),
    });

  // ========= Handlery =========
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const handleMarkOne = useCallback(
    (id: string) => {
      // optimistic
      setOptimistic((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? {}), readAt: new Date().toISOString() },
      }));
      markRead({ id });
    },
    [markRead]
  );

  const handleDeleteOne = useCallback(
    (id: string) => {
      // optimistic
      setDeletedIds((prev) => new Set(prev).add(id));
      delNotif({ id });
    },
    [delNotif]
  );

  const handleMarkAll = useCallback(() => {
    const now = new Date().toISOString();
    // optimistic
    setOptimistic((prev) => {
      const next = { ...prev };
      for (const it of list) {
        next[it.id] = { ...(next[it.id] ?? {}), readAt: now };
      }
      return next;
    });
    setHasNew(false);
    markAll({ recipientId });
  }, [markAll, recipientId, list]);

  const handleAddDev = useCallback(() => {
    addNotif({
      recipientId,
      kind: 'SYSTEM',
      title: 'Hello from dev',
      body: `This is a test notification • ${new Date().toLocaleTimeString()}`,
      data: null,
      entityType: 'OTHER',
      entityId: null,
    } as any);
  }, [addNotif, recipientId]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="relative inline-flex">
      {/* Trigger */}
      <button
        ref={refs.setReference}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Notifications"
        aria-label="Notifications"
        className={[
          'relative inline-flex items-center justify-center rounded-full p-2',
          'transition-all duration-150 hover:bg-zinc-100 focus:outline-none',
          'focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:hover:bg-zinc-800',
          'cursor-pointer',
          className,
        ].join(' ')}
      >
        <Bell className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
        {hasNew && (
          <span className="pointer-events-none absolute top-0 right-0 -translate-x-3">
            <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-red-500 opacity-70" />
            <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            role="dialog"
            aria-label="Notifications list"
            onClick={(e) => e.stopPropagation()}
            className={[
              // Responsywność: szerokość dopasowana do małych ekranów
              'z-50 mt-2 w-[min(24rem,calc(100vw-1rem))] rounded-2xl border border-zinc-200 bg-white shadow-2xl',
              'dark:border-zinc-800 dark:bg-zinc-900',
              // Na większych ekranach trzymaj ~w-96
              'sm:w-96',
            ].join(' ')}
          >
            {/* Header */}
            <div
              ref={headerRef}
              className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">
                  {labels.notifications}
                </h3>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {headerCount}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {process.env.NODE_ENV !== 'production' && (
                  <button
                    type="button"
                    disabled={adding}
                    onClick={handleAddDev}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    title={labels.add}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {labels.add}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setHasNew(false);
                    void refetch();
                  }}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  title={labels.refresh}
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  {labels.refresh}
                </button>
                <Link
                  href={localePath('/account/settings')}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  title={labels.settings}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  {labels.settings}
                </Link>
              </div>
            </div>

            {/* Scroll area – wysokość sterowana w size.apply */}
            <div
              ref={listRef}
              className="overflow-y-auto [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.400)_transparent]"
              style={{ padding: '0.25rem 0.25rem 0.75rem 0.25rem' }}
            >
              {isLoading && (
                <div className="px-4 py-10 text-sm text-zinc-500">
                  {labels.loading}
                </div>
              )}

              {!isLoading && list.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-zinc-500">
                  {labels.noNotifications}
                </div>
              )}

              {list.length > 0 && (
                <>
                  <ul className="space-y-1 px-1">
                    {list.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={{
                          id: n.id,
                          kind: n.kind as string,
                          title: n.title,
                          body: n.body,
                          entityType: n.entityType,
                          readAt: n.readAt,
                          createdAt: n.createdAt,
                          data: n.data as Record<string, unknown> | null,
                          actor: n.actor,
                          event: n.event,
                        }}
                        onMarkRead={handleMarkOne}
                        onDelete={handleDeleteOne}
                        isMarkingRead={marking}
                        isDeleting={deleting}
                      />
                    ))}
                    {/* „Oddech" */}
                    <li aria-hidden className="h-2" />
                  </ul>

                  {/* Load more */}
                  {hasNextPage && (
                    <div className="mt-2 flex justify-center px-2 pb-2">
                      <button
                        type="button"
                        disabled={isFetchingNextPage}
                        onClick={(e) => {
                          e.stopPropagation();
                          loadMore();
                        }}
                        className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        title={labels.loadMore}
                      >
                        {isFetchingNextPage ? labels.loading : labels.loadMore}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div
              ref={footerRef}
              className="flex items-center justify-between border-t border-zinc-100 px-4 py-2.5 text-xs dark:border-zinc-800"
            >
              <Link
                href={localePath('/account/notifications')}
                className="rounded-md px-2 py-1 text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onClick={(e) => e.stopPropagation()}
              >
                {labels.viewAll}
              </Link>
              <button
                type="button"
                disabled={markingAll}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAll();
                }}
                className="rounded-md px-2 py-1 text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                title={labels.markAllRead}
              >
                {labels.markAllRead}
              </button>
            </div>
          </div>
        </FloatingFocusManager>
      )}
    </div>
  );
}

/* ======= Helpers ======= */

function mergeUniqueById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}
