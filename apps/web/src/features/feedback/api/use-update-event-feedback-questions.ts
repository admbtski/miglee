import {
  UpdateEventFeedbackQuestionsDocument,
  UpdateEventFeedbackQuestionsMutation,
  UpdateEventFeedbackQuestionsMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useUpdateEventFeedbackQuestionsMutation(
  options?: UseMutationOptions<
    UpdateEventFeedbackQuestionsMutation,
    Error,
    UpdateEventFeedbackQuestionsMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    UpdateEventFeedbackQuestionsMutation,
    Error,
    UpdateEventFeedbackQuestionsMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        UpdateEventFeedbackQuestionsMutation,
        UpdateEventFeedbackQuestionsMutationVariables
      >(UpdateEventFeedbackQuestionsDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate questions list
      queryClient.invalidateQueries({
        queryKey: [
          'GetEventFeedbackQuestions',
          { eventId: variables.input.eventId },
        ],
      });
      // Invalidate results as well since questions might have changed
      queryClient.invalidateQueries({
        queryKey: [
          'GetEventFeedbackResults',
          { eventId: variables.input.eventId },
        ],
      });
    },
    ...options,
  });
}
