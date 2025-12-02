/**
 * Hook for updating Intent FAQs
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { request, gql } from 'graphql-request';

const UPDATE_INTENT_FAQS_MUTATION = gql`
  mutation UpdateIntentFaqs($input: UpdateIntentFaqsInput!) {
    updateIntentFaqs(input: $input) {
      id
      intentId
      order
      question
      answer
      createdAt
      updatedAt
    }
  }
`;

interface UpdateIntentFaqsInput {
  intentId: string;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export function useUpdateIntentFaqsMutation() {
  const queryClient = useQueryClient();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  return useMutation({
    mutationFn: async (input: UpdateIntentFaqsInput) => {
      const response = await request(
        `${apiUrl}/graphql`,
        UPDATE_INTENT_FAQS_MUTATION,
        { input },
        {
          credentials: 'include',
        } as any
      );
      return response.updateIntentFaqs;
    },
    onSuccess: (_data, variables) => {
      // Invalidate intent detail query to refetch with updated FAQs
      queryClient.invalidateQueries({
        queryKey: ['intentDetail', { id: variables.intentId }],
      });
    },
  });
}
