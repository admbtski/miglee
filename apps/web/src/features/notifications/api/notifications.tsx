// apps/web/src/hooks/notifications.ts
import { useEffect, useRef, useState } from 'react';
import type { Client, SubscribePayload } from 'graphql-ws';
import { print } from 'graphql';
import {
  // Queries
  GetNotificationsDocument,
  GetNotificationsQuery,
  GetNotificationsQueryVariables,
  // Subscriptions
  NotificationAddedDocument,
  type NotificationAddedSubscription,
  NotificationBadgeChangedDocument,
  type NotificationBadgeChangedSubscription,
  // Mutations
  AddNotificationDocument,
  AddNotificationMutation,
  AddNotificationMutationVariables,
  MarkNotificationReadDocument,
  MarkNotificationReadMutation,
  MarkNotificationReadMutationVariables,
  DeleteNotificationDocument,
  DeleteNotificationMutation,
  DeleteNotificationMutationVariables,
  MarkAllNotificationsReadDocument,
  MarkAllNotificationsReadMutation,
  MarkAllNotificationsReadMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getWsClient } from '@/lib/api/ws-client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';

/* ========================== Konfiguracja ========================== */

const MAX_NOTIFS = 200; // limit elementów w liście w cache

/* ========================== Keys ========================== */

export const GET_NOTIFICATIONS_KEY = (
  variables?: GetNotificationsQueryVariables
) =>
  variables
    ? (['GetNotifications', variables] as const)
    : (['GetNotifications'] as const);

/* ==================== Query: builder/hook ==================== */

export function buildGetNotificationsOptions(
  variables?: GetNotificationsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetNotificationsQuery,
      unknown,
      GetNotificationsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetNotificationsQuery,
  unknown,
  GetNotificationsQuery,
  QueryKey
> {
  return {
    queryKey: GET_NOTIFICATIONS_KEY(variables) as unknown as QueryKey,
    queryFn: () =>
      variables
        ? gqlClient.request<
            GetNotificationsQuery,
            GetNotificationsQueryVariables
          >(GetNotificationsDocument, variables)
        : gqlClient.request<GetNotificationsQuery>(GetNotificationsDocument),
    ...(options ?? {}),
  };
}

export function useGetNotificationsQuery(
  variables?: GetNotificationsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetNotificationsQuery,
      unknown,
      GetNotificationsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetNotificationsOptions(variables, options));
}

/* ================= Helpers: praca na zagnieżdżonej liście ================= */

type NotificationNode = NonNullable<
  NotificationAddedSubscription['notificationAdded']
>;
export type OnNotification = (notification: NotificationNode) => void;

function mutateCache(
  updater: (
    prev: GetNotificationsQuery | undefined
  ) => GetNotificationsQuery | undefined,
  variables?: GetNotificationsQueryVariables
) {
  const qc = getQueryClient();
  const key = GET_NOTIFICATIONS_KEY(variables) as unknown as QueryKey;
  qc.setQueryData<GetNotificationsQuery>(key, (old) => updater(old));
}

/** Pobierz bezpiecznie listę items (może być pusta struktura). */
function getItems(old?: GetNotificationsQuery) {
  return old?.notifications?.items ?? [];
}

/** Zapisz nową listę items, zachowując pageInfo jeśli istnieje. */
function setItems(
  old: GetNotificationsQuery | undefined,
  items: any[]
): GetNotificationsQuery {
  return {
    notifications: {
      __typename: old?.notifications?.__typename ?? 'NotificationsResult',
      items,
      pageInfo: old?.notifications?.pageInfo ?? {
        __typename: 'PageInfo',
        total: items.length,
        limit: items.length,
        offset: 0,
        hasPrev: false,
        hasNext: false,
      },
    },
  } as GetNotificationsQuery;
}

/** Dopisanie notyfikacji do cache (dedupe po id + limit) */
export function appendNotificationToCache(
  n: NotificationNode,
  variables?: GetNotificationsQueryVariables
) {
  mutateCache((old) => {
    const items = getItems(old);
    if (items.some((x: any) => x.id === (n as any).id)) return old; // już jest
    const next = [n as any, ...items].slice(0, MAX_NOTIFS);
    return setItems(old, next);
  }, variables);
}

