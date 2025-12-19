import {
  KickMemberDocument,
  KickMemberMutation,
  KickMemberMutationVariables,
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

export function buildKickMemberOptions<TContext = unknown>(
  options?: UseMutationOptions<
    KickMemberMutation,
    unknown,
    KickMemberMutationVariables,
    TContext
  >
): UseMutationOptions<
  KickMemberMutation,
  unknown,
  KickMemberMutationVariables,
  TContext
> {
  return {
    mutationKey: ['KickMember'] as QueryKey,
    mutationFn: async (variables: KickMemberMutationVariables) =>
      gqlClient.request<KickMemberMutation, KickMemberMutationVariables>(
        KickMemberDocument,
        variables
      ),
    meta: {
      successMessage: 'Member kicked successfully',
    },
    ...(options ?? {}),
  };
}

export function useKickMemberMutation(
  options?: UseMutationOptions<
    KickMemberMutation,
    unknown,
    KickMemberMutationVariables
  >
) {
  return useMutation<KickMemberMutation, unknown, KickMemberMutationVariables>(
    buildKickMemberOptions({
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

