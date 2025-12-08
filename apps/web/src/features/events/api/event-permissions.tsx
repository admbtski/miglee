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

export interface EventPermissions {
  /** User is the owner of the event */
  isOwner: boolean;
  /** User is a moderator of the event */
  isModerator: boolean;
  /** User is a participant (joined member) */
  isParticipant: boolean;
  /** User is an app-level admin */
  isAppAdmin: boolean;
  /** User is an app-level moderator */
  isAppModerator: boolean;
  /** User can access management interface */
  canManage: boolean;
  /** Loading state */
  isLoading: boolean;
}

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
