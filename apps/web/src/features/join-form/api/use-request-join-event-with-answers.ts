import {
  RequestJoinEventWithAnswersDocument,
  RequestJoinEventWithAnswersMutation,
  RequestJoinEventWithAnswersMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useRequestJoinEventWithAnswersMutation(
  options?: UseMutationOptions<
    RequestJoinEventWithAnswersMutation,
    Error,
    RequestJoinEventWithAnswersMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    RequestJoinEventWithAnswersMutation,
    Error,
    RequestJoinEventWithAnswersMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        RequestJoinEventWithAnswersMutation,
        RequestJoinEventWithAnswersMutationVariables
      >(RequestJoinEventWithAnswersDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate event queries
      queryClient.invalidateQueries({
        queryKey: ['GetEventDetail', { id: variables.input.eventId }],
      });
      // Invalidate my join requests
      queryClient.invalidateQueries({
        queryKey: ['GetMyJoinRequests'],
      });
      // Invalidate join requests for this event
      queryClient.invalidateQueries({
        queryKey: [
          'GetEventJoinRequests',
          { eventId: variables.input.eventId },
        ],
      });
    },
    ...options,
  });
}
