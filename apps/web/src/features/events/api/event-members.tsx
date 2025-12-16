// ─────────────────────────────────────────────────────────────────────────────
// Event Members — imports
// ─────────────────────────────────────────────────────────────────────────────
import {
  // Queries
  GetEventMembersDocument,
  GetEventMembersQuery,
  GetEventMembersQueryVariables,
  GetEventMemberDocument,
  GetEventMemberQuery,
  GetEventMemberQueryVariables,
  GetMyMembershipForEventDocument,
  GetMyMembershipForEventQuery,
  GetMyMembershipForEventQueryVariables,
  GetMyMembershipsDocument,
  GetMyMembershipsQuery,
  GetMyMembershipsQueryVariables,
  GetMyEventsDocument,
  GetMyEventsQuery,
  GetMyEventsQueryVariables,
  GetEventMemberStatsDocument,
  GetEventMemberStatsQuery,
  GetEventMemberStatsQueryVariables,
  // Mutations
  RequestJoinEventDocument,
  RequestJoinEventMutation,
  RequestJoinEventMutationVariables,
  CancelJoinRequestDocument,
  CancelJoinRequestMutation,
  CancelJoinRequestMutationVariables,
  LeaveEventDocument,
  LeaveEventMutation,
  LeaveEventMutationVariables,
  AcceptInviteDocument,
  AcceptInviteMutation,
  AcceptInviteMutationVariables,
  InviteMemberDocument,
  InviteMemberMutation,
  InviteMemberMutationVariables,
  ApproveMembershipDocument,
  ApproveMembershipMutation,
  ApproveMembershipMutationVariables,
  RejectMembershipDocument,
  RejectMembershipMutation,
  RejectMembershipMutationVariables,
  KickMemberDocument,
  KickMemberMutation,
  KickMemberMutationVariables,
  UpdateMemberRoleDocument,
  UpdateMemberRoleMutation,
  UpdateMemberRoleMutationVariables,
  BanMemberMutation,
  BanMemberMutationVariables,
  BanMemberDocument,
  CancelPendingOrInviteForUserMutation,
  CancelPendingOrInviteForUserMutationVariables,
  CancelPendingOrInviteForUserDocument,
  UnbanMemberMutation,
  UnbanMemberMutationVariables,
  UnbanMemberDocument,
  JoinWaitlistOpenDocument,
  JoinWaitlistOpenMutation,
  JoinWaitlistOpenMutationVariables,
  LeaveWaitlistDocument,
  LeaveWaitlistMutation,
  LeaveWaitlistMutationVariables,
  PromoteFromWaitlistDocument,
  PromoteFromWaitlistMutation,
  PromoteFromWaitlistMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';
import { GET_EVENT_DETAIL_KEY } from './events';

// ─────────────────────────────────────────────────────────────────────────────
// Event Members — KEYS
// ─────────────────────────────────────────────────────────────────────────────
export const GET_EVENT_MEMBERS_KEY = (
  variables: GetEventMembersQueryVariables
) => ['GetEventMembers', variables] as const;

export const GET_EVENT_MEMBER_KEY = (variables: GetEventMemberQueryVariables) =>
  ['GetEventMember', variables] as const;

export const GET_MY_MEMBERSHIP_FOR_EVENT_KEY = (
  variables: GetMyMembershipForEventQueryVariables
) => ['GetMyMembershipForEvent', variables] as const;

export const GET_MY_MEMBERSHIPS_KEY = (
  variables?: GetMyMembershipsQueryVariables
) =>
  variables
    ? (['GetMyMemberships', variables] as const)
    : (['GetMyMemberships'] as const);

export const GET_EVENT_MEMBER_STATS_KEY = (
  variables: GetEventMemberStatsQueryVariables
) => ['GetEventMemberStats', variables] as const;

/* ======================= INVALIDATION HELPERS ======================== */

function invalidateMembers(eventId: string) {
  const qc = getQueryClient();
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'GetEventMembers' &&
      (q.queryKey[1] as any)?.eventId === eventId,
  });
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'GetEventMemberStats' &&
      (q.queryKey[1] as any)?.eventId === eventId,
  });
  // odśwież szczegół i listę eventów (np. badge liczb)
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
  });
  qc.invalidateQueries({
    predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvent',
  });
}

