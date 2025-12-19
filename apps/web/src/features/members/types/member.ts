/**
 * Member-related types for the members feature.
 */

import type {
  EventMemberRole,
  EventMemberStatus,
  CheckinMethod,
} from '@/lib/api/__generated__/react-query-update';

/**
 * Core member data structure matching GraphQL EventMember type
 */
export interface MemberData {
  id: string;
  eventId: string;
  userId: string;
  role: EventMemberRole;
  status: EventMemberStatus;
  joinedAt?: string | null;
  leftAt?: string | null;
  note?: string | null;
  rejectReason?: string | null;

  // Check-in fields
  isCheckedIn: boolean;
  checkinMethods: CheckinMethod[];
  lastCheckinAt?: string | null;
  memberCheckinToken?: string | null;
  checkinBlockedAll: boolean;
  checkinBlockedMethods: CheckinMethod[];
  lastCheckinRejectionReason?: string | null;
  lastCheckinRejectedAt?: string | null;

  // Relations
  user: MemberUser;
  addedBy?: MemberUser | null;
}

/**
 * Minimal user data for member display
 */
export interface MemberUser {
  id: string;
  name: string;
  avatarKey?: string | null;
  avatarBlurhash?: string | null;
  verifiedAt?: string | null;
  profile?: {
    displayName?: string | null;
  } | null;
}

/**
 * User's membership status for a specific event (computed from EventMember)
 */
export interface UserMembershipStatus {
  isOwner: boolean;
  isModerator: boolean;
  isJoined: boolean;
  isPending: boolean;
  isInvited: boolean;
  isRejected: boolean;
  isBanned: boolean;
  isWaitlisted: boolean;
  rejectReason: string | null;
  banReason: string | null;
  canSeeMembers?: boolean;
}

/**
 * Member statistics for an event
 */
export interface MemberStats {
  joined: number;
  pending: number;
  invited: number;
  rejected: number;
  banned: number;
  left: number;
  kicked: number;
}

/**
 * Capacity details for display
 */
export interface CapacityDetails {
  participants: string;
  capacityLabel: string;
  isFull: boolean;
  hasMin: boolean;
  minReached: boolean;
  percentage: number | null;
}

