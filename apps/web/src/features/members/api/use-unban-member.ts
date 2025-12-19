import {
  UnbanMemberDocument,
  UnbanMemberMutation,
  UnbanMemberMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { invalidateMembers } from './members-api-helpers';

export function buildUnbanMemberOptions<TContext = unknown>(
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

export function useUnbanMemberMutation(
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