export function buildBanMemberOptions<TContext = unknown>( // <-- NEW
  options?: UseMutationOptions<
    BanMemberMutation,
    unknown,
    BanMemberMutationVariables,
    TContext
  >
): UseMutationOptions<
  BanMemberMutation,
  unknown,
  BanMemberMutationVariables,
  TContext
> {
  return {
    mutationKey: ['BanMember'] as QueryKey,
    mutationFn: async (variables: BanMemberMutationVariables) =>
      gqlClient.request<BanMemberMutation, BanMemberMutationVariables>(
        BanMemberDocument,
        variables
      ),
    meta: {
      successMessage: 'Member banned successfully',
    },
    ...(options ?? {}),
  };
}

export function buildUnbanMemberOptions<TContext = unknown>( // <-- NEW
  options?: UseMutationOptions<
    UnbanMemberMutation,
    unknown,
    UnbanMemberMutationVariables,
    TContext
  >
): UseMutationOptions<
  UnbanMemberMutation,
  unknown,
  UnbanMemberMutationVariables,
  TContext
> {
  return {
    mutationKey: ['UnbanMember'] as QueryKey,
    mutationFn: async (variables: UnbanMemberMutationVariables) =>
      gqlClient.request<UnbanMemberMutation, UnbanMemberMutationVariables>(
        UnbanMemberDocument,
        variables
      ),
    meta: {
      successMessage: 'Member unbanned successfully',
    },
    ...(options ?? {}),
  };
}

export function buildCancelPendingOrInviteForUserOptions<TContext = unknown>( // <-- NEW
  options?: UseMutationOptions<
    CancelPendingOrInviteForUserMutation,
    unknown,
    CancelPendingOrInviteForUserMutationVariables,
    TContext
  >
): UseMutationOptions<
  CancelPendingOrInviteForUserMutation,
  unknown,
  CancelPendingOrInviteForUserMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CancelPendingOrInviteForUser'] as QueryKey,
    mutationFn: async (
      variables: CancelPendingOrInviteForUserMutationVariables
    ) =>
      gqlClient.request<
        CancelPendingOrInviteForUserMutation,
        CancelPendingOrInviteForUserMutationVariables
      >(CancelPendingOrInviteForUserDocument, variables),
    meta: {
      successMessage: 'Invitation cancelled',
    },
    ...(options ?? {}),
  };
}

export function useBanMemberMutation( // <-- NEW
  options?: UseMutationOptions<
    BanMemberMutation,
    unknown,
    BanMemberMutationVariables
  >
) {
  return useMutation<BanMemberMutation, unknown, BanMemberMutationVariables>(
    buildBanMemberOptions({
      onSuccess: (_data, vars) => {
        invalidateMembers(vars.input.eventId);
      },
      ...(options ?? {}),
    })
  );
}

export function useUnbanMemberMutation( // <-- NEW
  options?: UseMutationOptions<
    UnbanMemberMutation,
    unknown,
    UnbanMemberMutationVariables
  >
) {
  return useMutation<
    UnbanMemberMutation,
    unknown,
    UnbanMemberMutationVariables
  >(
    buildUnbanMemberOptions({
      onSuccess: (_data, vars) => {
        invalidateMembers(vars.input.eventId);
      },
      ...(options ?? {}),
    })
  );
}

export function useCancelPendingOrInviteForUserMutation( // <-- NEW
  options?: UseMutationOptions<
    CancelPendingOrInviteForUserMutation,
    unknown,
    CancelPendingOrInviteForUserMutationVariables
  >
) {
  return useMutation<
    CancelPendingOrInviteForUserMutation,
    unknown,
    CancelPendingOrInviteForUserMutationVariables
  >(
    buildCancelPendingOrInviteForUserOptions({
      onSuccess: (_data, vars) => {
        invalidateMembers(vars.input.eventId);
      },
      ...(options ?? {}),
    })
  );
}

