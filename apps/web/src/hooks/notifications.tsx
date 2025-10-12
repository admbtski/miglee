// src/graphql/hooks/notifications.ts
import { useEffect, useRef, useState } from 'react';
import type { Client, SubscribePayload } from 'graphql-ws';
import { print } from 'graphql';
import {
  AddNotificationDocument,
  AddNotificationMutation,
  AddNotificationMutationVariables,
  GetNotificationsDocument,
  GetNotificationsQuery,
  NotificationAddedDocument,
  type NotificationAddedSubscription,
} from '@/graphql/__generated__/react-query';
import { gqlClient } from '@/graphql/client';
import { getWsClient } from '@/graphql/wsClient';
import { getQueryClient } from '@/libs/query-client/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';

/* ========================== Keys ========================== */

export const GET_NOTIFICATIONS_KEY = ['GetNotifications'] as const;

/* ==================== Query: builder/hook ==================== */

export function buildGetNotificationsOptions(
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
    queryKey: GET_NOTIFICATIONS_KEY,
    queryFn: () =>
      gqlClient.request<GetNotificationsQuery>(GetNotificationsDocument),
    ...(options ?? {}),
  };
}

export function useGetNotificationsQuery(
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
  return useQuery(buildGetNotificationsOptions(options));
}

/* ================== Mutation: builder/hook ================== */

type Ctx = { previous?: GetNotificationsQuery | undefined };

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
    ...(options ?? {}),
  };
}

export function useAddNotificationMutation<TContext extends Ctx = Ctx>(
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
        await qc.cancelQueries({ queryKey: GET_NOTIFICATIONS_KEY });

        const previous = qc.getQueryData<GetNotificationsQuery>(
          GET_NOTIFICATIONS_KEY
        );

        const optimisticItem = {
          id: `optimistic-${Date.now()}`,
          message: variables.message,
          __typename: 'Notification' as const,
        };

        qc.setQueryData<GetNotificationsQuery>(GET_NOTIFICATIONS_KEY, (old) =>
          old
            ? {
                ...old,
                notifications: [optimisticItem, ...(old.notifications ?? [])],
              }
            : ({ notifications: [optimisticItem] } as GetNotificationsQuery)
        );

        return { previous } as TContext;
      },

      onError: (_err, _vars, ctx) => {
        const prev = (ctx as Partial<Ctx> | undefined)?.previous;
        if (prev) {
          qc.setQueryData<GetNotificationsQuery>(GET_NOTIFICATIONS_KEY, prev);
        }
      },

      onSuccess: () => {
        qc.invalidateQueries({ queryKey: GET_NOTIFICATIONS_KEY });
      },

      ...(options ?? {}),
    })
  );
}

/* ================= Subscription: hook + helper ================= */

// node „Notification” z subskrypcji
type NotificationNode = NonNullable<
  NotificationAddedSubscription['notificationAdded']
>;

export type OnNotification = (notification: NotificationNode) => void;

/** Helper: dopisz notyfikację do cache React Query */
export function appendNotificationToCache(n: NotificationNode) {
  const qc = getQueryClient();
  qc.setQueryData<GetNotificationsQuery>(GET_NOTIFICATIONS_KEY, (old) =>
    old
      ? { ...old, notifications: [n, ...(old.notifications ?? [])] }
      : ({ notifications: [n] } as GetNotificationsQuery)
  );
}

/**
 * Hook do subskrypcji `notificationAdded` (graphql-ws) z prostym retry/backoff.
 * Przekaż własny `onMessage`, lub zostaw puste i użyj `appendNotificationToCache`
 * w środku (przykład w komentarzu).
 */
export function useNotificationAdded(onMessage?: OnNotification): {
  connected: boolean;
} {
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
          // variables: {} // gdy dodasz filtry subskrypcji
        };

        // zamknij poprzednią subskrypcję
        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        setConnected(true);

        unsubscribeRef.current =
          client.subscribe<NotificationAddedSubscription>(payload, {
            next: (result) => {
              if (result.errors?.length) {
                console.error('❌ GraphQL errors:', result.errors);
                return;
              }
              const node = result.data?.notificationAdded;
              if (node) {
                if (onMessageRef.current) {
                  onMessageRef.current(node);
                } else {
                  // domyślne zachowanie (opcjonalnie odkomentuj)
                  // appendNotificationToCache(node);
                  // albo fallback do loga:
                  console.log('📨 notificationAdded:', node);
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
  }, []);

  return { connected };
}
