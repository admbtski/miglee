/**
 * Type definitions for My Events page
 */

import type {
  EventMemberRole,
  EventMemberStatus,
  EventLifecycleStatus,
  GetMyEventsQuery_myEvents_EventMember,
} from '@/lib/api/__generated__/react-query-update';

/* ───────────────────────────── Card Data Types ───────────────────────────── */

export interface MyEventCardEvent {
  id: string;
  title: string;
  description?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  address?: string | null;
  joinedCount?: number | null;
  max?: number | null;
  coverKey?: string | null;
  coverBlurhash?: string | null;
  canceledAt?: string | null;
  deletedAt?: string | null;
}

export interface MyEventCardMembership {
  id: string;
  status: EventMemberStatus;
  role: EventMemberRole;
  joinedAt?: string | null;
  rejectReason?: string | null;
}

export interface MyEventCardData {
  event: MyEventCardEvent;
  membership: MyEventCardMembership;
}

export interface MyEventCardActions {
  onCancel?: (eventId: string) => void;
  onLeave?: (eventId: string) => void;
  onWithdraw?: (eventId: string) => void;
  onAcceptInvite?: (eventId: string) => void;
  onDeclineInvite?: (eventId: string) => void;
}

/* ───────────────────────────── Mappers ───────────────────────────── */

/**
 * Maps backend membership data to card display format
 */
export function mapMembershipToCardData(
  membership: GetMyEventsQuery_myEvents_EventMember
): MyEventCardData {
  return {
    event: {
      id: membership.event.id,
      title: membership.event.title,
      description: membership.event.description,
      startAt: membership.event.startAt,
      endAt: membership.event.endAt,
      address: membership.event.address,
      joinedCount: membership.event.joinedCount,
      max: membership.event.max,
      coverKey: membership.event.coverKey,
      coverBlurhash: membership.event.coverBlurhash,
      canceledAt: membership.event.canceledAt,
      deletedAt: membership.event.deletedAt,
    },
    membership: {
      id: membership.id,
      status: membership.status as EventMemberStatus,
      role: membership.role as EventMemberRole,
      joinedAt: membership.joinedAt,
      rejectReason: membership.rejectReason,
    },
  };
}

/**
 * Maps UI role filter value to backend EventMemberRole
 */
export function mapRoleFilterToBackend(
  roleFilter: string
): EventMemberRole | undefined {
  switch (roleFilter) {
    case 'owner':
      return 'OWNER' as EventMemberRole;
    case 'moderator':
      return 'MODERATOR' as EventMemberRole;
    case 'member':
      return 'PARTICIPANT' as EventMemberRole;
    default:
      return undefined;
  }
}

/**
 * Maps UI role filter value to backend EventMemberStatus
 */
export function mapRoleFilterToMembershipStatus(
  roleFilter: string
): EventMemberStatus | undefined {
  switch (roleFilter) {
    case 'pending':
      return 'PENDING' as EventMemberStatus;
    case 'invited':
      return 'INVITED' as EventMemberStatus;
    case 'rejected':
      return 'REJECTED' as EventMemberStatus;
    case 'banned':
      return 'BANNED' as EventMemberStatus;
    case 'waitlist':
      return 'WAITLIST' as EventMemberStatus;
    default:
      return undefined;
  }
}

/**
 * Maps UI status filters to backend EventLifecycleStatus array
 */
export function mapStatusFiltersToBackend(
  statusFilters: string[]
): EventLifecycleStatus[] {
  return statusFilters.map((s) => s.toUpperCase()) as EventLifecycleStatus[];
}

/* ───────────────────────────── Re-exports ───────────────────────────── */

export type { EventMemberRole, EventMemberStatus, EventLifecycleStatus };
