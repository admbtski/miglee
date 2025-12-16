import {
  UpdateEventJoinQuestionsDocument,
  UpdateEventJoinQuestionsMutation,
  UpdateEventJoinQuestionsMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useUpdateEventJoinQuestionsMutation(
  options?: UseMutationOptions<
    UpdateEventJoinQuestionsMutation,
    Error,
    UpdateEventJoinQuestionsMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    UpdateEventJoinQuestionsMutation,
    Error,
    UpdateEventJoinQuestionsMutationVariables
  >({
    mutationKey: ['UpdateEventJoinQuestions'],
    mutationFn: async (variables) =>
      gqlClient.request<
        UpdateEventJoinQuestionsMutation,
        UpdateEventJoinQuestionsMutationVariables
      >(UpdateEventJoinQuestionsDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate event detail query to refetch with updated questions
      if (variables.input.eventId) {
        queryClient.invalidateQueries({
          queryKey: ['GetEventDetail', { id: variables.input.eventId }],
        });
        queryClient.invalidateQueries({
          queryKey: [
            'GetEventJoinQuestions',
            { eventId: variables.input.eventId },
          ],
        });
      }
    },
    ...options,
  });
}
