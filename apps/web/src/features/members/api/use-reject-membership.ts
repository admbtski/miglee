import {
  RejectMembershipDocument,
  RejectMembershipMutation,
  RejectMembershipMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { invalidateMembers } from './members-api-helpers';

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

export function useRejectMembershipMutation(
  options?: UseMutationOptions<
    RejectMembershipMutation,
    unknown,
    RejectMembershipMutationVariables
  >
) {
  return useMutation<
    RejectMembershipMutation,
    unknown,
    RejectMembershipMutationVariables
  >(
    buildRejectMembershipOptions({
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

