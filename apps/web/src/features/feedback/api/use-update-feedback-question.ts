import {
  UpdateFeedbackQuestionDocument,
  UpdateFeedbackQuestionMutation,
  UpdateFeedbackQuestionMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useUpdateFeedbackQuestionMutation(
  options?: UseMutationOptions<
    UpdateFeedbackQuestionMutation,
    Error,
    UpdateFeedbackQuestionMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    UpdateFeedbackQuestionMutation,
    Error,
    UpdateFeedbackQuestionMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        UpdateFeedbackQuestionMutation,
        UpdateFeedbackQuestionMutationVariables
      >(UpdateFeedbackQuestionDocument, variables),
    onSuccess: () => {
      // Invalidate all questions queries
      queryClient.invalidateQueries({
        queryKey: ['GetEventFeedbackQuestions'],
      });
    },
    ...options,
  });
}
