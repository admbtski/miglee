/**
 * Hook for manually archiving audit logs
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlClient } from '@/lib/api/client';
import {
  ArchiveEventAuditLogsDocument,
  ArchiveEventAuditLogsMutation,
  ArchiveEventAuditLogsMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { GET_EVENT_AUDIT_LOGS_INFINITE_KEY } from './use-event-audit-logs';

interface UseArchiveAuditLogsOptions {
  eventId: string;
  onSuccess?: (data: ArchiveEventAuditLogsMutation['archiveEventAuditLogs']) => void;
  onError?: (error: Error) => void;
}

export function useArchiveAuditLogs({
  eventId,
  onSuccess,
  onError,
}: UseArchiveAuditLogsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const variables: ArchiveEventAuditLogsMutationVariables = {
        eventId,
      };

      const response = await gqlClient.request<
        ArchiveEventAuditLogsMutation,
        ArchiveEventAuditLogsMutationVariables
      >(ArchiveEventAuditLogsDocument, variables);

      return response.archiveEventAuditLogs;
    },
    onSuccess: (data) => {
      // Invalidate audit logs query to refresh the list (will be empty after archiving)
      queryClient.invalidateQueries({
        queryKey: GET_EVENT_AUDIT_LOGS_INFINITE_KEY({ eventId }),
      });
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      console.error('Failed to archive audit logs:', error);
      onError?.(error);
    },
  });
}

