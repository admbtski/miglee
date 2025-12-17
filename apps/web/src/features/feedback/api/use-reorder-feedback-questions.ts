import {
  ReorderFeedbackQuestionsDocument,
  ReorderFeedbackQuestionsMutation,
  ReorderFeedbackQuestionsMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useReorderFeedbackQuestionsMutation(
  options?: UseMutationOptions<
    ReorderFeedbackQuestionsMutation,
    Error,
    ReorderFeedbackQuestionsMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    ReorderFeedbackQuestionsMutation,
    Error,
    ReorderFeedbackQuestionsMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        ReorderFeedbackQuestionsMutation,
        ReorderFeedbackQuestionsMutationVariables
      >(ReorderFeedbackQuestionsDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate questions list
      queryClient.invalidateQueries({
        queryKey: ['GetEventFeedbackQuestions', { eventId: variables.eventId }],
      });
    },
    ...options,
  });
}
