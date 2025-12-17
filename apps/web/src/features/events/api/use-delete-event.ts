import {
  DeleteEventDocument,
  DeleteEventMutation,
  DeleteEventMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GET_EVENT_DETAIL_KEY } from './events-query-keys';

export function buildDeleteEventOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DeleteEventMutation,
    unknown,
    DeleteEventMutationVariables,
    TContext
  >
): UseMutationOptions<
  DeleteEventMutation,
  unknown,
  DeleteEventMutationVariables,
  TContext
> {
  return {
    mutationKey: ['DeleteEvent'] as QueryKey,
    mutationFn: async (variables: DeleteEventMutationVariables) =>
      gqlClient.request<DeleteEventMutation, DeleteEventMutationVariables>(
        DeleteEventDocument,
        variables
      ),
    meta: {
      successMessage: 'Event deleted successfully',
    },
    ...(options ?? {}),
  };
}

export function useDeleteEventMutation(
  options?: UseMutationOptions<
    DeleteEventMutation,
    unknown,
    DeleteEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    DeleteEventMutation,
    unknown,
    DeleteEventMutationVariables
  >(
    buildDeleteEventOptions({
      onSuccess: (_data, vars) => {
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
