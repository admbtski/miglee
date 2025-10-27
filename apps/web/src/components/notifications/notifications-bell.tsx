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
import {
  Bell,
  Check,
  Plus,
  RefreshCcw,
  Settings2,
  Trash2,
  Calendar,
  MessageSquare,
  CreditCard,
  User,
  Info,
  AlertCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  appendNotificationToCache,
  useAddNotificationMutation,
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationAdded,
  useNotificationBadge,
} from '@/hooks/graphql/notifications';
import {
  GetNotificationsDocument,
  type GetNotificationsQuery,
  type GetNotificationsQueryVariables,
} from '@/lib/graphql/__generated__/react-query-update';
import { gqlClient } from '@/lib/graphql/client';

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

/* ===== Ikony zależne od entityType ===== */
function getNotificationIcon(entityType?: string) {
  switch (entityType) {
    case 'INTENT':
      return <Calendar className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
    case 'MESSAGE':
      return (
        <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      );
    case 'PAYMENT':
    case 'INVOICE':
      return (
        <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      );
    case 'USER':
      return <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
    case 'SYSTEM':
      return <Info className="h-4 w-4 text-violet-600 dark:text-violet-400" />;
    case 'OTHER':
    default:
      return (
        <AlertCircle className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      );
  }
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

  // ----------- Query (pierwsza strona) -----------
  const baseVars: GetNotificationsQueryVariables = useMemo(
    () => ({ recipientId, limit, offset: 0 }),
    [recipientId, limit]
  );
  const { data, isLoading, refetch } = useGetNotificationsQuery(baseVars, {
    refetchOnWindowFocus: false,
    staleTime: 10_000,
  });

  // ----------- Lokalny stan stron -----------
  const [list, setList] = useState<NotificationNode[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const hydratedRef = useRef(false);

  useEffect(() => {
    const items = data?.notifications?.items ?? [];
    const pi = data?.notifications?.pageInfo;

    if (!hydratedRef.current || list.length === 0) {
      setList(items);
      setHasNext(!!pi?.hasNext);
      setNextOffset(
        pi?.hasNext ? (pi!.offset ?? 0) + (pi!.limit ?? items.length) : null
      );
      hydratedRef.current = true;
      return;
    }

    if (items.length > 0) {
      setList((prev) => patchById(prev, items));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.notifications?.items, data?.notifications?.pageInfo]);

  // Dociąganie kolejnej strony
  const loadMore = useCallback(async () => {
    if (loadingMore || nextOffset == null) return;
    try {
      setLoadingMore(true);
      const res = await gqlClient.request<
        GetNotificationsQuery,
        GetNotificationsQueryVariables
      >(GetNotificationsDocument, { recipientId, limit, offset: nextOffset });
      const more = res.notifications?.items ?? [];
      const pi = res.notifications?.pageInfo;

      setList((prev) => mergeUniqueById([...prev, ...more]));
      if (pi?.hasNext) {
        setHasNext(true);
        setNextOffset((pi.offset ?? nextOffset) + (pi.limit ?? more.length));
      } else {
        setHasNext(false);
        setNextOffset(null);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextOffset, recipientId, limit]);

  // ----------- Floating + rozmiar scrolla -----------
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

  // ----------- Subskrypcje -----------
  useNotificationAdded({
    recipientId,
    onMessage: (n) => {
      appendNotificationToCache(n, baseVars);
      setList((prev) => mergeUniqueById([n as any, ...prev]));
      setHasNew(true);
    },
  });
  useNotificationBadge({
    recipientId,
    onChange: () => setHasNew(true),
  });

  // ----------- Mutacje -----------
  const { mutate: addNotif, isPending: adding } = useAddNotificationMutation(
    baseVars,
    { onSuccess: () => {} }
  );
  const { mutate: markRead, isPending: marking } =
    useMarkNotificationReadMutation(baseVars, { onSuccess: () => {} });
  const { mutate: delNotif, isPending: deleting } =
    useDeleteNotificationMutation(baseVars, { onSuccess: () => {} });
  const { mutate: markAll, isPending: markingAll } =
    useMarkAllNotificationsReadMutation(baseVars, { onSuccess: () => {} });

  // Handlery
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const handleMarkOne = useCallback(
    (id: string) => {
      markRead({ id });
      setList((prev) =>
        prev.map((x) =>
          x.id === id && !x.readAt
            ? { ...x, readAt: new Date().toISOString() }
            : x
        )
      );
    },
    [markRead]
  );
  const handleDeleteOne = useCallback(
    (id: string) => {
      delNotif({ id });
      setList((prev) => prev.filter((x) => x.id !== id));
    },
    [delNotif]
  );
  const handleMarkAll = useCallback(() => {
    markAll({ recipientId });
    setHasNew(false);
    const now = new Date().toISOString();
    setList((prev) => prev.map((x) => (x.readAt ? x : { ...x, readAt: now })));
  }, [markAll, recipientId]);
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

  const headerCount = list.length;

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
              'z-50 mt-2 w-96 rounded-2xl border border-zinc-200 bg-white shadow-2xl',
              'dark:border-zinc-800 dark:bg-zinc-900',
            ].join(' ')}
          >
            {/* Header */}
            <div
              ref={headerRef}
              className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Notifications</h3>
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
                    title="Add test notification"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setHasNew(false);
                    void refetch();
                  }}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  title="Refresh"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Refresh
                </button>
                <a
                  href="/settings/notifications"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  title="Notification settings"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Settings
                </a>
              </div>
            </div>

            {/* Scroll area – wysokość sterowana w size.apply */}
            <div
              ref={listRef}
              className="overflow-y-auto [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.400)_transparent]"
              style={{ padding: '0.25rem 0.25rem 0.75rem 0.25rem' }}
            >
              {isLoading && !hydratedRef.current && (
                <div className="px-4 py-10 text-sm text-zinc-500">Loading…</div>
              )}

              {!isLoading && list.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-zinc-500">
                  No notifications yet.
                </div>
              )}

              {list.length > 0 && (
                <>
                  <ul className="space-y-1 px-1">
                    {list.map((n) => {
                      const unread = !n.readAt;
                      return (
                        <li
                          key={n.id}
                          className={[
                            'group relative overflow-hidden rounded-xl border',
                            unread
                              ? 'border-blue-200/60 bg-white shadow-sm dark:border-blue-900/40 dark:bg-zinc-900'
                              : 'border-zinc-200/60 bg-white dark:border-zinc-800/60 dark:bg-zinc-900',
                            'transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800',
                          ].join(' ')}
                        >
                          <div className="flex items-start gap-3 px-4 py-3">
                            {/* Ikona zależna od entityType */}
                            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                              {getNotificationIcon(n.entityType as string)}
                            </div>

                            {/* 🔵 Pulsująca niebieska kropka */}
                            <span className="relative mt-2 inline-flex h-2.5 w-2.5">
                              {unread ? (
                                <>
                                  <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-sky-500 opacity-70" />
                                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
                                </>
                              ) : (
                                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-transparent" />
                              )}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="mb-0.5 flex items-center justify-between gap-2">
                                <div className="line-clamp-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  {n.title ?? formatKind(n.kind as string)}
                                </div>
                                <div className="shrink-0 text-[10px] text-zinc-500">
                                  {formatTime(n.createdAt)}
                                </div>
                              </div>
                              {n.body ? (
                                <div className="line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">
                                  {n.body}
                                </div>
                              ) : null}

                              <div className="mt-2 flex items-center gap-2">
                                {unread && (
                                  <button
                                    type="button"
                                    disabled={marking}
                                    onClick={() => handleMarkOne(n.id)}
                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    Mark read
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={deleting}
                                  onClick={() => handleDeleteOne(n.id)}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                    {/* „Oddech” */}
                    <li aria-hidden className="h-2" />
                  </ul>

                  {/* Load more */}
                  {hasNext && nextOffset != null && (
                    <div className="mt-2 flex justify-center px-2 pb-2">
                      <button
                        type="button"
                        disabled={loadingMore}
                        onClick={(e) => {
                          e.stopPropagation();
                          void loadMore();
                        }}
                        className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        title="Load more notifications"
                      >
                        {loadingMore ? 'Loading…' : 'Load more'}
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
              <a
                href="/notifications"
                className="rounded-md px-2 py-1 text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onClick={(e) => e.stopPropagation()}
              >
                View all
              </a>
              <button
                type="button"
                disabled={markingAll}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAll();
                }}
                className="rounded-md px-2 py-1 text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                title="Mark all notifications as read"
              >
                Mark all as read
              </button>
            </div>
          </div>
        </FloatingFocusManager>
      )}
    </div>
  );
}

/* ======= Helpers ======= */

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return iso;
  }
}

function formatKind(kind: string) {
  switch (kind) {
    case 'INTENT_REMINDER':
      return 'Upcoming meeting';
    case 'INTENT_UPDATED':
      return 'Meeting updated';
    case 'INTENT_CANCELED':
      return 'Meeting canceled';
    case 'INTENT_CREATED':
      return 'Intent created';
    default:
      return 'Notification';
  }
}

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

function patchById<T extends { id: string }>(prev: T[], firstPage: T[]): T[] {
  const map = new Map<string, T>();
  for (const p of prev) map.set(p.id, p);

  const head: T[] = [];
  for (const f of firstPage) {
    const existing = map.get(f.id);
    if (existing) {
      const merged = { ...existing, ...f };
      head.push(merged);
      map.set(f.id, merged);
    } else {
      head.push(f);
      map.set(f.id, f);
    }
  }

  const tail: T[] = [];
  for (const p of prev) {
    if (!head.find((h) => h.id === p.id)) tail.push(map.get(p.id) ?? p);
  }

  return [...head, ...tail];
}
