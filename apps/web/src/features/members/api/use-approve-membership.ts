import {
  ApproveMembershipDocument,
  ApproveMembershipMutation,
  ApproveMembershipMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import {
  invalidateMembers,
  invalidateEventListings,
} from './members-api-helpers';

export function buildApproveMembershipOptions<TContext = unknown>(
  options?: UseMutationOptions<
    ApproveMembershipMutation,
    unknown,
    ApproveMembershipMutationVariables,
    TContext
  >
): UseMutationOptions<
  ApproveMembershipMutation,
  unknown,
  ApproveMembershipMutationVariables,
  TContext
> {
  return {
    mutationKey: ['ApproveMembership'] as QueryKey,
    mutationFn: async (variables: ApproveMembershipMutationVariables) =>
      gqlClient.request<
        ApproveMembershipMutation,
        ApproveMembershipMutationVariables
      >(ApproveMembershipDocument, variables),
    meta: {
      successMessage: 'Membership approved',
    },
    ...(options ?? {}),
  };
}

export function useApproveMembershipMutation(
  options?: UseMutationOptions<
    ApproveMembershipMutation,
    unknown,
    ApproveMembershipMutationVariables
  >
) {
  return useMutation<
    ApproveMembershipMutation,
    unknown,
    ApproveMembershipMutationVariables
  >(
    buildApproveMembershipOptions({
      onSuccess: (_data, vars) => {
        const eventId = vars.input?.eventId;
        if (eventId) {
          invalidateMembers(eventId);
        }
        invalidateEventListings();
      },
      ...(options ?? {}),
    })
  );
}

