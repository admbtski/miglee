/**
 * React Query hooks for Event Check-in System
 */

import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  CheckInSelfDocument,
  CheckInSelfMutation,
  CheckInSelfMutationVariables,
  UncheckInSelfDocument,
  UncheckInSelfMutation,
  UncheckInSelfMutationVariables,
  CheckInMemberDocument,
  CheckInMemberMutation,
  CheckInMemberMutationVariables,
  UncheckInMemberDocument,
  UncheckInMemberMutation,
  UncheckInMemberMutationVariables,
  RejectMemberCheckinDocument,
  RejectMemberCheckinMutation,
  RejectMemberCheckinMutationVariables,
  BlockMemberCheckinDocument,
  BlockMemberCheckinMutation,
  BlockMemberCheckinMutationVariables,
  UnblockMemberCheckinDocument,
  UnblockMemberCheckinMutation,
  UnblockMemberCheckinMutationVariables,
  CheckInByEventQrDocument,
  CheckInByEventQrMutation,
  CheckInByEventQrMutationVariables,
  CheckInByUserQrDocument,
  CheckInByUserQrMutation,
  CheckInByUserQrMutationVariables,
  UpdateEventCheckinConfigDocument,
  UpdateEventCheckinConfigMutation,
  UpdateEventCheckinConfigMutationVariables,
  RotateEventCheckinTokenDocument,
  RotateEventCheckinTokenMutation,
  RotateEventCheckinTokenMutationVariables,
  RotateMemberCheckinTokenDocument,
  RotateMemberCheckinTokenMutation,
  RotateMemberCheckinTokenMutationVariables,
  GetEventCheckinLogsDocument,
  GetEventCheckinLogsQuery,
  GetEventCheckinLogsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';

/* --------------------------------- KEYS ---------------------------------- */

export const GET_EVENT_CHECKIN_LOGS_KEY = (
  variables: GetEventCheckinLogsQueryVariables
) => ['GetEventCheckinLogs', variables] as const;

/* ----------------------------- QUERY BUILDERS ---------------------------- */

export function buildGetEventCheckinLogsOptions(
  variables: GetEventCheckinLogsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventCheckinLogsQuery,
      Error,
      GetEventCheckinLogsQuery['eventCheckinLogs'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetEventCheckinLogsQuery,
  Error,
  GetEventCheckinLogsQuery['eventCheckinLogs'],
  QueryKey
> {
  return {
    queryKey: GET_EVENT_CHECKIN_LOGS_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        GetEventCheckinLogsQuery,
        GetEventCheckinLogsQueryVariables
      >(GetEventCheckinLogsDocument, variables),
    select: (data) => data.eventCheckinLogs,
    ...(options ?? {}),
  };
}

/* ------------------------- INVALIDATION HELPERS -------------------------- */

export function invalidateCheckinData(eventId: string) {
  const qc = getQueryClient();

  qc.invalidateQueries({
    predicate: (q) => {
      if (!Array.isArray(q.queryKey)) return false;
      const [key, vars] = q.queryKey;
      if (
        key === 'GetEventCheckinLogs' &&
        vars &&
        typeof vars === 'object' &&
        'eventId' in vars &&
        vars.eventId === eventId
      ) {
        return true;
      }
      if (
        key === 'GetEventMembers' &&
        vars &&
        typeof vars === 'object' &&
        'eventId' in vars &&
        vars.eventId === eventId
      ) {
        return true;
      }
      if (
        key === 'GetEvent' &&
        vars &&
        typeof vars === 'object' &&
        'id' in vars &&
        vars.id === eventId
      ) {
        return true;
      }
      return false;
    },
  });
}

/* --------------------------------- HOOKS --------------------------------- */

// Queries

export function useGetEventCheckinLogsQuery(
  variables: GetEventCheckinLogsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventCheckinLogsQuery,
      Error,
      GetEventCheckinLogsQuery['eventCheckinLogs'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventCheckinLogsOptions(variables, options));
}

// User Mutations

export function useCheckInSelfMutation(
  options?: UseMutationOptions<
    CheckInSelfMutation,
    Error,
    CheckInSelfMutationVariables
  >
) {
  return useMutation<CheckInSelfMutation, Error, CheckInSelfMutationVariables>(
    {
      mutationKey: ['CheckInSelf'],
      mutationFn: async (variables) =>
        gqlClient.request<CheckInSelfMutation, CheckInSelfMutationVariables>(
          CheckInSelfDocument,
          variables
        ),
      onSuccess: (_data, variables) => {
        invalidateCheckinData(variables.eventId);
      },
      ...options,
    }
  );
}

export function useUncheckInSelfMutation(
  options?: UseMutationOptions<
    UncheckInSelfMutation,
    Error,
    UncheckInSelfMutationVariables
  >
) {
  return useMutation<
    UncheckInSelfMutation,
    Error,
    UncheckInSelfMutationVariables
  >({
    mutationKey: ['UncheckInSelf'],
    mutationFn: async (variables) =>
      gqlClient.request<
        UncheckInSelfMutation,
        UncheckInSelfMutationVariables
      >(UncheckInSelfDocument, variables),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.eventId);
    },
    ...options,
  });
}

