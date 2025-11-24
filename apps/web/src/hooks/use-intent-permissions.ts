/**
 * Hook to check user permissions for intent management
 * Uses the intentPermissions GraphQL query to get permission flags
 */

import { useIntentPermissionsQuery } from '@/lib/api/intent-permissions';

export interface IntentPermissions {
  /** User can access management interface */
  canManage: boolean;
  /** User is the owner of the intent */
  isOwner: boolean;
  /** User is a moderator of the intent */
  isModerator: boolean;
  /** User is a participant */
  isParticipant: boolean;
  /** User is app-level admin */
  isAppAdmin: boolean;
  /** User is app-level moderator */
  isAppModerator: boolean;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Hook to check if user has management permissions for an intent
 * Management access is granted to:
 * - Intent owner
 * - Intent moderators
 * - App admins
 * - App moderators
 */
export function useIntentPermissions(
  intentId: string | null | undefined
): IntentPermissions {
  const { data, isLoading } = useIntentPermissionsQuery(intentId ?? '', {
    enabled: !!intentId,
  });

  if (isLoading || !intentId) {
    return {
      canManage: false,
      isOwner: false,
      isModerator: false,
      isParticipant: false,
      isAppAdmin: false,
      isAppModerator: false,
      isLoading: isLoading,
    };
  }

  const permissions = data?.intentPermissions;

  if (!permissions) {
    return {
      canManage: false,
      isOwner: false,
      isModerator: false,
      isParticipant: false,
      isAppAdmin: false,
      isAppModerator: false,
      isLoading: false,
    };
  }

  return {
    canManage: permissions.canManage,
    isOwner: permissions.isOwner,
    isModerator: permissions.isModerator,
    isParticipant: permissions.isParticipant,
    isAppAdmin: permissions.isAppAdmin,
    isAppModerator: permissions.isAppModerator,
    isLoading: false,
  };
}
