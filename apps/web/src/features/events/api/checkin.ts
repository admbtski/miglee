/**
 * Check-in System API Hooks
 *
 * Provides React Query hooks for check-in mutations and queries.
 * Pattern follows the same structure as event-members.tsx
 */

import {
  useMutation,
  UseMutationOptions,
  useQuery,
  QueryKey,
} from '@tanstack/react-query';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { gql } from 'graphql-request';

// ─────────────────────────────────────────────────────────────────────────────
// Types (będą wygenerowane przez codegen, tymczasowo definiujemy ręcznie)
// ─────────────────────────────────────────────────────────────────────────────

export type CheckinMethod =
  | 'SELF_MANUAL'
  | 'MODERATOR_PANEL'
  | 'EVENT_QR'
  | 'USER_QR';
export type CheckinAction =
  | 'CHECK_IN'
  | 'UNCHECK'
  | 'REJECT'
  | 'BLOCK_ALL'
  | 'BLOCK_METHOD'
  | 'UNBLOCK_ALL'
  | 'UNBLOCK_METHOD';
export type CheckinSource = 'USER' | 'MODERATOR' | 'SYSTEM';
export type CheckinResult = 'SUCCESS' | 'DENIED' | 'NOOP';

export interface CheckinResultPayload {
  success: boolean;
  message: string;
  member?: {
    id: string;
    isCheckedIn: boolean;
    checkinMethods: CheckinMethod[];
    lastCheckinAt?: string;
    user?: {
      id: string;
      displayName?: string;
    };
  };
}

