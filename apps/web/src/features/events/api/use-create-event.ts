import {
  CreateEventDocument,
  CreateEventMutation,
  CreateEventMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';

export function buildCreateEventOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CreateEventMutation,
    unknown,
    CreateEventMutationVariables,
    TContext
  >
): UseMutationOptions<
  CreateEventMutation,
  unknown,
  CreateEventMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CreateEvent'] as QueryKey,
    mutationFn: async (variables: CreateEventMutationVariables) =>
      gqlClient.request<CreateEventMutation, CreateEventMutationVariables>(
        CreateEventDocument,
        variables
      ),
    meta: {
      successMessage: 'Event created successfully',
    },
    ...(options ?? {}),
  };
}

export function useCreateEventMutation(
  options?: UseMutationOptions<
    CreateEventMutation,
    unknown,
    CreateEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CreateEventMutation,
    unknown,
    CreateEventMutationVariables
  >(
    buildCreateEventOptions({
      onSuccess: (_data, _vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
      },
      ...(options ?? {}),
    })
  );
}
