/**
 * Hook to check user permissions for event management
 * Uses the eventPermissions GraphQL query to get permission flags
 */

import { useEventPermissionsQuery } from '../api/use-event-permissions';
import type { GetEventPermissionsQuery_Query } from '@/lib/api/__generated__/react-query-update';

export type EventPermissions = NonNullable<
  GetEventPermissionsQuery_Query['eventPermissions']
> & {
  isLoading: boolean;
};

/**
 * Hook to check if user has management permissions for an event
 * Management access is granted to:
 * - Event owner
 * - Event moderators
 * - App admins
 * - App moderators
 */
export function useEventPermissions(
  eventId: string | null | undefined
): EventPermissions {
  const { data, isLoading } = useEventPermissionsQuery(eventId ?? '', {
    enabled: !!eventId,
  });

  if (isLoading || !eventId) {
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

  const permissions = data?.eventPermissions;

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