/** Oznacz jedną notyfikację jako przeczytaną (optimistic) */
export function markOneReadInCache(
  id: string,
  variables?: GetNotificationsQueryVariables
) {
  mutateCache((old) => {
    const items = getItems(old);
    if (items.length === 0) return old;
    const now = new Date().toISOString();
    const next = items.map((x: any) =>
      x.id === id && !x.readAt ? { ...x, readAt: now } : x
    );
    return setItems(old, next);
  }, variables);
}

/** Usuń jedną notyfikację z cache (optimistic) */
export function removeOneFromCache(
  id: string,
  variables?: GetNotificationsQueryVariables
) {
  mutateCache((old) => {
    const items = getItems(old);
    if (items.length === 0) return old;
    const next = items.filter((x: any) => x.id !== id);
    return setItems(old, next);
  }, variables);
}

/** Oznacz wszystkie notyfikacje jako przeczytane (optimistic) */
export function markAllReadInCache(variables?: GetNotificationsQueryVariables) {
  mutateCache((old) => {
    const items = getItems(old);
    if (items.length === 0) return old;
    const now = new Date().toISOString();
    const next = items.map((x: any) => (x.readAt ? x : { ...x, readAt: now }));
    return setItems(old, next);
  }, variables);
}

/* ================== Mutation: builders & hooks ================== */

type CtxList = { previous?: GetNotificationsQuery | undefined };

/** addNotification */
export function buildAddNotificationOptions<TContext = unknown>(
  options?: UseMutationOptions<
    AddNotificationMutation,
    unknown,
    AddNotificationMutationVariables,
    TContext
  >
): UseMutationOptions<
  AddNotificationMutation,
  unknown,
  AddNotificationMutationVariables,
  TContext
> {
  return {
    mutationKey: ['AddNotification'] as QueryKey,
    mutationFn: (variables) =>
      gqlClient.request(AddNotificationDocument, variables),
    meta: {
      successMessage: 'Notification sent',
    },
    ...(options ?? {}),
  };
}

export function useAddNotificationMutation<TContext extends CtxList = CtxList>(
  listVariables?: GetNotificationsQueryVariables,
  options?: UseMutationOptions<
    AddNotificationMutation,
    unknown,
    AddNotificationMutationVariables,
    TContext
  >
) {
  const qc = getQueryClient();

  return useMutation<
    AddNotificationMutation,
    unknown,
    AddNotificationMutationVariables,
    TContext
  >(
    buildAddNotificationOptions<TContext>({
      onMutate: async (variables) => {
        await qc.cancelQueries({
          queryKey: GET_NOTIFICATIONS_KEY(listVariables) as unknown as QueryKey,
        });

        const previous = qc.getQueryData<GetNotificationsQuery>(
          GET_NOTIFICATIONS_KEY(listVariables) as unknown as QueryKey
        );

        // optimistic: dopisz "tymczasową" pozycję
        const optimisticItem = {
          __typename: 'Notification' as const,
          id: `optimistic-${Date.now()}`,
          kind: (variables.kind as any) ?? 'SYSTEM',
          title: variables.title ?? null,
          body: variables.body ?? null,
          data: (variables.data as any) ?? null,
          readAt: null,
          createdAt: new Date().toISOString(),
          recipientId: variables.recipientId ?? '',
          recipient: null,
          eventId:
            variables.entityType === 'EVENT'
              ? ((variables.entityId as string) ?? null)
              : null,
          event: null,
        };

        mutateCache((old) => {
          const items = getItems(old);
          const next = [optimisticItem as any, ...items].slice(0, MAX_NOTIFS);
          return setItems(old, next);
        }, listVariables);

        return { previous } as TContext;
      },

      onError: (_err, _vars, ctx) => {
        const prev = (ctx as Partial<CtxList> | undefined)?.previous;
        if (prev) {
          qc.setQueryData<GetNotificationsQuery>(
            GET_NOTIFICATIONS_KEY(listVariables) as unknown as QueryKey,
            prev
          );
        }
      },

      onSuccess: () => {
        // odśwież listy (np. aby zniknęły optimistic id)
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetNotifications',
        });
      },

      ...(options ?? {}),
    })
  );
}

/** markNotificationRead */
export function buildMarkNotificationReadOptions<TContext = unknown>(
  options?: UseMutationOptions<
    MarkNotificationReadMutation,
    unknown,
    MarkNotificationReadMutationVariables,
    TContext
  >
): UseMutationOptions<
  MarkNotificationReadMutation,
  unknown,
  MarkNotificationReadMutationVariables,
  TContext
