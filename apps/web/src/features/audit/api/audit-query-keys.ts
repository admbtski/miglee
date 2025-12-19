/**
 * Audit Query Keys
 *
 * Centralized query key factories for audit-related queries.
 */

import type { AuditLogsFilter } from '../types';

export interface GetEventAuditLogsVariables {
  eventId: string;
  filter?: AuditLogsFilter;
  limit?: number;
}

export const GET_EVENT_AUDIT_LOGS_KEY = (
  variables: GetEventAuditLogsVariables
) => ['GetEventAuditLogs', variables] as const;

export const GET_EVENT_AUDIT_LOGS_INFINITE_KEY = (
  variables: Omit<GetEventAuditLogsVariables, 'cursor'>
) => ['GetEventAuditLogsInfinite', variables] as const;

