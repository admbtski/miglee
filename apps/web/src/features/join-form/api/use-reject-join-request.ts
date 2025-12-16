import {
  RejectJoinRequestDocument,
  RejectJoinRequestMutation,
  RejectJoinRequestMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useRejectJoinRequestMutation(
  options?: UseMutationOptions<
    RejectJoinRequestMutation,
    Error,
    RejectJoinRequestMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    RejectJoinRequestMutation,
    Error,
    RejectJoinRequestMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        RejectJoinRequestMutation,
        RejectJoinRequestMutationVariables
      >(RejectJoinRequestDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate join requests
      queryClient.invalidateQueries({
        queryKey: [
          'GetEventJoinRequests',
          { eventId: variables.input.eventId },
        ],
      });
      // Invalidate members
      queryClient.invalidateQueries({
        queryKey: ['GetEventMembers', { eventId: variables.input.eventId }],
      });
    },
    ...options,
  });
}