> {
  return {
    mutationKey: ['MarkNotificationRead'] as QueryKey,
    mutationFn: (variables) =>
      gqlClient.request<
        MarkNotificationReadMutation,
        MarkNotificationReadMutationVariables
      >(MarkNotificationReadDocument, variables),
    // No toast - background action
    ...(options ?? {}),
  };
}

export function useMarkNotificationReadMutation<
  TContext extends CtxList = CtxList,
>(
  listVariables?: GetNotificationsQueryVariables,
  options?: UseMutationOptions<
    MarkNotificationReadMutation,
    unknown,
    MarkNotificationReadMutationVariables,
    TContext
  >
) {
  const qc = getQueryClient();

  return useMutation<
    MarkNotificationReadMutation,
    unknown,
    MarkNotificationReadMutationVariables,
    TContext
  >(
    buildMarkNotificationReadOptions<TContext>({
      onMutate: async (variables) => {
        await qc.cancelQueries({
          queryKey: GET_NOTIFICATIONS_KEY(listVariables) as unknown as QueryKey,
        });

        const previous = qc.getQueryData<GetNotificationsQuery>(
          GET_NOTIFICATIONS_KEY(listVariables) as unknown as QueryKey
        );

        if (variables.id) markOneReadInCache(variables.id, listVariables);

        return { previous } as TContext;
      },

      onError: (_err, _vars, ctx) => {
        const prev = (ctx as Partial<CtxList> | undefined)?.previous;
        if (prev) {
          qc.setQueryData<GetNotificationsQuery>(
            GET_NOTIFICATIONS_KEY(listVariables) as unknown as QueryKey,
            prev
          );
        }
      },

      onSuccess: () => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetNotifications',
        });
      },

      ...(options ?? {}),
    })
  );
}

/** deleteNotification */
export function buildDeleteNotificationOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DeleteNotificationMutation,
    unknown,
    DeleteNotificationMutationVariables,
    TContext
  >
): UseMutationOptions<
  DeleteNotificationMutation,
  unknown,
  DeleteNotificationMutationVariables,
  TContext
> {
  return {
    mutationKey: ['DeleteNotification'] as QueryKey,
    mutationFn: (variables) =>
      gqlClient.request<
        DeleteNotificationMutation,
        DeleteNotificationMutationVariables
      >(DeleteNotificationDocument, variables),
    meta: {
      successMessage: 'Notification deleted',
    },
    ...(options ?? {}),
  };
}

export function useDeleteNotificationMutation<
  TContext extends CtxList = CtxList,
>(
  listVariables?: GetNotificationsQueryVariables,
  options?: UseMutationOptions<
    DeleteNotificationMutation,
    unknown,
    DeleteNotificationMutationVariables,
    TContext
  >
) {
  const qc = getQueryClient();

  return useMutation<
    DeleteNotificationMutation,
    unknown,
    DeleteNotificationMutationVariables,
    TContext
  >(
    buildDeleteNotificationOptions<TContext>({
      onMutate: async (variables) => {
        await qc.cancelQueries({
          queryKey: GET_NOTIFICATIONS_KEY(listVariables) as unknown as QueryKey,
        });

        const previous = qc.getQueryData<GetNotificationsQuery>(
          GET_NOTIFICATIONS_KEY(listVariables) as unknown as QueryKey
        );

        if (variables.id) removeOneFromCache(variables.id, listVariables);

        return { previous } as TContext;
      },

      onError: (_err, _vars, ctx) => {
        const prev = (ctx as Partial<CtxList> | undefined)?.previous;
        if (prev) {
          qc.setQueryData<GetNotificationsQuery>(
            GET_NOTIFICATIONS_KEY(listVariables) as unknown as QueryKey,
            prev
          );
        }
      },

      onSuccess: () => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetNotifications',
        });
      },

      ...(options ?? {}),
    })
  );
}

/** markAllNotificationsRead */
export function buildMarkAllNotificationsReadOptions<TContext = unknown>(
  options?: UseMutationOptions<
    MarkAllNotificationsReadMutation,
    unknown,
    MarkAllNotificationsReadMutationVariables,
    TContext
  >
): UseMutationOptions<
  MarkAllNotificationsReadMutation,
  unknown,
  MarkAllNotificationsReadMutationVariables,
  TContext
