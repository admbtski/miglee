/**
 * Export Audit Logs Hook
 *
 * Fetches audit logs for export as JSON.
 */

import { gqlClient } from '@/lib/api/client';
import { useMutation } from '@tanstack/react-query';
import type { AuditLogsFilter } from '../types';

// GraphQL query document
const ExportEventAuditLogsDocument = /* GraphQL */ `
  query ExportEventAuditLogs(
    $eventId: ID!
    $scope: [AuditScope!]
    $action: [AuditAction!]
    $from: DateTime
    $to: DateTime
    $limit: Int
  ) {
    exportEventAuditLogs(
      eventId: $eventId
      scope: $scope
      action: $action
      from: $from
      to: $to
      limit: $limit
    ) {
      count
      eventId
      eventTitle
      exportedAt
      data
    }
  }
`;

interface ExportAuditLogsResult {
  exportEventAuditLogs: {
    count: number;
    eventId: string;
    eventTitle: string;
    exportedAt: string;
    data: string;
  };
}

interface ExportEventAuditLogsVariables {
  eventId: string;
  scope?: string[];
  action?: string[];
  from?: string;
  to?: string;
  limit?: number;
}

interface UseExportAuditLogsOptions {
  eventId: string;
  filter?: AuditLogsFilter;
}

/**
 * Hook to export audit logs as JSON
 *
 * Returns a mutation that triggers the export and downloads the file
 */
export function useExportAuditLogs({ eventId, filter }: UseExportAuditLogsOptions) {
  return useMutation({
    mutationFn: async () => {
      const variables: ExportEventAuditLogsVariables = {
        eventId,
        scope: filter?.scope,
        action: filter?.action,
        from: filter?.from,
        to: filter?.to,
        limit: 10000,
      };

      const response = await gqlClient.request<ExportAuditLogsResult>(
        ExportEventAuditLogsDocument,
        variables
      );

      return response.exportEventAuditLogs;
    },
    onSuccess: (data) => {
      // Create and download the JSON file
      const blob = new Blob([data.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${data.eventId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}

