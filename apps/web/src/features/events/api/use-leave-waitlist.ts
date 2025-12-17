import {
  LeaveWaitlistDocument,
  LeaveWaitlistMutation,
  LeaveWaitlistMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { invalidateMembers } from './event-api-helpers';

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
