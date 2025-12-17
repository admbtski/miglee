import {
  RejectMembershipDocument,
  RejectMembershipMutation,
  RejectMembershipMutationVariables,
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
  const qc = getQueryClient();
  return useMutation<
    RejectMembershipMutation,
    unknown,
    RejectMembershipMutationVariables
  >(
    buildRejectMembershipOptions({
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
