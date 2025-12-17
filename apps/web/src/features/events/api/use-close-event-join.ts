import {
  CloseEventJoinDocument,
  CloseEventJoinMutation,
  CloseEventJoinMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GET_EVENT_DETAIL_KEY } from './events-query-keys';

export function buildCloseEventJoinOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CloseEventJoinMutation,
    unknown,
    CloseEventJoinMutationVariables,
    TContext
  >
): UseMutationOptions<
  CloseEventJoinMutation,
  unknown,
  CloseEventJoinMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CloseEventJoin'] as QueryKey,
    mutationFn: async (variables: CloseEventJoinMutationVariables) =>
      gqlClient.request<
        CloseEventJoinMutation,
        CloseEventJoinMutationVariables
      >(CloseEventJoinDocument, variables),
    meta: {
      successMessage: 'Zapisy zamknięte pomyślnie',
    },
    ...(options ?? {}),
  };
}

export function useCloseEventJoinMutation(
  options?: UseMutationOptions<
    CloseEventJoinMutation,
    unknown,
    CloseEventJoinMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CloseEventJoinMutation,
    unknown,
    CloseEventJoinMutationVariables
  >(
    buildCloseEventJoinOptions({
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
