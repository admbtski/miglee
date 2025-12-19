/**
 * Members API - Query and Mutation Hooks
 *
 * This module exports all React Query hooks for membership operations:
 * - Query hooks for fetching member data
 * - Mutation hooks for membership actions (join, leave, invite, moderate)
 */

// Query Keys
export { membersQueryKeys } from './members-query-keys';

// Helper functions
export {
  invalidateMembers,
  invalidateMyMemberships,
  invalidateEventListings,
  invalidateMembershipChange,
} from './members-api-helpers';

// Query Hooks
export {
  useEventMembersQuery,
  buildGetEventMembersOptions,
  GET_EVENT_MEMBERS_KEY,
} from './use-event-members';

export {
  useEventMemberQuery,
  buildGetEventMemberOptions,
  GET_EVENT_MEMBER_KEY,
} from './use-event-member';

export {
  useEventMemberStatsQuery,
  buildGetEventMemberStatsOptions,
  GET_EVENT_MEMBER_STATS_KEY,
} from './use-event-member-stats';

export {
  useMyMembershipForEventQuery,
  buildGetMyMembershipForEventOptions,
  GET_MY_MEMBERSHIP_FOR_EVENT_KEY,
} from './use-my-membership-for-event';

export {
  useMyMembershipsQuery,
  buildGetMyMembershipsOptions,
  GET_MY_MEMBERSHIPS_KEY,
} from './use-my-memberships';

export { useMyEventsQuery, GET_MY_EVENTS_KEY } from './use-my-events';

// User Action Mutations
export {
  useRequestJoinEventMutation,
  buildRequestJoinEventOptions,
} from './use-request-join-event';

export {
  useCancelJoinRequestMutation,
  buildCancelJoinRequestOptions,
} from './use-cancel-join-request';

export { useAcceptInviteMutation } from './use-accept-invite';

export {
  useLeaveEventMutation,
  buildLeaveEventOptions,
} from './use-leave-event';

// Waitlist Mutations
export {
  useJoinWaitlistOpenMutation,
  buildJoinWaitlistOpenOptions,
} from './use-join-waitlist-open';

export {
  useLeaveWaitlistMutation,
  buildLeaveWaitlistOptions,
} from './use-leave-waitlist';

export {
  usePromoteFromWaitlistMutation,
  buildPromoteFromWaitlistOptions,
} from './use-promote-from-waitlist';

// Moderator/Owner Action Mutations
export {
  useInviteMemberMutation,
  buildInviteMemberOptions,
} from './use-invite-member';

export {
  useApproveMembershipMutation,
  buildApproveMembershipOptions,
} from './use-approve-membership';

export {
  useRejectMembershipMutation,
  buildRejectMembershipOptions,
} from './use-reject-membership';

export { useKickMemberMutation, buildKickMemberOptions } from './use-kick-member';

export { useBanMemberMutation, buildBanMemberOptions } from './use-ban-member';

export {
  useUnbanMemberMutation,
  buildUnbanMemberOptions,
} from './use-unban-member';

export {
  useUpdateMemberRoleMutation,
  buildUpdateMemberRoleOptions,
} from './use-update-member-role';

export {
  useCancelPendingOrInviteForUserMutation,
  buildCancelPendingOrInviteForUserOptions,
} from './use-cancel-pending-or-invite-for-user';