export function buildJoinWaitlistOpenOptions<TContext = unknown>(
  options?: UseMutationOptions<
    JoinWaitlistOpenMutation,
    unknown,
    JoinWaitlistOpenMutationVariables,
    TContext
  >
): UseMutationOptions<
  JoinWaitlistOpenMutation,
  unknown,
  JoinWaitlistOpenMutationVariables,
  TContext
> {
  return {
    mutationKey: ['JoinWaitlistOpen'] as QueryKey,
    mutationFn: async (variables: JoinWaitlistOpenMutationVariables) =>
      gqlClient.request<
        JoinWaitlistOpenMutation,
        JoinWaitlistOpenMutationVariables
      >(JoinWaitlistOpenDocument, variables),
    meta: {
      successMessage: 'Joined waitlist successfully',
    },
    ...(options ?? {}),
  };
}

export function useJoinWaitlistOpenMutation(
  options?: UseMutationOptions<
    JoinWaitlistOpenMutation,
    unknown,
    JoinWaitlistOpenMutationVariables
  >
) {
  return useMutation<
    JoinWaitlistOpenMutation,
    unknown,
    JoinWaitlistOpenMutationVariables
  >(
    buildJoinWaitlistOpenOptions({
      onSuccess: (_data, vars) => {
        invalidateMembers(vars.eventId);
      },
      ...(options ?? {}),
    })
  );
}

export function buildLeaveWaitlistOptions<TContext = unknown>(
  options?: UseMutationOptions<
    LeaveWaitlistMutation,
    unknown,
    LeaveWaitlistMutationVariables,
    TContext
  >
): UseMutationOptions<
  LeaveWaitlistMutation,
  unknown,
  LeaveWaitlistMutationVariables,
  TContext
> {
  return {
    mutationKey: ['LeaveWaitlist'] as QueryKey,
    mutationFn: async (variables: LeaveWaitlistMutationVariables) =>
      gqlClient.request<LeaveWaitlistMutation, LeaveWaitlistMutationVariables>(
        LeaveWaitlistDocument,
        variables
      ),
    meta: {
      successMessage: 'Left waitlist successfully',
    },
    ...(options ?? {}),
  };
}

export function useLeaveWaitlistMutation(
  options?: UseMutationOptions<
    LeaveWaitlistMutation,
    unknown,
    LeaveWaitlistMutationVariables
  >
) {
  return useMutation<
    LeaveWaitlistMutation,
    unknown,
    LeaveWaitlistMutationVariables
  >(
    buildLeaveWaitlistOptions({
      onSuccess: (_data, vars) => {
        invalidateMembers(vars.eventId);
      },
      ...(options ?? {}),
    })
  );
}

export function buildPromoteFromWaitlistOptions<TContext = unknown>(
  options?: UseMutationOptions<
    PromoteFromWaitlistMutation,
    unknown,
    PromoteFromWaitlistMutationVariables,
    TContext
  >
): UseMutationOptions<
  PromoteFromWaitlistMutation,
  unknown,
  PromoteFromWaitlistMutationVariables,
  TContext
> {
  return {
    mutationKey: ['PromoteFromWaitlist'] as QueryKey,
    mutationFn: async (variables: PromoteFromWaitlistMutationVariables) =>
      gqlClient.request<
        PromoteFromWaitlistMutation,
        PromoteFromWaitlistMutationVariables
      >(PromoteFromWaitlistDocument, variables),
    meta: {
      successMessage: 'Member promoted from waitlist successfully',
    },
    ...(options ?? {}),
  };
}

