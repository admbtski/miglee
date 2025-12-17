import {
  DevLoginDocument,
  DevLoginMutation,
  DevLoginMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { authKeys } from './auth-query-keys';

export function buildDevLoginOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DevLoginMutation,
    unknown,
    DevLoginMutationVariables,
    TContext
  >
): UseMutationOptions<
  DevLoginMutation,
  unknown,
  DevLoginMutationVariables,
  TContext
> {
  return {
    mutationKey: ['DevLogin'] as QueryKey,
    mutationFn: async (variables: DevLoginMutationVariables) =>
      gqlClient.request<DevLoginMutation, DevLoginMutationVariables>(
        DevLoginDocument,
        variables
      ),
    meta: {
      successMessage: 'Logged in successfully',
    },
    ...(options ?? {}),
  };
}

export function useDevLoginMutation(
  options?: UseMutationOptions<
    DevLoginMutation,
    unknown,
    DevLoginMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<DevLoginMutation, unknown, DevLoginMutationVariables>(
    buildDevLoginOptions({
      onSuccess: async (data, vars, r, ctx) => {
        await qc.invalidateQueries({
          queryKey: authKeys.me() as unknown as QueryKey,
        });
        options?.onSuccess?.(data, vars, r, ctx);
      },
      ...(options ?? {}),
    })
  );
}
