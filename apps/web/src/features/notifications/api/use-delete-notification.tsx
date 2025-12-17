// apps/web/src/hooks/notifications.ts
import {
  DeleteNotificationDocument,
  DeleteNotificationMutation,
  DeleteNotificationMutationVariables,
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
import { removeOneFromCache } from './notifications-query-helpers';
import { GET_NOTIFICATIONS_KEY } from './notifications-query-keys';
import { CtxList } from './notifications-query-types';

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
