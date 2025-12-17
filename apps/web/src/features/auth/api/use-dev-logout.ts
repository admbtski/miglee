import {
  DevLogoutDocument,
  DevLogoutMutation,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { authKeys } from './auth-query-keys';

export function buildDevLogoutOptions<TContext = unknown>(
  options?: UseMutationOptions<DevLogoutMutation, unknown, void, TContext>
): UseMutationOptions<DevLogoutMutation, unknown, void, TContext> {
  return {
    mutationKey: ['DevLogout'] as QueryKey,
    mutationFn: async () =>
      gqlClient.request<DevLogoutMutation>(DevLogoutDocument),
    meta: {
      successMessage: 'Logged out successfully',
    },
    ...(options ?? {}),
  };
}

export function useDevLogoutMutation(
  options?: UseMutationOptions<DevLogoutMutation, unknown, void>
) {
  const qc = getQueryClient();
  return useMutation<DevLogoutMutation, unknown, void>(
    buildDevLogoutOptions({
      onSuccess: async (data, vars, r, ctx) => {
        await qc.invalidateQueries({
          queryKey: authKeys.me() as QueryKey,
        });
        options?.onSuccess?.(data, vars, r, ctx);
      },
      ...(options ?? {}),
    })
  );
}
