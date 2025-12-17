import {
  GetNotificationsQuery,
  GetNotificationsQueryVariables,
  MarkNotificationReadDocument,
  MarkNotificationReadMutation,
  MarkNotificationReadMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { markOneReadInCache } from './notifications-query-helpers';
import { GET_NOTIFICATIONS_KEY } from './notifications-query-keys';
import { CtxList } from './notifications-query-types';

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
