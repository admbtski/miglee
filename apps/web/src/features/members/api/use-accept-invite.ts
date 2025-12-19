import {
  AcceptInviteDocument,
  AcceptInviteMutation,
  AcceptInviteMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { invalidateMembershipChange } from './members-api-helpers';

export function useAcceptInviteMutation(
  options?: UseMutationOptions<
    AcceptInviteMutation,
    unknown,
    AcceptInviteMutationVariables
  >
) {
  return useMutation<
    AcceptInviteMutation,
    unknown,
    AcceptInviteMutationVariables
  >({
    mutationFn: (variables: AcceptInviteMutationVariables) =>
      gqlClient.request<AcceptInviteMutation, AcceptInviteMutationVariables>(
        AcceptInviteDocument,
        variables
      ),
    mutationKey: ['AcceptInvite'],
    meta: {
      successMessage: 'Invitation accepted successfully',
    },
    onSuccess: (_data, vars) => {
      if (vars.eventId) {
        invalidateMembershipChange(vars.eventId);
      }
    },
    ...(options ?? {}),
  });
}

