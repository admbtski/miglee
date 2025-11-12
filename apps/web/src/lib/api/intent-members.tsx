// ─────────────────────────────────────────────────────────────────────────────
// Intent Members — imports
// ─────────────────────────────────────────────────────────────────────────────
import {
  // Queries
  GetIntentMembersDocument,
  GetIntentMembersQuery,
  GetIntentMembersQueryVariables,
  GetIntentMemberDocument,
  GetIntentMemberQuery,
  GetIntentMemberQueryVariables,
  GetMyMembershipsDocument,
  GetMyMembershipsQuery,
  GetMyMembershipsQueryVariables,
  GetIntentMemberStatsDocument,
  GetIntentMemberStatsQuery,
  GetIntentMemberStatsQueryVariables,
  // Mutations
  RequestJoinIntentDocument,
  RequestJoinIntentMutation,
  RequestJoinIntentMutationVariables,
  CancelJoinRequestDocument,
  CancelJoinRequestMutation,
  CancelJoinRequestMutationVariables,
  LeaveIntentDocument,
  LeaveIntentMutation,
  LeaveIntentMutationVariables,
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
import { GET_INTENT_ONE_KEY } from './intents';

// ─────────────────────────────────────────────────────────────────────────────
// Intent Members — KEYS
// ─────────────────────────────────────────────────────────────────────────────
export const GET_INTENT_MEMBERS_KEY = (
  variables: GetIntentMembersQueryVariables
) => ['GetIntentMembers', variables] as const;

export const GET_INTENT_MEMBER_KEY = (
  variables: GetIntentMemberQueryVariables
) => ['GetIntentMember', variables] as const;

export const GET_MY_MEMBERSHIPS_KEY = (
  variables?: GetMyMembershipsQueryVariables
) =>
  variables
    ? (['GetMyMemberships', variables] as const)
    : (['GetMyMemberships'] as const);

export const GET_INTENT_MEMBER_STATS_KEY = (
  variables: GetIntentMemberStatsQueryVariables
) => ['GetIntentMemberStats', variables] as const;

/* ======================= INVALIDATION HELPERS ======================== */

function invalidateMembers(intentId: string) {
  const qc = getQueryClient();
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'GetIntentMembers' &&
      (q.queryKey[1] as any)?.intentId === intentId,
  });
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'GetIntentMemberStats' &&
      (q.queryKey[1] as any)?.intentId === intentId,
  });
  // odśwież szczegół i listę intentów (np. badge liczb)
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
  });
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntent',
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
        invalidateMembers(vars.input.intentId);
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
        invalidateMembers(vars.input.intentId);
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
        invalidateMembers(vars.input.intentId);
      },
      ...(options ?? {}),
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Intent Members — QUERY BUILDERS
// ─────────────────────────────────────────────────────────────────────────────
export function buildGetIntentMembersOptions(
  variables: GetIntentMembersQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetIntentMembersQuery,
      unknown,
      GetIntentMembersQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetIntentMembersQuery,
  unknown,
  GetIntentMembersQuery,
  QueryKey
> {
  return {
    queryKey: GET_INTENT_MEMBERS_KEY(variables) as QueryKey,
    queryFn: () =>
      gqlClient.request<GetIntentMembersQuery, GetIntentMembersQueryVariables>(
        GetIntentMembersDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function buildGetIntentMemberOptions(
  variables: GetIntentMemberQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetIntentMemberQuery,
      unknown,
      GetIntentMemberQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetIntentMemberQuery,
  unknown,
  GetIntentMemberQuery,
  QueryKey
> {
  return {
    queryKey: GET_INTENT_MEMBER_KEY(variables) as QueryKey,
    queryFn: () =>
      gqlClient.request<GetIntentMemberQuery, GetIntentMemberQueryVariables>(
        GetIntentMemberDocument,
        variables
      ),
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

export function buildGetIntentMemberStatsOptions(
  variables: GetIntentMemberStatsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetIntentMemberStatsQuery,
      unknown,
      GetIntentMemberStatsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetIntentMemberStatsQuery,
  unknown,
  GetIntentMemberStatsQuery,
  QueryKey
> {
  return {
    queryKey: GET_INTENT_MEMBER_STATS_KEY(variables) as QueryKey,
    queryFn: () =>
      gqlClient.request<
        GetIntentMemberStatsQuery,
        GetIntentMemberStatsQueryVariables
      >(GetIntentMemberStatsDocument, variables),
    ...(options ?? {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Intent Members — QUERIES
// ─────────────────────────────────────────────────────────────────────────────
export function useIntentMembersQuery(
  variables: GetIntentMembersQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetIntentMembersQuery,
      unknown,
      GetIntentMembersQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetIntentMembersOptions(variables, {
      enabled: !!variables.intentId,
      ...(options ?? {}),
    })
  );
}

export function useIntentMemberQuery(
  variables: GetIntentMemberQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetIntentMemberQuery,
      unknown,
      GetIntentMemberQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetIntentMemberOptions(variables, {
      enabled: !!variables.intentId && !!variables.userId,
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

export function useIntentMemberStatsQuery(
  variables: GetIntentMemberStatsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetIntentMemberStatsQuery,
      unknown,
      GetIntentMemberStatsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetIntentMemberStatsOptions(variables, {
      enabled: !!variables.intentId,
      ...(options ?? {}),
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Intent Members — MUTATION BUILDERS
// ─────────────────────────────────────────────────────────────────────────────
export function buildRequestJoinIntentOptions<TContext = unknown>(
  options?: UseMutationOptions<
    RequestJoinIntentMutation,
    unknown,
    RequestJoinIntentMutationVariables,
    TContext
  >
): UseMutationOptions<
  RequestJoinIntentMutation,
  unknown,
  RequestJoinIntentMutationVariables,
  TContext
> {
  return {
    mutationKey: ['RequestJoinIntent'] as QueryKey,
    mutationFn: async (variables: RequestJoinIntentMutationVariables) =>
      gqlClient.request<
        RequestJoinIntentMutation,
        RequestJoinIntentMutationVariables
      >(RequestJoinIntentDocument, variables),
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

export function buildLeaveIntentOptions<TContext = unknown>(
  options?: UseMutationOptions<
    LeaveIntentMutation,
    unknown,
    LeaveIntentMutationVariables,
    TContext
  >
): UseMutationOptions<
  LeaveIntentMutation,
  unknown,
  LeaveIntentMutationVariables,
  TContext
> {
  return {
    mutationKey: ['LeaveIntent'] as QueryKey,
    mutationFn: async (variables: LeaveIntentMutationVariables) =>
      gqlClient.request<LeaveIntentMutation, LeaveIntentMutationVariables>(
        LeaveIntentDocument,
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
// Intent Members — MUTATION HOOKS (z invalidacjami)
// ─────────────────────────────────────────────────────────────────────────────
export function useRequestJoinIntentMutation(
  options?: UseMutationOptions<
    RequestJoinIntentMutation,
    unknown,
    RequestJoinIntentMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    RequestJoinIntentMutation,
    unknown,
    RequestJoinIntentMutationVariables
  >(
    buildRequestJoinIntentOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
        if (vars.intentId) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({
              id: vars.intentId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_INTENT_MEMBERS_KEY({
              intentId: vars.intentId,
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
        if (vars.intentId) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({
              id: vars.intentId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_INTENT_MEMBERS_KEY({
              intentId: vars.intentId,
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

export function useLeaveIntentMutationMembers(
  options?: UseMutationOptions<
    LeaveIntentMutation,
    unknown,
    LeaveIntentMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    LeaveIntentMutation,
    unknown,
    LeaveIntentMutationVariables
  >(
    buildLeaveIntentOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
        if (vars.intentId) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({
              id: vars.intentId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_INTENT_MEMBERS_KEY({
              intentId: vars.intentId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_INTENT_MEMBER_STATS_KEY({
              intentId: vars.intentId,
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
        const intentId = vars.input?.intentId;
        if (intentId) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_MEMBERS_KEY({
              intentId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({
              id: intentId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_INTENT_MEMBER_STATS_KEY({
              intentId,
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
        const intentId = vars.input?.intentId;
        if (intentId) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_MEMBERS_KEY({
              intentId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({
              id: intentId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_INTENT_MEMBER_STATS_KEY({
              intentId,
            }) as QueryKey,
          });
        }
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
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
        const intentId = vars.input?.intentId;
        if (intentId) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_MEMBERS_KEY({
              intentId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({
              id: intentId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_INTENT_MEMBER_STATS_KEY({
              intentId,
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
        const intentId = vars.input?.intentId;
        if (intentId) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_MEMBERS_KEY({
              intentId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({
              id: intentId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_INTENT_MEMBER_STATS_KEY({
              intentId,
            }) as QueryKey,
          });
        }
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
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
        const intentId = vars.input?.intentId;
        if (intentId) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_MEMBERS_KEY({
              intentId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({
              id: intentId,
            }) as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
