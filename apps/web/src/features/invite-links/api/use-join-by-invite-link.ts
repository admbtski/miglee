import {
  JoinByInviteLinkDocument,
  JoinByInviteLinkMutation,
  JoinByInviteLinkMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';

export function buildJoinByInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    JoinByInviteLinkMutation,
    unknown,
    JoinByInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  JoinByInviteLinkMutation,
  unknown,
  JoinByInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['JoinByInviteLink'] as QueryKey,
    mutationFn: async (variables: JoinByInviteLinkMutationVariables) =>
      gqlClient.request<
        JoinByInviteLinkMutation,
        JoinByInviteLinkMutationVariables
      >(JoinByInviteLinkDocument, variables),
    meta: {
      successMessage: 'Dołączono do wydarzenia pomyślnie',
    },
    ...(options ?? {}),
  };
}

export function useJoinByInviteLinkMutation(
  options?: UseMutationOptions<
    JoinByInviteLinkMutation,
    unknown,
    JoinByInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    JoinByInviteLinkMutation,
    unknown,
    JoinByInviteLinkMutationVariables
  >(
    buildJoinByInviteLinkOptions({
      onSuccess: (data, _vars) => {
        // Invalidate event queries
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            (q.queryKey[0] === 'GetEventDetail' ||
              q.queryKey[0] === 'GetEvents'),
        });
        // Invalidate memberships
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'myMemberships',
        });
        // Invalidate specific event
        if (data.joinByInviteLink.id) {
          qc.invalidateQueries({
            queryKey: [
              'GetEventDetail',
              { id: data.joinByInviteLink.id },
            ] as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
