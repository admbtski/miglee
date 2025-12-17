import {
  SubmitReviewAndFeedbackDocument,
  SubmitReviewAndFeedbackMutation,
  SubmitReviewAndFeedbackMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useSubmitReviewAndFeedbackMutation(
  options?: UseMutationOptions<
    SubmitReviewAndFeedbackMutation,
    Error,
    SubmitReviewAndFeedbackMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    SubmitReviewAndFeedbackMutation,
    Error,
    SubmitReviewAndFeedbackMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        SubmitReviewAndFeedbackMutation,
        SubmitReviewAndFeedbackMutationVariables
      >(SubmitReviewAndFeedbackDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate reviews
      queryClient.invalidateQueries({
        queryKey: ['GetReviews', { eventId: variables.input.eventId }],
      });
      // Invalidate my review
      queryClient.invalidateQueries({
        queryKey: ['GetMyReview', { eventId: variables.input.eventId }],
      });
      // Invalidate feedback results
      queryClient.invalidateQueries({
        queryKey: [
          'GetEventFeedbackResults',
          { eventId: variables.input.eventId },
        ],
      });
      // Invalidate my feedback answers
      queryClient.invalidateQueries({
        queryKey: [
          'GetMyFeedbackAnswers',
          { eventId: variables.input.eventId },
        ],
      });
      // Invalidate event
      queryClient.invalidateQueries({
        queryKey: ['GetEventDetail', { id: variables.input.eventId }],
      });
    },
    ...options,
  });
}
