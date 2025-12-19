import {
  BanMemberDocument,
  BanMemberMutation,
  BanMemberMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { invalidateMembers } from './members-api-helpers';

export function buildBanMemberOptions<TContext = unknown>(
  options?: UseMutationOptions<
    BanMemberMutation,
    unknown,
    BanMemberMutationVariables,
    TContext
  >
): UseMutationOptions<
  BanMemberMutation,
  unknown,
  BanMemberMutationVariables,
  TContext
> {
  return {
    mutationKey: ['BanMember'] as QueryKey,
    mutationFn: async (variables: BanMemberMutationVariables) =>
      gqlClient.request<BanMemberMutation, BanMemberMutationVariables>(
        BanMemberDocument,
        variables
      ),
    meta: {
      successMessage: 'Member banned successfully',
    },
    ...(options ?? {}),
  };
}

export function useBanMemberMutation(
  options?: UseMutationOptions<
    BanMemberMutation,
    unknown,
    BanMemberMutationVariables
  >
) {
  return useMutation<BanMemberMutation, unknown, BanMemberMutationVariables>(
    buildBanMemberOptions({
      onSuccess: (_data, vars) => {
        invalidateMembers(vars.input.eventId);
      },
      ...(options ?? {}),
    })
  );
}

