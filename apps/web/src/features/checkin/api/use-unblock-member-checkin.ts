import {
  UnblockMemberCheckinDocument,
  UnblockMemberCheckinMutation,
  UnblockMemberCheckinMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { invalidateCheckinData } from './checkin-api-helpers';

export function useUnblockMemberCheckinMutation(
  options?: UseMutationOptions<
    UnblockMemberCheckinMutation,
    Error,
    UnblockMemberCheckinMutationVariables
  >
) {
  return useMutation<
    UnblockMemberCheckinMutation,
    Error,
    UnblockMemberCheckinMutationVariables
  >({
    mutationKey: ['UnblockMemberCheckin'],
    mutationFn: async (variables) =>
      gqlClient.request<
        UnblockMemberCheckinMutation,
        UnblockMemberCheckinMutationVariables
      >(UnblockMemberCheckinDocument, variables),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    ...options,
  });
}