export interface EventCheckinLog {
  id: string;
  action: CheckinAction;
  method?: CheckinMethod;
  source: CheckinSource;
  result: CheckinResult;
  reason?: string;
  comment?: string;
  createdAt: string;
  actor?: {
    id: string;
    displayName?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GraphQL Documents
// ─────────────────────────────────────────────────────────────────────────────

const CHECK_IN_SELF_MUTATION = gql`
  mutation CheckInSelf($eventId: ID!) {
    checkInSelf(eventId: $eventId) {
      success
      message
      member {
        id
        isCheckedIn
        checkinMethods
        lastCheckinAt
      }
    }
  }
`;

const UNCHECK_IN_SELF_MUTATION = gql`
  mutation UncheckInSelf($eventId: ID!) {
    uncheckInSelf(eventId: $eventId) {
      success
      message
      member {
        id
        isCheckedIn
        checkinMethods
      }
    }
  }
`;

const CHECK_IN_MEMBER_MUTATION = gql`
  mutation CheckInMember($input: CheckInMemberInput!) {
    checkInMember(input: $input) {
      success
      message
      member {
        id
        isCheckedIn
        checkinMethods
        lastCheckinAt
        user {
          id
          displayName
        }
      }
    }
  }
`;

const UNCHECK_IN_MEMBER_MUTATION = gql`
  mutation UncheckInMember($input: UncheckInMemberInput!) {
    uncheckInMember(input: $input) {
      success
      message
      member {
        id
        isCheckedIn
        checkinMethods
      }
    }
  }
`;

const REJECT_MEMBER_CHECKIN_MUTATION = gql`
  mutation RejectMemberCheckin($input: RejectMemberCheckinInput!) {
    rejectMemberCheckin(input: $input) {
      success
      message
      member {
        id
        isCheckedIn
        lastCheckinRejectionReason
        lastCheckinRejectedAt
      }
    }
  }
`;

const BLOCK_MEMBER_CHECKIN_MUTATION = gql`
  mutation BlockMemberCheckin($input: BlockMemberCheckinInput!) {
    blockMemberCheckin(input: $input) {
      success
      message
      member {
        id
        checkinBlockedAll
        checkinBlockedMethods
      }
    }
  }
`;

const UNBLOCK_MEMBER_CHECKIN_MUTATION = gql`
  mutation UnblockMemberCheckin($input: UnblockMemberCheckinInput!) {
    unblockMemberCheckin(input: $input) {
      success
      message
      member {
        id
        checkinBlockedAll
        checkinBlockedMethods
      }
    }
  }
`;

const CHECK_IN_BY_EVENT_QR_MUTATION = gql`
  mutation CheckInByEventQr($eventId: ID!, $token: String!) {
    checkInByEventQr(eventId: $eventId, token: $token) {
      success
      message
      member {
        id
        isCheckedIn
        checkinMethods
        user {
          displayName
        }
      }
    }
  }
`;

const CHECK_IN_BY_USER_QR_MUTATION = gql`
  mutation CheckInByUserQr($token: String!) {
    checkInByUserQr(token: $token) {
      success
      message
      member {
        id
        isCheckedIn
        user {
          id
          displayName
        }
      }
    }
  }
`;

const UPDATE_EVENT_CHECKIN_CONFIG_MUTATION = gql`
  mutation UpdateEventCheckinConfig($input: UpdateEventCheckinConfigInput!) {
    updateEventCheckinConfig(input: $input) {
      id
      checkinEnabled
      enabledCheckinMethods
      eventCheckinToken
    }
  }
`;

const ROTATE_EVENT_CHECKIN_TOKEN_MUTATION = gql`
  mutation RotateEventCheckinToken($eventId: ID!) {
    rotateEventCheckinToken(eventId: $eventId) {
      id
      eventCheckinToken
    }
  }
`;

const ROTATE_MEMBER_CHECKIN_TOKEN_MUTATION = gql`
  mutation RotateMemberCheckinToken($eventId: ID!, $memberId: ID!) {
    rotateMemberCheckinToken(eventId: $eventId, memberId: $memberId) {
      id
      memberCheckinToken
    }
  }
`;

const GET_EVENT_CHECKIN_LOGS_QUERY = gql`
  query GetEventCheckinLogs(
    $eventId: ID!
    $limit: Int
    $offset: Int
    $action: CheckinAction
    $method: CheckinMethod
  ) {
    eventCheckinLogs(
      eventId: $eventId
      limit: $limit
      offset: $offset
      action: $action
      method: $method
    ) {
      items {
        id
        action
        method
        source
        result
        reason
        comment
        createdAt
        actor {
          id
          displayName
        }
      }
      pageInfo {
        total
        hasNext
      }
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────────────────────

export const eventCheckinKeys = {
  all: ['eventCheckin'] as const,
  logs: (eventId: string) => ['eventCheckin', 'logs', eventId] as const,
  config: (eventId: string) => ['eventCheckin', 'config', eventId] as const,
  members: (eventId: string) => ['eventCheckin', 'members', eventId] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation Helpers
// ─────────────────────────────────────────────────────────────────────────────

function invalidateCheckinData(eventId: string) {
  const qc = getQueryClient();

  // Invalidate check-in logs
  qc.invalidateQueries({
    queryKey: eventCheckinKeys.logs(eventId),
  });

  // Invalidate event members (check-in status updates)
  qc.invalidateQueries({
    predicate: (q) => {
      if (!Array.isArray(q.queryKey) || q.queryKey[0] !== 'GetEventMembers') {
        return false;
      }
      const variables = q.queryKey[1];
      return (
        variables &&
        typeof variables === 'object' &&
        'eventId' in variables &&
        variables.eventId === eventId
      );
    },
  });

  // Invalidate event details (config, stats)
  qc.invalidateQueries({
    predicate: (q) => {
      if (!Array.isArray(q.queryKey) || q.queryKey[0] !== 'GetEvent') {
        return false;
      }
      const variables = q.queryKey[1];
      return (
        variables &&
        typeof variables === 'object' &&
        'id' in variables &&
        variables.id === eventId
      );
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// User Mutations
// ─────────────────────────────────────────────────────────────────────────────

export function useCheckInSelfMutation(
  options?: UseMutationOptions<
    CheckinResultPayload,
    unknown,
    { eventId: string }
  >
) {
  return useMutation({
    mutationKey: ['CheckInSelf'] as QueryKey,
    mutationFn: async (variables: { eventId: string }) =>
      gqlClient
        .request<{
          checkInSelf: CheckinResultPayload;
        }>(CHECK_IN_SELF_MUTATION, variables)
        .then((res) => res.checkInSelf),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.eventId);
    },
    meta: {
      successMessage: 'Checked in successfully',
    },
    ...options,
  });
}

export function useUncheckInSelfMutation(
  options?: UseMutationOptions<
    CheckinResultPayload,
    unknown,
    { eventId: string }
  >
) {
  return useMutation({
    mutationKey: ['UncheckInSelf'] as QueryKey,
    mutationFn: async (variables: { eventId: string }) =>
      gqlClient
        .request<{
          uncheckInSelf: CheckinResultPayload;
        }>(UNCHECK_IN_SELF_MUTATION, variables)
        .then((res) => res.uncheckInSelf),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.eventId);
    },
    meta: {
      successMessage: 'Check-in removed',
    },
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Moderator Mutations
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckInMemberInput {
  eventId: string;
  userId: string;
  method: CheckinMethod;
  comment?: string;
}

export function useCheckInMemberMutation(
  options?: UseMutationOptions<
    CheckinResultPayload,
    unknown,
    { input: CheckInMemberInput }
  >
) {
  const qc = getQueryClient();

  return useMutation({
    mutationKey: ['CheckInMember'] as QueryKey,
    mutationFn: async (variables: { input: CheckInMemberInput }) =>
      gqlClient
        .request<{
          checkInMember: CheckinResultPayload;
        }>(CHECK_IN_MEMBER_MUTATION, variables)
        .then((res) => res.checkInMember),
    onMutate: async (variables) => {
      const { eventId, userId } = variables.input;

      // Cancel outgoing queries for optimistic update
      await qc.cancelQueries({
        queryKey: ['GetEventMembers', { eventId }],
      });

      // Snapshot previous value
      const previousMembers = qc.getQueryData(['GetEventMembers', { eventId }]);

      // Optimistically update member status
      qc.setQueryData(['GetEventMembers', { eventId }], (old: any) => {
        if (!old?.eventMembers) return old;

        const members = Array.isArray(old.eventMembers)
          ? old.eventMembers
          : [];

        return {
          ...old,
          eventMembers: members.map((member: any) =>
            member.userId === userId
              ? {
                  ...member,
                  isCheckedIn: true,
                  lastCheckinAt: new Date().toISOString(),
                  checkinMethods: member.checkinMethods?.includes(
                    'MODERATOR_PANEL'
                  )
                    ? member.checkinMethods
                    : [...(member.checkinMethods || []), 'MODERATOR_PANEL'],
                }
              : member
          ),
        };
      });

      return { previousMembers };
    },
    onError: (_error, variables, context) => {
      // Rollback on error
      if (context?.previousMembers) {
        qc.setQueryData(
          ['GetEventMembers', { eventId: variables.input.eventId }],
          context.previousMembers
        );
      }
    },
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    meta: {
      successMessage: 'Member checked in',
    },
    ...options,
  });
}

export interface UncheckInMemberInput {
  eventId: string;
  userId: string;
  method: CheckinMethod;
  comment?: string;
}

export function useUncheckInMemberMutation(
  options?: UseMutationOptions<
    CheckinResultPayload,
    unknown,
    { input: UncheckInMemberInput }
  >
) {
  const qc = getQueryClient();

  return useMutation({
    mutationKey: ['UncheckInMember'] as QueryKey,
    mutationFn: async (variables: { input: UncheckInMemberInput }) =>
      gqlClient
        .request<{
          uncheckInMember: CheckinResultPayload;
        }>(UNCHECK_IN_MEMBER_MUTATION, variables)
        .then((res) => res.uncheckInMember),
    onMutate: async (variables) => {
      const { eventId, userId } = variables.input;

      // Cancel outgoing queries for optimistic update
      await qc.cancelQueries({
        queryKey: ['GetEventMembers', { eventId }],
      });

      // Snapshot previous value
      const previousMembers = qc.getQueryData(['GetEventMembers', { eventId }]);

      // Optimistically update member status
      qc.setQueryData(['GetEventMembers', { eventId }], (old: any) => {
        if (!old?.eventMembers) return old;

        const members = Array.isArray(old.eventMembers)
          ? old.eventMembers
          : [];

        return {
          ...old,
          eventMembers: members.map((member: any) =>
            member.userId === userId
              ? {
                  ...member,
                  isCheckedIn: false,
                  lastCheckinAt: null,
                  checkinMethods: member.checkinMethods?.filter(
                    (m: string) => m !== 'MODERATOR_PANEL'
                  ),
                }
              : member
          ),
        };
      });

      return { previousMembers };
    },
    onError: (_error, variables, context) => {
      // Rollback on error
      if (context?.previousMembers) {
        qc.setQueryData(
          ['GetEventMembers', { eventId: variables.input.eventId }],
          context.previousMembers
        );
      }
    },
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    meta: {
      successMessage: 'Check-in removed',
    },
    ...options,
  });
}

export interface RejectMemberCheckinInput {
  eventId: string;
  userId: string;
  reason?: string;
  blockMethod?: CheckinMethod;
  blockAll?: boolean;
  showReasonToUser?: boolean;
}

export function useRejectMemberCheckinMutation(
  options?: UseMutationOptions<
    CheckinResultPayload,
    unknown,
    { input: RejectMemberCheckinInput }
  >
) {
  return useMutation({
    mutationKey: ['RejectMemberCheckin'] as QueryKey,
    mutationFn: async (variables: { input: RejectMemberCheckinInput }) =>
      gqlClient
        .request<{
          rejectMemberCheckin: CheckinResultPayload;
        }>(REJECT_MEMBER_CHECKIN_MUTATION, variables)
        .then((res) => res.rejectMemberCheckin),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    meta: {
      successMessage: 'Check-in rejected',
    },
    ...options,
  });
}

export interface BlockMemberCheckinInput {
  eventId: string;
  userId: string;
  blockScope: 'ALL' | 'METHOD';
  method?: CheckinMethod;
  reason?: string;
}

export function useBlockMemberCheckinMutation(
  options?: UseMutationOptions<
    CheckinResultPayload,
    unknown,
    { input: BlockMemberCheckinInput }
  >
) {
  return useMutation({
    mutationKey: ['BlockMemberCheckin'] as QueryKey,
    mutationFn: async (variables: { input: BlockMemberCheckinInput }) =>
      gqlClient
        .request<{
          blockMemberCheckin: CheckinResultPayload;
        }>(BLOCK_MEMBER_CHECKIN_MUTATION, variables)
        .then((res) => res.blockMemberCheckin),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    meta: {
      successMessage: 'Check-in blocked',
    },
    ...options,
  });
}

export interface UnblockMemberCheckinInput {
  eventId: string;
  userId: string;
  unblockScope: 'ALL' | 'METHOD';
  method?: CheckinMethod;
}

export function useUnblockMemberCheckinMutation(
  options?: UseMutationOptions<
    CheckinResultPayload,
    unknown,
    { input: UnblockMemberCheckinInput }
  >
) {
  return useMutation({
    mutationKey: ['UnblockMemberCheckin'] as QueryKey,
    mutationFn: async (variables: { input: UnblockMemberCheckinInput }) =>
      gqlClient
        .request<{
          unblockMemberCheckin: CheckinResultPayload;
        }>(UNBLOCK_MEMBER_CHECKIN_MUTATION, variables)
        .then((res) => res.unblockMemberCheckin),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    meta: {
      successMessage: 'Check-in unblocked',
    },
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// QR Mutations
// ─────────────────────────────────────────────────────────────────────────────

export function useCheckInByEventQrMutation(
  options?: UseMutationOptions<
    CheckinResultPayload,
    unknown,
    { eventId: string; token: string }
  >
) {
  return useMutation({
    mutationKey: ['CheckInByEventQr'] as QueryKey,
    mutationFn: async (variables: { eventId: string; token: string }) =>
      gqlClient
        .request<{
          checkInByEventQr: CheckinResultPayload;
        }>(CHECK_IN_BY_EVENT_QR_MUTATION, variables)
        .then((res) => res.checkInByEventQr),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.eventId);
    },
    meta: {
      successMessage: 'Checked in via QR code',
    },
    ...options,
  });
}

export function useCheckInByUserQrMutation(
  options?: UseMutationOptions<CheckinResultPayload, unknown, { token: string }>
) {
  return useMutation({
    mutationKey: ['CheckInByUserQr'] as QueryKey,
    mutationFn: async (variables: { token: string }) =>
      gqlClient
        .request<{
          checkInByUserQr: CheckinResultPayload;
        }>(CHECK_IN_BY_USER_QR_MUTATION, variables)
        .then((res) => res.checkInByUserQr),
    meta: {
      successMessage: 'Member checked in',
    },
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Mutations
// ─────────────────────────────────────────────────────────────────────────────

export interface UpdateEventCheckinConfigInput {
  eventId: string;
  checkinEnabled?: boolean;
  enabledCheckinMethods?: CheckinMethod[];
}

export function useUpdateEventCheckinConfigMutation(
  options?: UseMutationOptions<
    {
      id: string;
      checkinEnabled: boolean;
      enabledCheckinMethods: CheckinMethod[];
      eventCheckinToken?: string;
    },
    unknown,
    { input: UpdateEventCheckinConfigInput }
  >
) {
  const qc = getQueryClient();

  return useMutation({
    mutationKey: ['UpdateEventCheckinConfig'] as QueryKey,
    mutationFn: async (variables: { input: UpdateEventCheckinConfigInput }) =>
      gqlClient
        .request<{
          updateEventCheckinConfig: any;
        }>(UPDATE_EVENT_CHECKIN_CONFIG_MUTATION, variables)
        .then((res) => res.updateEventCheckinConfig),
    onMutate: async (variables) => {
      const { eventId, checkinEnabled, enabledCheckinMethods } =
        variables.input;

      // Cancel outgoing queries
      await qc.cancelQueries({
        queryKey: ['GetEvent', { id: eventId }],
      });

      // Snapshot previous value
      const previousEvent = qc.getQueryData(['GetEvent', { id: eventId }]);

      // Optimistically update config
      qc.setQueryData(['GetEvent', { id: eventId }], (old: any) => {
        if (!old?.event) return old;

        return {
          ...old,
          event: {
            ...old.event,
            checkinEnabled: checkinEnabled ?? old.event.checkinEnabled,
            enabledCheckinMethods:
              enabledCheckinMethods ?? old.event.enabledCheckinMethods,
          },
        };
      });

      return { previousEvent };
    },
    onError: (_error, variables, context) => {
      // Rollback on error
      if (context?.previousEvent) {
        qc.setQueryData(
          ['GetEvent', { id: variables.input.eventId }],
          context.previousEvent
        );
      }
    },
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    meta: {
      successMessage: 'Check-in settings updated',
    },
    ...options,
  });
}

export function useRotateEventCheckinTokenMutation(
  options?: UseMutationOptions<
    { id: string; eventCheckinToken: string },
    unknown,
    { eventId: string }
  >
) {
  return useMutation({
    mutationKey: ['RotateEventCheckinToken'] as QueryKey,
    mutationFn: async (variables: { eventId: string }) =>
      gqlClient
        .request<{
          rotateEventCheckinToken: any;
        }>(ROTATE_EVENT_CHECKIN_TOKEN_MUTATION, variables)
        .then((res) => res.rotateEventCheckinToken),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.eventId);
    },
    meta: {
      successMessage: 'QR code token rotated',
    },
    ...options,
  });
}

export function useRotateMemberCheckinTokenMutation(
  options?: UseMutationOptions<
    { id: string; memberCheckinToken: string },
    unknown,
    { eventId: string; memberId: string }
  >
) {
  return useMutation({
    mutationKey: ['RotateMemberCheckinToken'] as QueryKey,
    mutationFn: async (variables: { eventId: string; memberId: string }) =>
      gqlClient
        .request<{
          rotateMemberCheckinToken: any;
        }>(ROTATE_MEMBER_CHECKIN_TOKEN_MUTATION, variables)
        .then((res) => res.rotateMemberCheckinToken),
    meta: {
      successMessage: 'Personal QR code token rotated',
    },
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

export interface GetEventCheckinLogsVariables {
  eventId: string;
  limit?: number;
  offset?: number;
  action?: CheckinAction;
  method?: CheckinMethod;
  enabled?: boolean;
}

export function useGetEventCheckinLogsQuery(
  variables: GetEventCheckinLogsVariables
) {
  const { enabled = true, ...queryVars } = variables;
  
  return useQuery({
    queryKey: eventCheckinKeys.logs(variables.eventId),
    queryFn: async () =>
      gqlClient.request<{
        eventCheckinLogs: {
          items: EventCheckinLog[];
          pageInfo: { total: number; hasNext: boolean };
        };
      }>(GET_EVENT_CHECKIN_LOGS_QUERY, queryVars),
    enabled,
  });
}
