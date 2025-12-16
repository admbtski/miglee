import {
  DeleteEventInviteLinkDocument,
  DeleteEventInviteLinkMutation,
  DeleteEventInviteLinkMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GET_INVITE_LINK_ONE_KEY } from './invite-links-query-keys';

export function buildDeleteEventInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DeleteEventInviteLinkMutation,
    unknown,
    DeleteEventInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  DeleteEventInviteLinkMutation,
  unknown,
  DeleteEventInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['DeleteEventInviteLink'] as QueryKey,
    mutationFn: async (variables: DeleteEventInviteLinkMutationVariables) =>
      gqlClient.request<
        DeleteEventInviteLinkMutation,
        DeleteEventInviteLinkMutationVariables
      >(DeleteEventInviteLinkDocument, variables),
    meta: {
      successMessage: 'Link zaproszeniowy usunięty pomyślnie',
    },
    ...(options ?? {}),
  };
}

export function useDeleteEventInviteLinkMutation(
  options?: UseMutationOptions<
    DeleteEventInviteLinkMutation,
    unknown,
    DeleteEventInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    DeleteEventInviteLinkMutation,
    unknown,
    DeleteEventInviteLinkMutationVariables
  >(
    buildDeleteEventInviteLinkOptions({
      onSuccess: (_data, vars) => {
        // Invalidate all list queries
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetEventInviteLinks',
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
