import {
  InviteMemberDocument,
  InviteMemberMutation,
  InviteMemberMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import {
  GET_EVENT_DETAIL_KEY,
  GET_EVENT_MEMBER_STATS_KEY,
  GET_EVENT_MEMBERS_KEY,
} from './events-query-keys';

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
  const qc = getQueryClient();
  return useMutation<
    InviteMemberMutation,
    unknown,
    InviteMemberMutationVariables
  >(
    buildInviteMemberOptions({
      onSuccess: (_data, vars) => {
        const eventId = vars.input?.eventId;
        if (eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBERS_KEY({
              eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBER_STATS_KEY({
              eventId,
            }) as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
