/**
 * Hook for updating Intent Join Questions
 * Bulk replace all questions at once (similar to FAQ)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { UpdateIntentJoinQuestionsDocument } from '@/lib/api/__generated__/react-query-update';
import type { UpdateIntentJoinQuestionsMutationVariables } from '@/lib/api/__generated__/react-query-update';

export function useUpdateIntentJoinQuestionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['UpdateIntentJoinQuestions'],
    mutationFn: async (
      variables: UpdateIntentJoinQuestionsMutationVariables
    ) => {
      const res = await gqlClient.request(
        UpdateIntentJoinQuestionsDocument,
        variables
      );
      return res;
    },
    onSuccess: (_data, variables) => {
      // Invalidate intent detail query to refetch with updated questions
      if (variables.input.intentId) {
        queryClient.invalidateQueries({
          queryKey: ['GetIntentDetail', { id: variables.input.intentId }],
        });
        queryClient.invalidateQueries({
          queryKey: [
            'intentJoinQuestions',
            { intentId: variables.input.intentId },
          ],
        });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Nie udało się zapisać pytań');
    },
  });
}
