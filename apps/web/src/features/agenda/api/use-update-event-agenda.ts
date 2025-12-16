import {
  UpdateEventAgendaDocument,
  UpdateEventAgendaMutation,
  UpdateEventAgendaMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useUpdateEventAgendaMutation(
  options?: UseMutationOptions<
    UpdateEventAgendaMutation,
    Error,
    UpdateEventAgendaMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    UpdateEventAgendaMutation,
    Error,
    UpdateEventAgendaMutationVariables
  >({
    mutationKey: ['UpdateEventAgenda'],
    mutationFn: async (variables) =>
      gqlClient.request<
        UpdateEventAgendaMutation,
        UpdateEventAgendaMutationVariables
      >(UpdateEventAgendaDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate event detail query to refetch with updated agenda
      if (variables.input.eventId) {
        queryClient.invalidateQueries({
          queryKey: [
            'GetEventAgendaItems',
            { eventId: variables.input.eventId },
          ],
        });
        queryClient.invalidateQueries({
          queryKey: ['GetEventDetail', { id: variables.input.eventId }],
        });
      }
    },
    ...options,
  });
}
