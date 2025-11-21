/**
 * Hook to check user permissions for intent management
 * Determines if user can access management interface
 */

import { useMeQuery } from '@/lib/api/auth';
import type { GetIntentQuery } from '@/lib/api/__generated__/react-query-update';

type IntentData = GetIntentQuery['intent'];

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
  intent: IntentData | null | undefined
): IntentPermissions {
  const { data: authData, isLoading: isLoadingAuth } = useMeQuery();
  const user = authData?.me;

  if (isLoadingAuth || !intent) {
    return {
      canManage: false,
      isOwner: false,
      isModerator: false,
      isParticipant: false,
      isAppAdmin: false,
      isAppModerator: false,
      isLoading: isLoadingAuth,
    };
  }

  if (!user) {
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

  const membership = intent.userMembership;
  const isOwner = membership?.isOwner ?? false;
  const isModerator = membership?.isModerator ?? false;
  const isParticipant = membership?.isParticipant ?? false;

  // Check app-level permissions
  const isAppAdmin = user.role === 'ADMIN';
  const isAppModerator = user.role === 'MODERATOR';

  // User can manage if they are:
  // - Owner or moderator of the intent
  // - App admin or moderator
  const canManage = isOwner || isModerator || isAppAdmin || isAppModerator;

  return {
    canManage,
    isOwner,
    isModerator,
    isParticipant,
    isAppAdmin,
    isAppModerator,
    isLoading: false,
  };
}
