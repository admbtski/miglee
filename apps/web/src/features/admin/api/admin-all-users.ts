import {
  AdminUsersDocument,
  AdminUsersQuery,
  AdminUsersQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

export const ADMIN_USERS_KEY = 'AdminUsers';

export function buildAdminUsersOptions(
  variables: AdminUsersQueryVariables,
  options?: Omit<
    UseQueryOptions<AdminUsersQuery, unknown, AdminUsersQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<AdminUsersQuery, unknown, AdminUsersQuery, QueryKey> {
  return {
    queryKey: [ADMIN_USERS_KEY, variables] as QueryKey,
    queryFn: async () =>
      gqlClient.request<AdminUsersQuery, AdminUsersQueryVariables>(
        AdminUsersDocument,
        variables
      ),
    ...options,
  };
}

export function useAdminUsersQuery(
  variables: AdminUsersQueryVariables,
  options?: Omit<
    UseQueryOptions<AdminUsersQuery, unknown, AdminUsersQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<AdminUsersQuery, unknown, AdminUsersQuery, QueryKey>(
    buildAdminUsersOptions(variables, options)
  );
}
