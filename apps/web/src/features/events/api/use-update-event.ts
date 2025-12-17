import {
  UpdateEventDocument,
  UpdateEventMutation,
  UpdateEventMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GET_EVENT_DETAIL_KEY } from './events-query-keys';

export function buildUpdateEventOptions<TContext = unknown>(
  options?: UseMutationOptions<
    UpdateEventMutation,
    unknown,
    UpdateEventMutationVariables,
    TContext
  >
): UseMutationOptions<
  UpdateEventMutation,
  unknown,
  UpdateEventMutationVariables,
  TContext
> {
  return {
    mutationKey: ['UpdateEvent'] as QueryKey,
    mutationFn: async (variables: UpdateEventMutationVariables) =>
      gqlClient.request<UpdateEventMutation, UpdateEventMutationVariables>(
        UpdateEventDocument,
        variables
      ),
    meta: {
      successMessage: 'Event updated successfully',
    },
    ...(options ?? {}),
  };
}

export function useUpdateEventMutation(
  options?: UseMutationOptions<
    UpdateEventMutation,
    unknown,
    UpdateEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UpdateEventMutation,
    unknown,
    UpdateEventMutationVariables
  >(
    buildUpdateEventOptions({
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