> {
  return {
    mutationKey: ['MarkAllNotificationsRead'] as QueryKey,
    mutationFn: (variables) =>
      gqlClient.request<
        MarkAllNotificationsReadMutation,
        MarkAllNotificationsReadMutationVariables
      >(MarkAllNotificationsReadDocument, variables),
    meta: {
      successMessage: 'All notifications marked as read',
    },
    ...(options ?? {}),
  };
}

export function useMarkAllNotificationsReadMutation<
  TContext extends CtxList = CtxList,
>(
  listVariables?: GetNotificationsQueryVariables,
  options?: UseMutationOptions<
    MarkAllNotificationsReadMutation,
    unknown,
    MarkAllNotificationsReadMutationVariables,
    TContext
  >
) {
  const qc = getQueryClient();

  return useMutation<
    MarkAllNotificationsReadMutation,
    unknown,
    MarkAllNotificationsReadMutationVariables,
    TContext
  >(
    buildMarkAllNotificationsReadOptions<TContext>({
      onMutate: async (_variables) => {
        await qc.cancelQueries({
          queryKey: GET_NOTIFICATIONS_KEY(listVariables) as unknown as QueryKey,
        });

        const previous = qc.getQueryData<GetNotificationsQuery>(
          GET_NOTIFICATIONS_KEY(listVariables) as unknown as QueryKey
        );

        markAllReadInCache(listVariables);

        return { previous } as TContext;
      },

      onError: (_err, _vars, ctx) => {
        const prev = (ctx as Partial<CtxList> | undefined)?.previous;
        if (prev) {
          qc.setQueryData<GetNotificationsQuery>(
            GET_NOTIFICATIONS_KEY(listVariables) as unknown as QueryKey,
            prev
          );
        }
      },

      onSuccess: () => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetNotifications',
        });
      },

      ...(options ?? {}),
    })
  );
}

/* ================= Subscription: notificationAdded ================= */

export function useNotificationAdded(params: {
  recipientId: string;
  onMessage?: OnNotification;
}) {
  const { recipientId, onMessage } = params;
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const onMessageRef = useRef<OnNotification | undefined>(onMessage);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    let isActive = true;
    const mySession = ++sessionRef.current;
    const backoffMs = [1000, 2000, 5000, 10000] as const;
    let attempt = 0;

    const scheduleRetry = () => {
      const delay = backoffMs[Math.min(attempt, backoffMs.length - 1)];
      attempt += 1;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        if (!isActive || mySession !== sessionRef.current) return;
        void subscribeOnce();
      }, delay);
    };

    const subscribeOnce = async () => {
      try {
        const client = (await getWsClient()) as Client;
        if (!isActive || mySession !== sessionRef.current) return;

        const payload: SubscribePayload = {
          query: print(NotificationAddedDocument),
          variables: { recipientId },
        };

        // zamknij poprzednią subskrypcję
        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current =
          client.subscribe<NotificationAddedSubscription>(payload, {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error('❌ GraphQL errors:', result.errors);
                return;
              }
              const node = result.data?.notificationAdded;
              if (node) {
                if (onMessageRef.current) {
                  onMessageRef.current(node);
                } else {
                  appendNotificationToCache(node, { recipientId });
                }
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ Subscription error:', err);
              setConnected(false);
              scheduleRetry();
            },
            complete: () => {
              if (!isActive || mySession !== sessionRef.current) return;
              setConnected(false);
              scheduleRetry();
            },
          });
      } catch (err) {
        if (!isActive || mySession !== sessionRef.current) return;
        console.error('❗ Subscription setup failed:', err);
        setConnected(false);
        scheduleRetry();
      }
    };

    void subscribeOnce();

    return () => {
      isActive = false;
      sessionRef.current++;
      setConnected(false);

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch {}
        unsubscribeRef.current = null;
      }
    };
  }, [recipientId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { connected };
}

/* ================ Subscription: notificationBadgeChanged ================ */

