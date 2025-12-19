import {
  PromoteFromWaitlistDocument,
  PromoteFromWaitlistMutation,
  PromoteFromWaitlistMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { invalidateMembers } from './members-api-helpers';

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

