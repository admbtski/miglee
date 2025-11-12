// apps/web/src/graphql/react-query/auth.ts
import {
  DevLoginDocument,
  DevLoginMutation,
  DevLoginMutationVariables,
  DevLogoutDocument,
  DevLogoutMutation,
  GetMeDocument,
  GetMeQuery,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';

/* --------------------------------- KEYS ---------------------------------- */

export const GET_ME_KEY = () => ['Me'] as const;

/* -------------------------------- QUERIES -------------------------------- */

export function buildMeOptions(
  options?: Omit<
    UseQueryOptions<GetMeQuery, unknown, GetMeQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetMeQuery, unknown, GetMeQuery, QueryKey> {
  return {
    queryKey: GET_ME_KEY() as QueryKey,
    queryFn: async () => {
      return await gqlClient.request<GetMeQuery>(GetMeDocument);
    },
    ...(options ?? {}),
  };
}

export function useMeQuery(
  options?: Omit<
    UseQueryOptions<GetMeQuery, unknown, GetMeQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildMeOptions(options));
}

/* ------------------------------- MUTATIONS ------------------------------- */

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
          queryKey: GET_ME_KEY() as unknown as QueryKey,
        });
        options?.onSuccess?.(data, vars, r, ctx);
      },
      ...(options ?? {}),
    })
  );
}

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
          queryKey: GET_ME_KEY() as QueryKey,
        });
        options?.onSuccess?.(data, vars, r, ctx);
      },
      ...(options ?? {}),
    })
  );
}
