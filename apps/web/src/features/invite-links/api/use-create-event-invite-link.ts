import {
  CreateEventInviteLinkDocument,
  CreateEventInviteLinkMutation,
  CreateEventInviteLinkMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';

export function buildCreateEventInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CreateEventInviteLinkMutation,
    unknown,
    CreateEventInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  CreateEventInviteLinkMutation,
  unknown,
  CreateEventInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CreateEventInviteLink'] as QueryKey,
    mutationFn: async (variables: CreateEventInviteLinkMutationVariables) =>
      gqlClient.request<
        CreateEventInviteLinkMutation,
        CreateEventInviteLinkMutationVariables
      >(CreateEventInviteLinkDocument, variables),
    meta: {
      successMessage: 'Link zaproszeniowy utworzony pomyślnie',
    },
    ...(options ?? {}),
  };
}

export function useCreateEventInviteLinkMutation(
  options?: UseMutationOptions<
    CreateEventInviteLinkMutation,
    unknown,
    CreateEventInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CreateEventInviteLinkMutation,
    unknown,
    CreateEventInviteLinkMutationVariables
  >(
    buildCreateEventInviteLinkOptions({
      onSuccess: (data, _vars) => {
        // Invalidate the list query for this event
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetEventInviteLinks' &&
            (q.queryKey[1] as any)?.eventId ===
              data.createEventInviteLink.eventId,
        });
      },
      ...(options ?? {}),
    })
  );
}
