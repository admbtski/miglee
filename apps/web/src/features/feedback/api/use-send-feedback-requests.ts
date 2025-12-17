import {
  SendFeedbackRequestsDocument,
  SendFeedbackRequestsMutation,
  SendFeedbackRequestsMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useSendFeedbackRequestsMutation(
  options?: UseMutationOptions<
    SendFeedbackRequestsMutation,
    Error,
    SendFeedbackRequestsMutationVariables
  >
) {
  return useMutation<
    SendFeedbackRequestsMutation,
    Error,
    SendFeedbackRequestsMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        SendFeedbackRequestsMutation,
        SendFeedbackRequestsMutationVariables
      >(SendFeedbackRequestsDocument, variables),
    ...options,
  });
}
