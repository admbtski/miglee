import {
  CreateFeedbackQuestionDocument,
  CreateFeedbackQuestionMutation,
  CreateFeedbackQuestionMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useCreateFeedbackQuestionMutation(
  options?: UseMutationOptions<
    CreateFeedbackQuestionMutation,
    Error,
    CreateFeedbackQuestionMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    CreateFeedbackQuestionMutation,
    Error,
    CreateFeedbackQuestionMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        CreateFeedbackQuestionMutation,
        CreateFeedbackQuestionMutationVariables
      >(CreateFeedbackQuestionDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate questions list
      queryClient.invalidateQueries({
        queryKey: [
          'GetEventFeedbackQuestions',
          { eventId: variables.input.eventId },
        ],
      });
    },
    ...options,
  });
}
