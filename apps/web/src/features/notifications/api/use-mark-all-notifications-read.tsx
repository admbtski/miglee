import {
  GetNotificationsQuery,
  GetNotificationsQueryVariables,
  MarkAllNotificationsReadDocument,
  MarkAllNotificationsReadMutation,
  MarkAllNotificationsReadMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { markAllReadInCache } from './notifications-query-helpers';
import { GET_NOTIFICATIONS_KEY } from './notifications-query-keys';
import { CtxList } from './notifications-query-types';

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
