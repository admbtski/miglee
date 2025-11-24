/**
 * Intent Permissions API
 * Provides hooks and utilities for checking user permissions on intents
 */

import { gqlClient } from './client';
import type {
  GetIntentPermissionsQuery,
  GetIntentPermissionsQueryVariables,
} from './__generated__/react-query-update';
import { GetIntentPermissionsDocument } from './__generated__/react-query-update';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

/* -------------------------------- TYPES ---------------------------------- */

export interface IntentPermissions {
  /** User is the owner of the intent */
  isOwner: boolean;
  /** User is a moderator of the intent */
  isModerator: boolean;
  /** User is a participant (joined member) */
  isParticipant: boolean;
  /** User is an app-level admin */
  isAppAdmin: boolean;
  /** User is an app-level moderator */
  isAppModerator: boolean;
  /** User can access management interface */
  canManage: boolean;
}

/* ----------------------------- QUERY KEYS -------------------------------- */

export const GET_INTENT_PERMISSIONS_KEY = (intentId: string) =>
  ['GetIntentPermissions', intentId] as const;

/* ----------------------------- QUERY BUILDER ----------------------------- */

export function buildGetIntentPermissionsOptions(
  intentId: string,
  options?: Omit<
    UseQueryOptions<
      GetIntentPermissionsQuery,
      Error,
      GetIntentPermissionsQuery,
      ReturnType<typeof GET_INTENT_PERMISSIONS_KEY>
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetIntentPermissionsQuery,
  Error,
  GetIntentPermissionsQuery,
  ReturnType<typeof GET_INTENT_PERMISSIONS_KEY>
> {
  return {
    queryKey: GET_INTENT_PERMISSIONS_KEY(intentId),
    queryFn: async () =>
      gqlClient.request<
        GetIntentPermissionsQuery,
        GetIntentPermissionsQueryVariables
      >(GetIntentPermissionsDocument, { intentId }),
    ...options,
  };
}

/* ------------------------------- HOOKS ----------------------------------- */

/**
 * Hook to fetch user permissions for a specific intent
 * Returns permission flags for the current authenticated user
 */
export function useIntentPermissionsQuery(
  intentId: string,
  options?: Omit<
    UseQueryOptions<
      GetIntentPermissionsQuery,
      Error,
      GetIntentPermissionsQuery,
      ReturnType<typeof GET_INTENT_PERMISSIONS_KEY>
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetIntentPermissionsOptions(intentId, options));
}
