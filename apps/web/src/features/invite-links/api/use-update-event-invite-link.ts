import {
  UpdateEventInviteLinkDocument,
  UpdateEventInviteLinkMutation,
  UpdateEventInviteLinkMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GET_INVITE_LINK_ONE_KEY } from './invite-links-query-keys';

export function buildUpdateEventInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    UpdateEventInviteLinkMutation,
    unknown,
    UpdateEventInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  UpdateEventInviteLinkMutation,
  unknown,
  UpdateEventInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['UpdateEventInviteLink'] as QueryKey,
    mutationFn: async (variables: UpdateEventInviteLinkMutationVariables) =>
      gqlClient.request<
        UpdateEventInviteLinkMutation,
        UpdateEventInviteLinkMutationVariables
      >(UpdateEventInviteLinkDocument, variables),
    meta: {
      successMessage: 'Link zaproszeniowy zaktualizowany pomyślnie',
    },
    ...(options ?? {}),
  };
}
export function useUpdateEventInviteLinkMutation(
  options?: UseMutationOptions<
    UpdateEventInviteLinkMutation,
    unknown,
    UpdateEventInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UpdateEventInviteLinkMutation,
    unknown,
    UpdateEventInviteLinkMutationVariables
  >(
    buildUpdateEventInviteLinkOptions({
      onSuccess: (data, vars) => {
        // Invalidate list queries for this event
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetEventInviteLinks' &&
            (q.queryKey[1] as any)?.eventId ===
              data.updateEventInviteLink.eventId,
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