// Moderator Mutations

export function useCheckInMemberMutation(
  options?: UseMutationOptions<
    CheckInMemberMutation,
    Error,
    CheckInMemberMutationVariables,
    { previousMembers: unknown }
  >
) {
  const qc = getQueryClient();

  return useMutation<
    CheckInMemberMutation,
    Error,
    CheckInMemberMutationVariables,
    { previousMembers: unknown }
  >({
    mutationKey: ['CheckInMember'],
    mutationFn: async (variables) =>
      gqlClient.request<CheckInMemberMutation, CheckInMemberMutationVariables>(
        CheckInMemberDocument,
        variables
      ),
    onMutate: async (variables) => {
      const { eventId, userId } = variables.input;

      await qc.cancelQueries({
        queryKey: ['GetEventMembers', { eventId }],
      });

      const previousMembers = qc.getQueryData(['GetEventMembers', { eventId }]);

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
                    variables.input.method
                  )
                    ? member.checkinMethods
                    : [...(member.checkinMethods || []), variables.input.method],
                }
              : member
          ),
        };
      });

      return { previousMembers };
    },
    onError: (_error, variables, context) => {
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
    ...options,
  });
}

export function useUncheckInMemberMutation(
  options?: UseMutationOptions<
    UncheckInMemberMutation,
    Error,
    UncheckInMemberMutationVariables,
    { previousMembers: unknown }
  >
) {
  const qc = getQueryClient();

  return useMutation<
    UncheckInMemberMutation,
    Error,
    UncheckInMemberMutationVariables,
    { previousMembers: unknown }
  >({
    mutationKey: ['UncheckInMember'],
    mutationFn: async (variables) =>
      gqlClient.request<
        UncheckInMemberMutation,
        UncheckInMemberMutationVariables
      >(UncheckInMemberDocument, variables),
    onMutate: async (variables) => {
      const { eventId, userId, method } = variables.input;

      await qc.cancelQueries({
        queryKey: ['GetEventMembers', { eventId }],
      });

      const previousMembers = qc.getQueryData(['GetEventMembers', { eventId }]);

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
                  isCheckedIn: method
                    ? member.checkinMethods?.length > 1
                    : false,
                  lastCheckinAt: method
                    ? member.lastCheckinAt
                    : null,
                  checkinMethods: method
                    ? member.checkinMethods?.filter((m: string) => m !== method)
                    : [],
                }
              : member
          ),
        };
      });

      return { previousMembers };
    },
    onError: (_error, variables, context) => {
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
    ...options,
  });
}

export function useRejectMemberCheckinMutation(
  options?: UseMutationOptions<
    RejectMemberCheckinMutation,
    Error,
    RejectMemberCheckinMutationVariables
  >
) {
  return useMutation<
    RejectMemberCheckinMutation,
    Error,
    RejectMemberCheckinMutationVariables
  >({
    mutationKey: ['RejectMemberCheckin'],
    mutationFn: async (variables) =>
      gqlClient.request<
        RejectMemberCheckinMutation,
        RejectMemberCheckinMutationVariables
      >(RejectMemberCheckinDocument, variables),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    ...options,
  });
}

export function useBlockMemberCheckinMutation(
  options?: UseMutationOptions<
    BlockMemberCheckinMutation,
    Error,
    BlockMemberCheckinMutationVariables
  >
) {
  return useMutation<
    BlockMemberCheckinMutation,
    Error,
    BlockMemberCheckinMutationVariables
  >({
    mutationKey: ['BlockMemberCheckin'],
    mutationFn: async (variables) =>
      gqlClient.request<
        BlockMemberCheckinMutation,
        BlockMemberCheckinMutationVariables
      >(BlockMemberCheckinDocument, variables),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    ...options,
  });
}

