import {
  AcceptInviteDocument,
  AcceptInviteMutation,
  AcceptInviteMutationVariables,
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

export function useAcceptInviteMutation(
  options?: UseMutationOptions<
    AcceptInviteMutation,
    unknown,
    AcceptInviteMutationVariables
  >
) {
  const qc = getQueryClient();
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
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
      });
      if (vars.eventId) {
        qc.invalidateQueries({
          queryKey: GET_EVENT_DETAIL_KEY({
            id: vars.eventId,
          }) as QueryKey,
        });
        qc.invalidateQueries({
          queryKey: GET_EVENT_MEMBERS_KEY({
            eventId: vars.eventId,
          }) as QueryKey,
        });
        qc.invalidateQueries({
          queryKey: GET_EVENT_MEMBER_STATS_KEY({
            eventId: vars.eventId,
          }) as QueryKey,
        });
      }
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'GetMyMemberships',
      });
    },
    ...(options ?? {}),
  });
}
