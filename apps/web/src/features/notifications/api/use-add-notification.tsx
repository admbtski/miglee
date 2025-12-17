import {
  AddNotificationDocument,
  AddNotificationMutation,
  AddNotificationMutationVariables,
  GetNotificationsQuery,
  GetNotificationsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { getItems, mutateCache, setItems } from './notifications-query-helpers';
import { GET_NOTIFICATIONS_KEY } from './notifications-query-keys';
import { CtxList } from './notifications-query-types';
import { MAX_NOTIFS } from './notifications-query-constants';

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
