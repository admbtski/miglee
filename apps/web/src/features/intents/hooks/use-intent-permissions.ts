/**
 * Hook to check user permissions for intent management
 * Uses the intentPermissions GraphQL query to get permission flags
 */

import {
  useIntentPermissionsQuery,
  type IntentPermissions,
} from '@/features/intents/api/intent-permissions';

export type { IntentPermissions };

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
