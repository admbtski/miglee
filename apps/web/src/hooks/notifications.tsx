// apps/web/src/hooks/notifications.ts
import { useEffect, useRef, useState } from 'react';
import type { Client, SubscribePayload } from 'graphql-ws';
import { print } from 'graphql';
import {
  AddNotificationDocument,
  AddNotificationMutation,
  AddNotificationMutationVariables,
  GetNotificationsDocument,
  GetNotificationsQuery,
  GetNotificationsQueryVariables,
  NotificationAddedDocument,
  type NotificationAddedSubscription,
} from '@/graphql/__generated__/react-query';
import { gqlClient } from '@/graphql/client';
// zakładam, że masz to jak wcześniej
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

// klucz z opcjonalnymi zmiennymi (np. recipientId)
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
  // możesz też przekazać zmienne do invalidacji, np. { recipientId }
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

        // „bogatszy” optimistic item – dopasuj do UI
        const optimisticItem = {
          __typename: 'Notification' as const,
          id: `optimistic-${Date.now()}`,
          kind: 'INTENT_CREATED',
          message: variables.message ?? null,
          payload: null,
          readAt: null,
          createdAt: new Date().toISOString(),
          recipientId: '', // nie znamy tutaj – UI zwykle nie używa
          recipient: null,
          intentId: null,
          intent: null,
        };

        qc.setQueryData<GetNotificationsQuery>(
          GET_NOTIFICATIONS_KEY(listVariables) as unknown as QueryKey,
          (old) =>
            old
              ? {
                  ...old,
                  notifications: [
                    optimisticItem as any,
                    ...(old.notifications ?? []),
                  ],
                }
              : ({
                  notifications: [optimisticItem as any],
                } as GetNotificationsQuery)
        );

        return { previous } as TContext;
      },

      onError: (_err, _vars, ctx) => {
        const prev = (ctx as Partial<Ctx> | undefined)?.previous;
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

/* ================= Subscription: hook + helper ================= */

// węzeł z subskrypcji
type NotificationNode = NonNullable<
  NotificationAddedSubscription['notificationAdded']
>;
export type OnNotification = (notification: NotificationNode) => void;

/** Dopisanie notyfikacji do cache React Query */
export function appendNotificationToCache(
  n: NotificationNode,
  variables?: GetNotificationsQueryVariables
) {
  const qc = getQueryClient();
  qc.setQueryData<GetNotificationsQuery>(
    GET_NOTIFICATIONS_KEY(variables) as unknown as QueryKey,
    (old) =>
      old
        ? { ...old, notifications: [n as any, ...(old.notifications ?? [])] }
        : ({ notifications: [n as any] } as GetNotificationsQuery)
  );
}

/**
 * Subskrypcja notificationAdded (graphql-ws) z retry/backoff.
 * Wymaga recipientId (schema: ID!).
 */
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
          variables: { recipientId }, // schema wymaga ID!
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
                  // domyślnie możesz dopisywać do cache
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
  }, [recipientId]);

  return { connected };
}
