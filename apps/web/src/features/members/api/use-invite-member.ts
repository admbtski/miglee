import {
  InviteMemberDocument,
  InviteMemberMutation,
  InviteMemberMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { invalidateMembers } from './members-api-helpers';

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

export function useInviteMemberMutation(
  options?: UseMutationOptions<
    InviteMemberMutation,
    unknown,
    InviteMemberMutationVariables
  >
) {
  return useMutation<
    InviteMemberMutation,
    unknown,
    InviteMemberMutationVariables
  >(
    buildInviteMemberOptions({
      onSuccess: (_data, vars) => {
        const eventId = vars.input?.eventId;
        if (eventId) {
          invalidateMembers(eventId);
        }
      },
      ...(options ?? {}),
    })
  );
}

