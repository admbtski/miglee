import {
  AdminUserAuditLogsDocument,
  AdminUserAuditLogsQuery,
  AdminUserAuditLogsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';

export const ADMIN_USER_AUDIT_LOGS_KEY = 'AdminUserAuditLogs';

export function buildAdminUserAuditLogsOptions(
  variables: AdminUserAuditLogsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      AdminUserAuditLogsQuery,
      unknown,
      AdminUserAuditLogsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  AdminUserAuditLogsQuery,
  unknown,
  AdminUserAuditLogsQuery,
  QueryKey
> {
  return {
    queryKey: [ADMIN_USER_AUDIT_LOGS_KEY, variables] as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        AdminUserAuditLogsQuery,
        AdminUserAuditLogsQueryVariables
      >(AdminUserAuditLogsDocument, variables),
    ...options,
  };
}

export function useAdminUserAuditLogsQuery(
  variables: AdminUserAuditLogsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      AdminUserAuditLogsQuery,
      unknown,
      AdminUserAuditLogsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<AdminUserAuditLogsQuery, unknown, AdminUserAuditLogsQuery>(
    buildAdminUserAuditLogsOptions(variables, options)
  );
}

