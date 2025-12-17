import {
  CancelPendingOrInviteForUserDocument,
  CancelPendingOrInviteForUserMutation,
  CancelPendingOrInviteForUserMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { invalidateMembers } from './event-api-helpers';

export function buildCancelPendingOrInviteForUserOptions<TContext = unknown>( // <-- NEW
  options?: UseMutationOptions<
    CancelPendingOrInviteForUserMutation,
    unknown,
    CancelPendingOrInviteForUserMutationVariables,
    TContext
  >
): UseMutationOptions<
  CancelPendingOrInviteForUserMutation,
  unknown,
  CancelPendingOrInviteForUserMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CancelPendingOrInviteForUser'] as QueryKey,
    mutationFn: async (
      variables: CancelPendingOrInviteForUserMutationVariables
    ) =>
      gqlClient.request<
        CancelPendingOrInviteForUserMutation,
        CancelPendingOrInviteForUserMutationVariables
      >(CancelPendingOrInviteForUserDocument, variables),
    meta: {
      successMessage: 'Invitation cancelled',
    },
    ...(options ?? {}),
  };
}

export function useCancelPendingOrInviteForUserMutation(
  options?: UseMutationOptions<
    CancelPendingOrInviteForUserMutation,
    unknown,
    CancelPendingOrInviteForUserMutationVariables
  >
) {
  return useMutation<
    CancelPendingOrInviteForUserMutation,
    unknown,
    CancelPendingOrInviteForUserMutationVariables
  >(
    buildCancelPendingOrInviteForUserOptions({
      onSuccess: (_data, vars) => {
        invalidateMembers(vars.input.eventId);
      },
      ...(options ?? {}),
    })
  );
}
