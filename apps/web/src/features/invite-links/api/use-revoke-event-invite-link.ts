import {
  RevokeEventInviteLinkDocument,
  RevokeEventInviteLinkMutation,
  RevokeEventInviteLinkMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GET_INVITE_LINK_ONE_KEY } from './invite-links-query-keys';

export function buildRevokeEventInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    RevokeEventInviteLinkMutation,
    unknown,
    RevokeEventInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  RevokeEventInviteLinkMutation,
  unknown,
  RevokeEventInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['RevokeEventInviteLink'] as QueryKey,
    mutationFn: async (variables: RevokeEventInviteLinkMutationVariables) =>
      gqlClient.request<
        RevokeEventInviteLinkMutation,
        RevokeEventInviteLinkMutationVariables
      >(RevokeEventInviteLinkDocument, variables),
    meta: {
      successMessage: 'Link zaproszeniowy odwołany pomyślnie',
    },
    ...(options ?? {}),
  };
}

export function useRevokeEventInviteLinkMutation(
  options?: UseMutationOptions<
    RevokeEventInviteLinkMutation,
    unknown,
    RevokeEventInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    RevokeEventInviteLinkMutation,
    unknown,
    RevokeEventInviteLinkMutationVariables
  >(
    buildRevokeEventInviteLinkOptions({
      onSuccess: (data, vars) => {
        // Invalidate all list queries (to show/hide revoked links)
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetEventInviteLinks' &&
            (q.queryKey[1] as any)?.eventId ===
              data.revokeEventInviteLink.eventId,
        });
        // Invalidate detail query
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_INVITE_LINK_ONE_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
