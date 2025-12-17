import {
  DeleteFeedbackQuestionDocument,
  DeleteFeedbackQuestionMutation,
  DeleteFeedbackQuestionMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useDeleteFeedbackQuestionMutation(
  options?: UseMutationOptions<
    DeleteFeedbackQuestionMutation,
    Error,
    DeleteFeedbackQuestionMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    DeleteFeedbackQuestionMutation,
    Error,
    DeleteFeedbackQuestionMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        DeleteFeedbackQuestionMutation,
        DeleteFeedbackQuestionMutationVariables
      >(DeleteFeedbackQuestionDocument, variables),
    onSuccess: () => {
      // Invalidate all questions queries
      queryClient.invalidateQueries({
        queryKey: ['GetEventFeedbackQuestions'],
      });
    },
    ...options,
  });
}
