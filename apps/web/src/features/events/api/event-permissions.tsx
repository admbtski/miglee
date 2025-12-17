/**
 * Event Permissions API
 * Provides hooks and utilities for checking user permissions on events
 */

import { gqlClient } from '@/lib/api/client';
import type {
  GetEventPermissionsQuery,
  GetEventPermissionsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { GetEventPermissionsDocument } from '@/lib/api/__generated__/react-query-update';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

/* -------------------------------- TYPES ---------------------------------- */

// EventPermissions type is now exported from hooks/use-event-permissions.ts
// to avoid circular dependency issues

/* ----------------------------- QUERY KEYS -------------------------------- */

export const GET_EVENT_PERMISSIONS_KEY = (eventId: string) =>
  ['GetEventPermissions', eventId] as const;

/* ----------------------------- QUERY BUILDER ----------------------------- */

export function buildGetEventPermissionsOptions(
  eventId: string,
  options?: Omit<
    UseQueryOptions<
      GetEventPermissionsQuery,
      Error,
      GetEventPermissionsQuery,
      ReturnType<typeof GET_EVENT_PERMISSIONS_KEY>
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetEventPermissionsQuery,
  Error,
  GetEventPermissionsQuery,
  ReturnType<typeof GET_EVENT_PERMISSIONS_KEY>
> {
  return {
    queryKey: GET_EVENT_PERMISSIONS_KEY(eventId),
    queryFn: async () =>
      gqlClient.request<
        GetEventPermissionsQuery,
        GetEventPermissionsQueryVariables
      >(GetEventPermissionsDocument, { eventId }),
    ...options,
  };
}

/* ------------------------------- HOOKS ----------------------------------- */

/**
 * Hook to fetch user permissions for a specific event
 * Returns permission flags for the current authenticated user
 */
export function useEventPermissionsQuery(
  eventId: string,
  options?: Omit<
    UseQueryOptions<
      GetEventPermissionsQuery,
      Error,
      GetEventPermissionsQuery,
      ReturnType<typeof GET_EVENT_PERMISSIONS_KEY>
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventPermissionsOptions(eventId, options));
}
