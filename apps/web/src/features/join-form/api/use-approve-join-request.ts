/**
 * React Query hooks for Join Form (Questions & Requests)
 */

import {
  ApproveJoinRequestDocument,
  ApproveJoinRequestMutation,
  ApproveJoinRequestMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useApproveJoinRequestMutation(
  options?: UseMutationOptions<
    ApproveJoinRequestMutation,
    Error,
    ApproveJoinRequestMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    ApproveJoinRequestMutation,
    Error,
    ApproveJoinRequestMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        ApproveJoinRequestMutation,
        ApproveJoinRequestMutationVariables
      >(ApproveJoinRequestDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate join requests
      queryClient.invalidateQueries({
        queryKey: [
          'GetEventJoinRequests',
          { eventId: variables.input.eventId },
        ],
      });
      // Invalidate members
      queryClient.invalidateQueries({
        queryKey: ['GetEventMembers', { eventId: variables.input.eventId }],
      });
      // Invalidate event
      queryClient.invalidateQueries({
        queryKey: ['GetEventDetail', { id: variables.input.eventId }],
      });
    },
    ...options,
  });
}