export function useUnblockMemberCheckinMutation(
  options?: UseMutationOptions<
    UnblockMemberCheckinMutation,
    Error,
    UnblockMemberCheckinMutationVariables
  >
) {
  return useMutation<
    UnblockMemberCheckinMutation,
    Error,
    UnblockMemberCheckinMutationVariables
  >({
    mutationKey: ['UnblockMemberCheckin'],
    mutationFn: async (variables) =>
      gqlClient.request<
        UnblockMemberCheckinMutation,
        UnblockMemberCheckinMutationVariables
      >(UnblockMemberCheckinDocument, variables),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    ...options,
  });
}

// QR Mutations

export function useCheckInByEventQrMutation(
  options?: UseMutationOptions<
    CheckInByEventQrMutation,
    Error,
    CheckInByEventQrMutationVariables
  >
) {
  return useMutation<
    CheckInByEventQrMutation,
    Error,
    CheckInByEventQrMutationVariables
  >({
    mutationKey: ['CheckInByEventQr'],
    mutationFn: async (variables) =>
      gqlClient.request<
        CheckInByEventQrMutation,
        CheckInByEventQrMutationVariables
      >(CheckInByEventQrDocument, variables),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.eventId);
    },
    ...options,
  });
}

export function useCheckInByUserQrMutation(
  options?: UseMutationOptions<
    CheckInByUserQrMutation,
    Error,
    CheckInByUserQrMutationVariables
  >
) {
  return useMutation<
    CheckInByUserQrMutation,
    Error,
    CheckInByUserQrMutationVariables
  >({
    mutationKey: ['CheckInByUserQr'],
    mutationFn: async (variables) =>
      gqlClient.request<
        CheckInByUserQrMutation,
        CheckInByUserQrMutationVariables
      >(CheckInByUserQrDocument, variables),
    ...options,
  });
}

// Configuration Mutations

export function useUpdateEventCheckinConfigMutation(
  options?: UseMutationOptions<
    UpdateEventCheckinConfigMutation,
    Error,
    UpdateEventCheckinConfigMutationVariables,
    { previousEvent: unknown }
  >
) {
  const qc = getQueryClient();

  return useMutation<
    UpdateEventCheckinConfigMutation,
    Error,
    UpdateEventCheckinConfigMutationVariables,
    { previousEvent: unknown }
  >({
    mutationKey: ['UpdateEventCheckinConfig'],
    mutationFn: async (variables) =>
      gqlClient.request<
        UpdateEventCheckinConfigMutation,
        UpdateEventCheckinConfigMutationVariables
      >(UpdateEventCheckinConfigDocument, variables),
    onMutate: async (variables) => {
      const { eventId, checkinEnabled, enabledCheckinMethods } =
        variables.input;

      await qc.cancelQueries({
        queryKey: ['GetEvent', { id: eventId }],
      });

      const previousEvent = qc.getQueryData(['GetEvent', { id: eventId }]);

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
    ...options,
  });
}

export function useRotateEventCheckinTokenMutation(
  options?: UseMutationOptions<
    RotateEventCheckinTokenMutation,
    Error,
    RotateEventCheckinTokenMutationVariables
  >
) {
  return useMutation<
    RotateEventCheckinTokenMutation,
    Error,
    RotateEventCheckinTokenMutationVariables
  >({
    mutationKey: ['RotateEventCheckinToken'],
    mutationFn: async (variables) =>
      gqlClient.request<
        RotateEventCheckinTokenMutation,
        RotateEventCheckinTokenMutationVariables
      >(RotateEventCheckinTokenDocument, variables),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.eventId);
    },
    ...options,
  });
}

export function useRotateMemberCheckinTokenMutation(
  options?: UseMutationOptions<
    RotateMemberCheckinTokenMutation,
    Error,
    RotateMemberCheckinTokenMutationVariables
  >
) {
  return useMutation<
    RotateMemberCheckinTokenMutation,
    Error,
    RotateMemberCheckinTokenMutationVariables
  >({
    mutationKey: ['RotateMemberCheckinToken'],
    mutationFn: async (variables) =>
      gqlClient.request<
        RotateMemberCheckinTokenMutation,
        RotateMemberCheckinTokenMutationVariables
      >(RotateMemberCheckinTokenDocument, variables),
    ...options,
  });
}
