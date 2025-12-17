import {
  RequestJoinEventDocument,
  RequestJoinEventMutation,
  RequestJoinEventMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import {
  GET_EVENT_DETAIL_KEY,
  GET_EVENT_MEMBERS_KEY,
} from './events-query-keys';

export function buildRequestJoinEventOptions<TContext = unknown>(
  options?: UseMutationOptions<
    RequestJoinEventMutation,
    unknown,
    RequestJoinEventMutationVariables,
    TContext
  >
): UseMutationOptions<
  RequestJoinEventMutation,
  unknown,
  RequestJoinEventMutationVariables,
  TContext
> {
  return {
    mutationKey: ['RequestJoinEvent'] as QueryKey,
    mutationFn: async (variables: RequestJoinEventMutationVariables) =>
      gqlClient.request<
        RequestJoinEventMutation,
        RequestJoinEventMutationVariables
      >(RequestJoinEventDocument, variables),
    meta: {
      successMessage: 'Join request sent successfully',
    },
    ...(options ?? {}),
  };
}

export function useRequestJoinEventMutation(
  options?: UseMutationOptions<
    RequestJoinEventMutation,
    unknown,
    RequestJoinEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    RequestJoinEventMutation,
    unknown,
    RequestJoinEventMutationVariables
  >(
    buildRequestJoinEventOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
        if (vars.eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: vars.eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBERS_KEY({
              eventId: vars.eventId,
            }) as QueryKey,
          });
        }
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetMyMemberships',
        });
      },
      ...(options ?? {}),
    })
  );
}
