/**
 * Event Audit Logs Hook
 *
 * Fetches audit logs for an event with filtering and cursor-based pagination.
 */

import { gqlClient } from '@/lib/api/client';
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import type { AuditLogItem } from '../types';
import {
  GET_EVENT_AUDIT_LOGS_INFINITE_KEY,
  type GetEventAuditLogsVariables,
} from './audit-query-keys';

// GraphQL query document
// TODO: Replace with generated document after running codegen
const GetEventAuditLogsDocument = /* GraphQL */ `
  query GetEventAuditLogs(
    $eventId: ID!
    $scope: [AuditScope!]
    $action: [AuditAction!]
    $actorId: ID
    $from: DateTime
    $to: DateTime
    $limit: Int
    $cursor: ID
  ) {
    eventAuditLogs(
      eventId: $eventId
      scope: $scope
      action: $action
      actorId: $actorId
      from: $from
      to: $to
      limit: $limit
      cursor: $cursor
    ) {
      items {
        id
        eventId
        scope
        action
        entityType
        entityId
        actorType
        actorId
        actorRole
        diff
        meta
        severity
        createdAt
        actor {
          id
          name
          avatarKey
        }
      }
      pageInfo {
        total
        limit
        offset
        hasNext
        hasPrev
      }
    }
  }
`;

// Response types
// TODO: Replace with generated types after running codegen
interface GetEventAuditLogsQuery {
  eventAuditLogs: {
    items: AuditLogItem[];
    pageInfo: {
      total: number;
      limit: number;
      offset: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface GetEventAuditLogsQueryVariables {
  eventId: string;
  scope?: string[];
  action?: string[];
  actorId?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

// Type alias for cursor-based pagination
type CursorPageParam = string | undefined;

/**
 * Build query options for event audit logs (infinite query)
 *
 * Can be used for prefetching or direct use with useInfiniteQuery
 */
export function buildGetEventAuditLogsInfiniteOptions(
  variables: GetEventAuditLogsVariables,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetEventAuditLogsQuery,
      Error,
      InfiniteData<GetEventAuditLogsQuery>,
      QueryKey,
      CursorPageParam
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
): UseInfiniteQueryOptions<
  GetEventAuditLogsQuery,
  Error,
  InfiniteData<GetEventAuditLogsQuery>,
  QueryKey,
  CursorPageParam
> {
  const { eventId, filter, limit = 25 } = variables;

  return {
    queryKey: GET_EVENT_AUDIT_LOGS_INFINITE_KEY(
      variables
    ) as unknown as QueryKey,
    initialPageParam: undefined as CursorPageParam,
    queryFn: async ({ pageParam }: { pageParam: CursorPageParam }) => {
      const queryVariables: GetEventAuditLogsQueryVariables = {
        eventId,
        scope: filter?.scope,
        action: filter?.action,
        actorId: filter?.actorId,
        from: filter?.from,
        to: filter?.to,
        limit,
        cursor: pageParam,
      };

      return gqlClient.request<
        GetEventAuditLogsQuery,
        GetEventAuditLogsQueryVariables
      >(GetEventAuditLogsDocument, queryVariables);
    },
    getNextPageParam: (lastPage: GetEventAuditLogsQuery): CursorPageParam => {
      const { items, pageInfo } = lastPage.eventAuditLogs;

      if (!pageInfo.hasNext || items.length === 0) {
        return undefined;
      }

      // Use the last item's ID as cursor for next page
      return items[items.length - 1]?.id;
    },
    ...(options ?? {}),
  };
}

/**
 * Hook to fetch event audit logs with infinite scrolling
 */
export function useEventAuditLogs(
  variables: GetEventAuditLogsVariables,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetEventAuditLogsQuery,
      Error,
      InfiniteData<GetEventAuditLogsQuery>,
      QueryKey,
      CursorPageParam
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  return useInfiniteQuery<
    GetEventAuditLogsQuery,
    Error,
    InfiniteData<GetEventAuditLogsQuery>,
    QueryKey,
    CursorPageParam
  >(
    buildGetEventAuditLogsInfiniteOptions(variables, {
      enabled: !!variables.eventId,
      ...(options ?? {}),
    })
  );
}

// Re-export query key for external use (e.g., invalidation)
export { GET_EVENT_AUDIT_LOGS_INFINITE_KEY };
