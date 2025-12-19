import {
  LeaveEventDocument,
  LeaveEventMutation,
  LeaveEventMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { invalidateMembershipChange } from './members-api-helpers';

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

export function useLeaveEventMutation(
  options?: UseMutationOptions<
    LeaveEventMutation,
    unknown,
    LeaveEventMutationVariables
  >
) {
  return useMutation<LeaveEventMutation, unknown, LeaveEventMutationVariables>(
    buildLeaveEventOptions({
      onSuccess: (_data, vars) => {
        if (vars.eventId) {
          invalidateMembershipChange(vars.eventId);
        }
      },
      ...(options ?? {}),
    })
  );
}

