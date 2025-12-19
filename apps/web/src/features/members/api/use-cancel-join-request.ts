import {
  CancelJoinRequestDocument,
  CancelJoinRequestMutation,
  CancelJoinRequestMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { invalidateMembershipChange } from './members-api-helpers';

export function buildCancelJoinRequestOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CancelJoinRequestMutation,
    unknown,
    CancelJoinRequestMutationVariables,
    TContext
  >
): UseMutationOptions<
  CancelJoinRequestMutation,
  unknown,
  CancelJoinRequestMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CancelJoinRequest'] as QueryKey,
    mutationFn: async (variables: CancelJoinRequestMutationVariables) =>
      gqlClient.request<
        CancelJoinRequestMutation,
        CancelJoinRequestMutationVariables
      >(CancelJoinRequestDocument, variables),
    meta: {
      successMessage: 'Join request cancelled',
    },
    ...(options ?? {}),
  };
}

export function useCancelJoinRequestMutation(
  options?: UseMutationOptions<
    CancelJoinRequestMutation,
    unknown,
    CancelJoinRequestMutationVariables
  >
) {
  return useMutation<
    CancelJoinRequestMutation,
    unknown,
    CancelJoinRequestMutationVariables
  >(
    buildCancelJoinRequestOptions({
      onSuccess: (_data, vars) => {
        if (vars.eventId) {
          invalidateMembershipChange(vars.eventId);
        }
      },
      ...(options ?? {}),
    })
  );
}

