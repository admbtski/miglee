import {
  CancelEventDocument,
  CancelEventMutation,
  CancelEventMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GET_EVENT_DETAIL_KEY } from './events-query-keys';

export function buildCancelEventOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CancelEventMutation,
    unknown,
    CancelEventMutationVariables,
    TContext
  >
): UseMutationOptions<
  CancelEventMutation,
  unknown,
  CancelEventMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CancelEvent'] as QueryKey,
    mutationFn: async (variables: CancelEventMutationVariables) =>
      gqlClient.request<CancelEventMutation, CancelEventMutationVariables>(
        CancelEventDocument,
        variables
      ),
    meta: {
      successMessage: 'Event cancelled successfully',
    },
    ...(options ?? {}),
  };
}

export function useCancelEventMutation(
  options?: UseMutationOptions<
    CancelEventMutation,
    unknown,
    CancelEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CancelEventMutation,
    unknown,
    CancelEventMutationVariables
  >(
    buildCancelEventOptions({
      onSuccess: (_data, vars) => {
        // odśwież listy i szczegół
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
