import {
  JoinWaitlistOpenDocument,
  JoinWaitlistOpenMutation,
  JoinWaitlistOpenMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { invalidateMembershipChange } from './members-api-helpers';

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
        invalidateMembershipChange(vars.eventId);
      },
      ...(options ?? {}),
    })
  );
}

