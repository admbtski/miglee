import {
  LeaveEventDocument,
  LeaveEventMutation,
  LeaveEventMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import {
  GET_EVENT_DETAIL_KEY,
  GET_EVENT_MEMBER_STATS_KEY,
  GET_EVENT_MEMBERS_KEY,
} from './events-query-keys';

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
