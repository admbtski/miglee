import {
  ReopenEventJoinDocument,
  ReopenEventJoinMutation,
  ReopenEventJoinMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GET_EVENT_DETAIL_KEY } from './events-query-keys';

export function buildReopenEventJoinOptions<TContext = unknown>(
  options?: UseMutationOptions<
    ReopenEventJoinMutation,
    unknown,
    ReopenEventJoinMutationVariables,
    TContext
  >
): UseMutationOptions<
  ReopenEventJoinMutation,
  unknown,
  ReopenEventJoinMutationVariables,
  TContext
> {
  return {
    mutationKey: ['ReopenEventJoin'] as QueryKey,
    mutationFn: async (variables: ReopenEventJoinMutationVariables) =>
      gqlClient.request<
        ReopenEventJoinMutation,
        ReopenEventJoinMutationVariables
      >(ReopenEventJoinDocument, variables),
    meta: {
      successMessage: 'Zapisy otwarte ponownie',
    },
    ...(options ?? {}),
  };
}

export function useReopenEventJoinMutation(
  options?: UseMutationOptions<
    ReopenEventJoinMutation,
    unknown,
    ReopenEventJoinMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    ReopenEventJoinMutation,
    unknown,
    ReopenEventJoinMutationVariables
  >(
    buildReopenEventJoinOptions({
      onSuccess: (_data, vars) => {
        // odśwież listy i szczegół
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
        if (vars.eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: vars.eventId,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