export function useNotificationBadge(params: {
  recipientId: string;
  onChange?: (recipientId: string) => void;
}) {
  const { recipientId, onChange } = params;
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let isActive = true;
    const mySession = ++sessionRef.current;
    const backoffMs = [1000, 2000, 5000, 10000] as const;
    let attempt = 0;

    const scheduleRetry = () => {
      const delay = backoffMs[Math.min(attempt, backoffMs.length - 1)];
      attempt += 1;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        if (!isActive || mySession !== sessionRef.current) return;
        void subscribeOnce();
      }, delay);
    };

    const subscribeOnce = async () => {
      try {
        const client = (await getWsClient()) as Client;
        if (!isActive || mySession !== sessionRef.current) return;

        const payload: SubscribePayload = {
          query: print(NotificationBadgeChangedDocument),
          variables: { recipientId },
        };

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current =
          client.subscribe<NotificationBadgeChangedSubscription>(payload, {
            next: (res) => {
              if (!connected) setConnected(true);

              const rid = res.data?.notificationBadgeChanged?.recipientId;
              if (rid) {
                onChange?.(rid); // np. zainwaliduj licznik
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ Badge subscription error:', err);
              setConnected(false);
              scheduleRetry();
            },
            complete: () => {
              if (!isActive || mySession !== sessionRef.current) return;
              setConnected(false);
              scheduleRetry();
            },
          });
      } catch (err) {
        if (!isActive || mySession !== sessionRef.current) return;
        console.error('❗ Badge subscription setup failed:', err);
        setConnected(false);
        scheduleRetry();
      }
    };

    void subscribeOnce();

    return () => {
      isActive = false;
      sessionRef.current++;
      setConnected(false);

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch {}
        unsubscribeRef.current = null;
      }
    };
  }, [recipientId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { connected };
}

/* =============================================================================
 * Typy pomocnicze — wymagamy recipientId, offset zarządzamy sami
 * ========================================================================== */
type NotificationsVarsBase = GetNotificationsQueryVariables;

// Te zmienne przyjmujemy z zewnątrz (offset dokładamy sami)
export type NotificationsVarsNoOffset = Omit<
  NotificationsVarsBase,
  'offset'
> & {
  recipientId: string; // <- WYMAGANY
};

// Dla zwykłego useQuery też chcemy mieć recipientId wymagany,
// ale możemy przyjąć również offset jeśli chcesz używać bez infinite:
export type NotificationsVarsList = NotificationsVarsNoOffset & {
  offset?: number | null | undefined;
};

export const GET_NOTIFICATIONS_INFINITE_KEY = (
  variables?: Omit<GetNotificationsQueryVariables, 'offset'>
) =>
  variables
    ? (['GetNotificationsInfinite', variables] as const)
    : (['GetNotificationsInfinite'] as const);

/** Builder dla useInfiniteQuery (offset doklejany, recipientId wymagany) */
export function buildGetNotificationsInfiniteOptions(
  variables: NotificationsVarsNoOffset,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetNotificationsQuery, // TQueryFnData
      Error, // TError
      InfiniteData<GetNotificationsQuery>,
      QueryKey, // TQueryKey
      number // TPageParam (offset)
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
): UseInfiniteQueryOptions<
  GetNotificationsQuery,
  Error,
  InfiniteData<GetNotificationsQuery>,
  QueryKey,
  number
> {
  return {
    queryKey: GET_NOTIFICATIONS_INFINITE_KEY(variables) as unknown as QueryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const vars: GetNotificationsQueryVariables = {
        ...variables, // <- zawiera wymagany recipientId
        offset: pageParam, // <- dokładamy offset
      };
      return gqlClient.request<
        GetNotificationsQuery,
        GetNotificationsQueryVariables
      >(GetNotificationsDocument, vars);
    },
    getNextPageParam: (lastPage, _all, lastOffset) => {
      const res = lastPage.notifications;
      if (res?.pageInfo) {
        const { hasNext, limit } = res.pageInfo as {
          hasNext: boolean;
          limit: number;
        };
        if (!hasNext) return undefined;
        const prev = (lastOffset ?? 0) as number;
        return prev + limit;
      }
      return undefined;
    },
    ...(options ?? {}),
  };
}
/** Publiczny hook (infinite) — zwraca InfiniteData<GetNotificationsQuery> */
export function useNotificationsInfiniteQuery(
  variables: NotificationsVarsNoOffset,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetNotificationsQuery,
      Error,
      InfiniteData<GetNotificationsQuery>,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  return useInfiniteQuery<
    GetNotificationsQuery,
    Error,
    InfiniteData<GetNotificationsQuery>,
    QueryKey,
    number
  >(buildGetNotificationsInfiniteOptions(variables, options));
}
