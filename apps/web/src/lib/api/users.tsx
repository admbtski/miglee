import {
  GetUserDocument,
  GetUserQuery,
  GetUserQueryVariables,
  GetUsersDocument,
  GetUsersQuery,
  GetUsersQueryVariables,
  AdminUpdateUserDocument,
  AdminUpdateUserMutation,
  AdminUpdateUserMutationVariables,
  AdminDeleteUserDocument,
  AdminDeleteUserMutation,
  AdminDeleteUserMutationVariables,
  AdminInviteUserDocument,
  AdminInviteUserMutation,
  AdminInviteUserMutationVariables,
  AdminCreateUserDocument,
  AdminCreateUserMutation,
  AdminCreateUserMutationVariables,
  AdminSuspendUserDocument,
  AdminSuspendUserMutation,
  AdminSuspendUserMutationVariables,
  AdminUnsuspendUserDocument,
  AdminUnsuspendUserMutation,
  AdminUnsuspendUserMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useQuery,
  UseQueryOptions,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';

/* ======================== Keys ======================== */

export const GET_USERS_LIST_KEY = (variables?: GetUsersQueryVariables) =>
  variables ? (['GetUsers', variables] as const) : (['GetUsers'] as const);

export const GET_USER_ONE_KEY = (variables: GetUserQueryVariables) =>
  ['GetUser', variables] as const;

/* ===================== Query builders ===================== */

export function buildGetUsersOptions(
  variables?: GetUsersQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUsersQuery, unknown, GetUsersQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetUsersQuery, unknown, GetUsersQuery, QueryKey> {
  return {
    queryKey: GET_USERS_LIST_KEY(variables) as unknown as QueryKey,
    queryFn: () =>
      variables
        ? gqlClient.request<GetUsersQuery, GetUsersQueryVariables>(
            GetUsersDocument,
            variables
          )
        : gqlClient.request<GetUsersQuery>(GetUsersDocument),
    ...(options ?? {}),
  };
}

export function buildGetUserOptions(
  variables: GetUserQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUserQuery, unknown, GetUserQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetUserQuery, unknown, GetUserQuery, QueryKey> {
  return {
    queryKey: GET_USER_ONE_KEY(variables) as unknown as QueryKey,
    queryFn: () =>
      gqlClient.request<GetUserQuery, GetUserQueryVariables>(
        GetUserDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

/* ========================= Hooks ========================= */

export function useUsersQuery(
  variables?: GetUsersQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUsersQuery, unknown, GetUsersQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetUsersOptions(variables, options));
}

export function useUserQuery(
  variables: GetUserQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUserQuery, unknown, GetUserQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetUserOptions(variables, {
      enabled: !!variables.id,
      ...(options ?? {}),
    })
  );
}

/* ==================== Mutation Builders ==================== */

export function buildAdminUpdateUserOptions<TContext = unknown>(
  options?: UseMutationOptions<
    AdminUpdateUserMutation,
    unknown,
    AdminUpdateUserMutationVariables,
    TContext
  >
): UseMutationOptions<
  AdminUpdateUserMutation,
  unknown,
  AdminUpdateUserMutationVariables,
  TContext
> {
  return {
    mutationKey: ['AdminUpdateUser'] as QueryKey,
    mutationFn: async (variables: AdminUpdateUserMutationVariables) =>
      gqlClient.request<
        AdminUpdateUserMutation,
        AdminUpdateUserMutationVariables
      >(AdminUpdateUserDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminDeleteUserOptions<TContext = unknown>(
  options?: UseMutationOptions<
    AdminDeleteUserMutation,
    unknown,
    AdminDeleteUserMutationVariables,
    TContext
  >
): UseMutationOptions<
  AdminDeleteUserMutation,
  unknown,
  AdminDeleteUserMutationVariables,
  TContext
> {
  return {
    mutationKey: ['AdminDeleteUser'] as QueryKey,
    mutationFn: async (variables: AdminDeleteUserMutationVariables) =>
      gqlClient.request<
        AdminDeleteUserMutation,
        AdminDeleteUserMutationVariables
      >(AdminDeleteUserDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminInviteUserOptions<TContext = unknown>(
  options?: UseMutationOptions<
    AdminInviteUserMutation,
    unknown,
    AdminInviteUserMutationVariables,
    TContext
  >
): UseMutationOptions<
  AdminInviteUserMutation,
  unknown,
  AdminInviteUserMutationVariables,
  TContext
> {
  return {
    mutationKey: ['AdminInviteUser'] as QueryKey,
    mutationFn: async (variables: AdminInviteUserMutationVariables) =>
      gqlClient.request<
        AdminInviteUserMutation,
        AdminInviteUserMutationVariables
      >(AdminInviteUserDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminCreateUserOptions<TContext = unknown>(
  options?: UseMutationOptions<
    AdminCreateUserMutation,
    unknown,
    AdminCreateUserMutationVariables,
    TContext
  >
): UseMutationOptions<
  AdminCreateUserMutation,
  unknown,
  AdminCreateUserMutationVariables,
  TContext
> {
  return {
    mutationKey: ['AdminCreateUser'] as QueryKey,
    mutationFn: async (variables: AdminCreateUserMutationVariables) =>
      gqlClient.request<
        AdminCreateUserMutation,
        AdminCreateUserMutationVariables
      >(AdminCreateUserDocument, variables),
    ...(options ?? {}),
  };
}

/* ====================== Mutation Hooks ====================== */

export function useAdminUpdateUserMutation(
  options?: UseMutationOptions<
    AdminUpdateUserMutation,
    unknown,
    AdminUpdateUserMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminUpdateUserMutation,
    unknown,
    AdminUpdateUserMutationVariables
  >(
    buildAdminUpdateUserOptions({
      onSuccess: (_data, vars) => {
        // Invalidate users list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetUsers',
        });
        // Invalidate specific user
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_USER_ONE_KEY({ id: vars.id }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function useAdminDeleteUserMutation(
  options?: UseMutationOptions<
    AdminDeleteUserMutation,
    unknown,
    AdminDeleteUserMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminDeleteUserMutation,
    unknown,
    AdminDeleteUserMutationVariables
  >(
    buildAdminDeleteUserOptions({
      onSuccess: (_data, vars) => {
        // Invalidate users list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetUsers',
        });
        // Remove specific user from cache
        if (vars.id) {
          qc.removeQueries({
            queryKey: GET_USER_ONE_KEY({ id: vars.id }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function useAdminInviteUserMutation(
  options?: UseMutationOptions<
    AdminInviteUserMutation,
    unknown,
    AdminInviteUserMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminInviteUserMutation,
    unknown,
    AdminInviteUserMutationVariables
  >(
    buildAdminInviteUserOptions({
      onSuccess: () => {
        // Invalidate users list to show new user
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetUsers',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useAdminCreateUserMutation(
  options?: UseMutationOptions<
    AdminCreateUserMutation,
    unknown,
    AdminCreateUserMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminCreateUserMutation,
    unknown,
    AdminCreateUserMutationVariables
  >(
    buildAdminCreateUserOptions({
      onSuccess: () => {
        // Invalidate users list to show new user
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetUsers',
        });
      },
      ...(options ?? {}),
    })
  );
}

// ============================================================================
// Admin Suspend User
// ============================================================================

export function buildAdminSuspendUserOptions(
  options?: UseMutationOptions<
    AdminSuspendUserMutation,
    unknown,
    AdminSuspendUserMutationVariables
  >
): UseMutationOptions<
  AdminSuspendUserMutation,
  unknown,
  AdminSuspendUserMutationVariables
> {
  return {
    mutationFn: (variables: AdminSuspendUserMutationVariables) =>
      gqlClient.request<
        AdminSuspendUserMutation,
        AdminSuspendUserMutationVariables
      >(AdminSuspendUserDocument, variables),
    ...(options ?? {}),
  };
}

export function useAdminSuspendUserMutation(
  options?: UseMutationOptions<
    AdminSuspendUserMutation,
    unknown,
    AdminSuspendUserMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminSuspendUserMutation,
    unknown,
    AdminSuspendUserMutationVariables
  >(
    buildAdminSuspendUserOptions({
      onSuccess: (_data, variables) => {
        // Invalidate user detail query
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetUser' &&
            (q.queryKey[1] as any)?.id === variables.id,
        });
        // Invalidate users list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetUsers',
        });
      },
      ...(options ?? {}),
    })
  );
}

// ============================================================================
// Admin Unsuspend User
// ============================================================================

export function buildAdminUnsuspendUserOptions(
  options?: UseMutationOptions<
    AdminUnsuspendUserMutation,
    unknown,
    AdminUnsuspendUserMutationVariables
  >
): UseMutationOptions<
  AdminUnsuspendUserMutation,
  unknown,
  AdminUnsuspendUserMutationVariables
> {
  return {
    mutationFn: (variables: AdminUnsuspendUserMutationVariables) =>
      gqlClient.request<
        AdminUnsuspendUserMutation,
        AdminUnsuspendUserMutationVariables
      >(AdminUnsuspendUserDocument, variables),
    ...(options ?? {}),
  };
}

export function useAdminUnsuspendUserMutation(
  options?: UseMutationOptions<
    AdminUnsuspendUserMutation,
    unknown,
    AdminUnsuspendUserMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminUnsuspendUserMutation,
    unknown,
    AdminUnsuspendUserMutationVariables
  >(
    buildAdminUnsuspendUserOptions({
      onSuccess: (_data, variables) => {
        // Invalidate user detail query
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetUser' &&
            (q.queryKey[1] as any)?.id === variables.id,
        });
        // Invalidate users list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetUsers',
        });
      },
      ...(options ?? {}),
    })
  );
}
