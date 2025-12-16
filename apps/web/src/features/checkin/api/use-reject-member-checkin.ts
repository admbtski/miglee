import {
  RejectMemberCheckinDocument,
  RejectMemberCheckinMutation,
  RejectMemberCheckinMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { invalidateCheckinData } from './checkin-api-helpers';

export function useRejectMemberCheckinMutation(
  options?: UseMutationOptions<
    RejectMemberCheckinMutation,
    Error,
    RejectMemberCheckinMutationVariables
  >
) {
  return useMutation<
    RejectMemberCheckinMutation,
    Error,
    RejectMemberCheckinMutationVariables
  >({
    mutationKey: ['RejectMemberCheckin'],
    mutationFn: async (variables) =>
      gqlClient.request<
        RejectMemberCheckinMutation,
        RejectMemberCheckinMutationVariables
      >(RejectMemberCheckinDocument, variables),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    ...options,
  });
}