export function usePromoteFromWaitlistMutation(
  options?: UseMutationOptions<
    PromoteFromWaitlistMutation,
    unknown,
    PromoteFromWaitlistMutationVariables
  >
) {
  return useMutation<
    PromoteFromWaitlistMutation,
    unknown,
    PromoteFromWaitlistMutationVariables
  >(
    buildPromoteFromWaitlistOptions({
      onSuccess: (_data, vars) => {
        invalidateMembers(vars.input.eventId);
      },
      ...(options ?? {}),
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Members — QUERY BUILDERS
// ─────────────────────────────────────────────────────────────────────────────
export function buildGetEventMembersOptions(
  variables: GetEventMembersQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventMembersQuery,
      unknown,
      GetEventMembersQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetEventMembersQuery,
  unknown,
  GetEventMembersQuery,
  QueryKey
> {
  return {
    queryKey: GET_EVENT_MEMBERS_KEY(variables) as QueryKey,
    queryFn: () =>
      gqlClient.request<GetEventMembersQuery, GetEventMembersQueryVariables>(
        GetEventMembersDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function buildGetEventMemberOptions(
  variables: GetEventMemberQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventMemberQuery,
      unknown,
      GetEventMemberQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetEventMemberQuery,
  unknown,
  GetEventMemberQuery,
  QueryKey
> {
  return {
    queryKey: GET_EVENT_MEMBER_KEY(variables) as QueryKey,
    queryFn: () =>
      gqlClient.request<GetEventMemberQuery, GetEventMemberQueryVariables>(
        GetEventMemberDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function buildGetMyMembershipForEventOptions(
  variables: GetMyMembershipForEventQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetMyMembershipForEventQuery,
      unknown,
      GetMyMembershipForEventQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetMyMembershipForEventQuery,
  unknown,
  GetMyMembershipForEventQuery,
  QueryKey
> {
  return {
    queryKey: GET_MY_MEMBERSHIP_FOR_EVENT_KEY(variables) as QueryKey,
    queryFn: () =>
      gqlClient.request<
        GetMyMembershipForEventQuery,
        GetMyMembershipForEventQueryVariables
      >(GetMyMembershipForEventDocument, variables),
    ...(options ?? {}),
  };
}

export function buildGetMyMembershipsOptions(
  variables?: GetMyMembershipsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetMyMembershipsQuery,
      unknown,
      GetMyMembershipsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetMyMembershipsQuery,
  unknown,
  GetMyMembershipsQuery,
  QueryKey
> {
  return {
    queryKey: GET_MY_MEMBERSHIPS_KEY(variables) as QueryKey,
    queryFn: () =>
      variables
        ? gqlClient.request<
            GetMyMembershipsQuery,
            GetMyMembershipsQueryVariables
          >(GetMyMembershipsDocument, variables)
        : gqlClient.request<GetMyMembershipsQuery>(GetMyMembershipsDocument),
    ...(options ?? {}),
  };
}

export function buildGetEventMemberStatsOptions(
  variables: GetEventMemberStatsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventMemberStatsQuery,
      unknown,
      GetEventMemberStatsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetEventMemberStatsQuery,
  unknown,
  GetEventMemberStatsQuery,
  QueryKey
> {
  return {
    queryKey: GET_EVENT_MEMBER_STATS_KEY(variables) as QueryKey,
    queryFn: () =>
      gqlClient.request<
        GetEventMemberStatsQuery,
        GetEventMemberStatsQueryVariables
      >(GetEventMemberStatsDocument, variables),
    ...(options ?? {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Members — QUERIES
// ─────────────────────────────────────────────────────────────────────────────
export function useEventMembersQuery(
  variables: GetEventMembersQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventMembersQuery,
      unknown,
      GetEventMembersQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetEventMembersOptions(variables, {
      enabled: !!variables.eventId,
      ...(options ?? {}),
    })
  );
}

export function useEventMemberQuery(
  variables: GetEventMemberQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventMemberQuery,
      unknown,
      GetEventMemberQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetEventMemberOptions(variables, {
      enabled: !!variables.eventId && !!variables.userId,
      ...(options ?? {}),
    })
  );
}

/**
 * Get current user's membership for a specific event.
 * Used when membersVisibility is HIDDEN or AFTER_JOIN and userMembership is not available from event query.
 */
export function useMyMembershipForEventQuery(
  variables: GetMyMembershipForEventQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetMyMembershipForEventQuery,
      unknown,
      GetMyMembershipForEventQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetMyMembershipForEventOptions(variables, {
      enabled: !!variables.eventId,
      ...(options ?? {}),
    })
  );
}

export function useMyMembershipsQuery(
  variables?: GetMyMembershipsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetMyMembershipsQuery,
      unknown,
      GetMyMembershipsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetMyMembershipsOptions(variables, options));
}

// ─────────────────────────────────────────────────────────────────────────────
// My Events Query (with event lifecycle status filtering)
// ─────────────────────────────────────────────────────────────────────────────

export const GET_MY_EVENTS_KEY = (variables?: GetMyEventsQueryVariables) =>
  variables
    ? (['GetMyEvents', variables] as const)
    : (['GetMyEvents'] as const);

function buildGetMyEventsOptions(
  variables?: GetMyEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetMyEventsQuery, Error, GetMyEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetMyEventsQuery, Error, GetMyEventsQuery, QueryKey> {
  return {
    queryKey: GET_MY_EVENTS_KEY(variables),
    queryFn: async () => {
      const data = await gqlClient.request(
        GetMyEventsDocument,
        variables || {}
      );
      return data;
    },
    ...options,
  };
}

export function useMyEventsQuery(
  variables?: GetMyEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetMyEventsQuery, Error, GetMyEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetMyEventsOptions(variables, options));
}

export function useEventMemberStatsQuery(
  variables: GetEventMemberStatsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventMemberStatsQuery,
      unknown,
      GetEventMemberStatsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetEventMemberStatsOptions(variables, {
      enabled: !!variables.eventId,
      ...(options ?? {}),
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Members — MUTATION BUILDERS
// ─────────────────────────────────────────────────────────────────────────────
export function buildRequestJoinEventOptions<TContext = unknown>(
  options?: UseMutationOptions<
    RequestJoinEventMutation,
    unknown,
    RequestJoinEventMutationVariables,
    TContext
  >
): UseMutationOptions<
  RequestJoinEventMutation,
  unknown,
  RequestJoinEventMutationVariables,
  TContext
> {
  return {
    mutationKey: ['RequestJoinEvent'] as QueryKey,
    mutationFn: async (variables: RequestJoinEventMutationVariables) =>
      gqlClient.request<
        RequestJoinEventMutation,
        RequestJoinEventMutationVariables
      >(RequestJoinEventDocument, variables),
    meta: {
      successMessage: 'Join request sent successfully',
    },
    ...(options ?? {}),
  };
}

export function buildCancelJoinRequestOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CancelJoinRequestMutation,
    unknown,
    CancelJoinRequestMutationVariables,
    TContext
  >
): UseMutationOptions<
  CancelJoinRequestMutation,
  unknown,
  CancelJoinRequestMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CancelJoinRequest'] as QueryKey,
    mutationFn: async (variables: CancelJoinRequestMutationVariables) =>
      gqlClient.request<
        CancelJoinRequestMutation,
        CancelJoinRequestMutationVariables
      >(CancelJoinRequestDocument, variables),
    meta: {
      successMessage: 'Join request cancelled',
    },
    ...(options ?? {}),
  };
}

export function buildLeaveEventOptions<TContext = unknown>(
  options?: UseMutationOptions<
    LeaveEventMutation,
    unknown,
    LeaveEventMutationVariables,
    TContext
  >
): UseMutationOptions<
  LeaveEventMutation,
  unknown,
  LeaveEventMutationVariables,
  TContext
> {
  return {
    mutationKey: ['LeaveEvent'] as QueryKey,
    mutationFn: async (variables: LeaveEventMutationVariables) =>
      gqlClient.request<LeaveEventMutation, LeaveEventMutationVariables>(
        LeaveEventDocument,
        variables
      ),
    meta: {
      successMessage: 'You left the event',
    },
    ...(options ?? {}),
  };
}

export function buildInviteMemberOptions<TContext = unknown>(
  options?: UseMutationOptions<
    InviteMemberMutation,
    unknown,
    InviteMemberMutationVariables,
    TContext
  >
): UseMutationOptions<
  InviteMemberMutation,
  unknown,
  InviteMemberMutationVariables,
  TContext
> {
  return {
    mutationKey: ['InviteMember'] as QueryKey,
    mutationFn: async (variables: InviteMemberMutationVariables) =>
      gqlClient.request<InviteMemberMutation, InviteMemberMutationVariables>(
        InviteMemberDocument,
        variables
      ),
    meta: {
      successMessage: 'Member invited successfully',
    },
    ...(options ?? {}),
  };
}

export function buildApproveMembershipOptions<TContext = unknown>(
  options?: UseMutationOptions<
    ApproveMembershipMutation,
    unknown,
    ApproveMembershipMutationVariables,
    TContext
  >
): UseMutationOptions<
  ApproveMembershipMutation,
  unknown,
  ApproveMembershipMutationVariables,
  TContext
> {
  return {
    mutationKey: ['ApproveMembership'] as QueryKey,
    mutationFn: async (variables: ApproveMembershipMutationVariables) =>
      gqlClient.request<
        ApproveMembershipMutation,
        ApproveMembershipMutationVariables
      >(ApproveMembershipDocument, variables),
    meta: {
      successMessage: 'Membership approved',
    },
    ...(options ?? {}),
  };
}

export function buildRejectMembershipOptions<TContext = unknown>(
  options?: UseMutationOptions<
    RejectMembershipMutation,
    unknown,
    RejectMembershipMutationVariables,
    TContext
  >
): UseMutationOptions<
  RejectMembershipMutation,
  unknown,
  RejectMembershipMutationVariables,
  TContext
> {
  return {
    mutationKey: ['RejectMembership'] as QueryKey,
    mutationFn: async (variables: RejectMembershipMutationVariables) =>
      gqlClient.request<
        RejectMembershipMutation,
        RejectMembershipMutationVariables
      >(RejectMembershipDocument, variables),
    meta: {
      successMessage: 'Membership rejected',
    },
    ...(options ?? {}),
  };
}

export function buildKickMemberOptions<TContext = unknown>(
  options?: UseMutationOptions<
    KickMemberMutation,
    unknown,
    KickMemberMutationVariables,
    TContext
  >
): UseMutationOptions<
  KickMemberMutation,
  unknown,
  KickMemberMutationVariables,
  TContext
> {
  return {
    mutationKey: ['KickMember'] as QueryKey,
    mutationFn: async (variables: KickMemberMutationVariables) =>
      gqlClient.request<KickMemberMutation, KickMemberMutationVariables>(
        KickMemberDocument,
        variables
      ),
    meta: {
      successMessage: 'Member kicked successfully',
    },
    ...(options ?? {}),
  };
}

export function buildUpdateMemberRoleOptions<TContext = unknown>(
  options?: UseMutationOptions<
    UpdateMemberRoleMutation,
    unknown,
    UpdateMemberRoleMutationVariables,
    TContext
  >
): UseMutationOptions<
  UpdateMemberRoleMutation,
  unknown,
  UpdateMemberRoleMutationVariables,
  TContext
> {
  return {
    mutationKey: ['UpdateMemberRole'] as QueryKey,
    mutationFn: async (variables: UpdateMemberRoleMutationVariables) =>
      gqlClient.request<
        UpdateMemberRoleMutation,
        UpdateMemberRoleMutationVariables
      >(UpdateMemberRoleDocument, variables),
    meta: {
      successMessage: 'Member role updated',
    },
    ...(options ?? {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Members — MUTATION HOOKS (z invalidacjami)
// ─────────────────────────────────────────────────────────────────────────────
export function useRequestJoinEventMutation(
  options?: UseMutationOptions<
    RequestJoinEventMutation,
    unknown,
    RequestJoinEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    RequestJoinEventMutation,
    unknown,
    RequestJoinEventMutationVariables
  >(
    buildRequestJoinEventOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
        if (vars.eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: vars.eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBERS_KEY({
              eventId: vars.eventId,
            }) as QueryKey,
          });
        }
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetMyMemberships',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useCancelJoinRequestMutation(
  options?: UseMutationOptions<
    CancelJoinRequestMutation,
    unknown,
    CancelJoinRequestMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CancelJoinRequestMutation,
    unknown,
    CancelJoinRequestMutationVariables
  >(
    buildCancelJoinRequestOptions({
      onSuccess: (_data, vars) => {
        if (vars.eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: vars.eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBERS_KEY({
              eventId: vars.eventId,
            }) as QueryKey,
          });
        }
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetMyMemberships',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useLeaveEventMutationMembers(
  options?: UseMutationOptions<
    LeaveEventMutation,
    unknown,
    LeaveEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<LeaveEventMutation, unknown, LeaveEventMutationVariables>(
    buildLeaveEventOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
        if (vars.eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: vars.eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBERS_KEY({
              eventId: vars.eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBER_STATS_KEY({
              eventId: vars.eventId,
            }) as QueryKey,
          });
        }
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetMyMemberships',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useAcceptInviteMutation(
  options?: UseMutationOptions<
    AcceptInviteMutation,
    unknown,
    AcceptInviteMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AcceptInviteMutation,
    unknown,
    AcceptInviteMutationVariables
  >({
    mutationFn: (variables: AcceptInviteMutationVariables) =>
      gqlClient.request<AcceptInviteMutation, AcceptInviteMutationVariables>(
        AcceptInviteDocument,
        variables
      ),
    mutationKey: ['AcceptInvite'],
    meta: {
      successMessage: 'Invitation accepted successfully',
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
      });
      if (vars.eventId) {
        qc.invalidateQueries({
          queryKey: GET_EVENT_DETAIL_KEY({
            id: vars.eventId,
          }) as QueryKey,
        });
        qc.invalidateQueries({
          queryKey: GET_EVENT_MEMBERS_KEY({
            eventId: vars.eventId,
          }) as QueryKey,
        });
        qc.invalidateQueries({
          queryKey: GET_EVENT_MEMBER_STATS_KEY({
            eventId: vars.eventId,
          }) as QueryKey,
        });
      }
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'GetMyMemberships',
      });
    },
    ...(options ?? {}),
  });
}

export function useInviteMemberMutation(
  options?: UseMutationOptions<
    InviteMemberMutation,
    unknown,
    InviteMemberMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    InviteMemberMutation,
    unknown,
    InviteMemberMutationVariables
  >(
    buildInviteMemberOptions({
      onSuccess: (_data, vars) => {
        const eventId = vars.input?.eventId;
        if (eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBERS_KEY({
              eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBER_STATS_KEY({
              eventId,
            }) as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function useApproveMembershipMutation(
  options?: UseMutationOptions<
    ApproveMembershipMutation,
    unknown,
    ApproveMembershipMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    ApproveMembershipMutation,
    unknown,
    ApproveMembershipMutationVariables
  >(
    buildApproveMembershipOptions({
      onSuccess: (_data, vars) => {
        const eventId = vars.input?.eventId;
        if (eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBERS_KEY({
              eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBER_STATS_KEY({
              eventId,
            }) as QueryKey,
          });
        }
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useRejectMembershipMutation(
  options?: UseMutationOptions<
    RejectMembershipMutation,
    unknown,
    RejectMembershipMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    RejectMembershipMutation,
    unknown,
    RejectMembershipMutationVariables
  >(
    buildRejectMembershipOptions({
      onSuccess: (_data, vars) => {
        const eventId = vars.input?.eventId;
        if (eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBERS_KEY({
              eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBER_STATS_KEY({
              eventId,
            }) as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function useKickMemberMutation(
  options?: UseMutationOptions<
    KickMemberMutation,
    unknown,
    KickMemberMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<KickMemberMutation, unknown, KickMemberMutationVariables>(
    buildKickMemberOptions({
      onSuccess: (_data, vars) => {
        const eventId = vars.input?.eventId;
        if (eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBERS_KEY({
              eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBER_STATS_KEY({
              eventId,
            }) as QueryKey,
          });
        }
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useUpdateMemberRoleMutation(
  options?: UseMutationOptions<
    UpdateMemberRoleMutation,
    unknown,
    UpdateMemberRoleMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UpdateMemberRoleMutation,
    unknown,
    UpdateMemberRoleMutationVariables
  >(
    buildUpdateMemberRoleOptions({
      onSuccess: (_data, vars) => {
        const eventId = vars.input?.eventId;
        if (eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBERS_KEY({
              eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: eventId,
            }) as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
