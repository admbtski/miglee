import {
  UpdateEventFaqsDocument,
  UpdateEventFaqsMutation,
  UpdateEventFaqsMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GET_EVENT_DETAIL_KEY } from '../../events/api/events-query-keys';

export function useUpdateEventFaqsMutation(
  options?: UseMutationOptions<
    UpdateEventFaqsMutation,
    Error,
    UpdateEventFaqsMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UpdateEventFaqsMutation,
    Error,
    UpdateEventFaqsMutationVariables
  >({
    mutationKey: ['UpdateEventFaqs'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UpdateEventFaqsMutation>(
        UpdateEventFaqsDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'FAQ updated successfully',
    },
    onSuccess: (_data, variables) => {
      // Invalidate event detail query to refetch with updated FAQs
      if (variables.input.eventId) {
        qc.invalidateQueries({
          queryKey: GET_EVENT_DETAIL_KEY({
            id: variables.input.eventId,
          }) as unknown as QueryKey,
        });
      }
    },
    ...options,
  });
}
