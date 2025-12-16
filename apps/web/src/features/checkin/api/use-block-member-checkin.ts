import {
  BlockMemberCheckinDocument,
  BlockMemberCheckinMutation,
  BlockMemberCheckinMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { invalidateCheckinData } from './checkin-api-helpers';

export function useBlockMemberCheckinMutation(
  options?: UseMutationOptions<
    BlockMemberCheckinMutation,
    Error,
    BlockMemberCheckinMutationVariables
  >
) {
  return useMutation<
    BlockMemberCheckinMutation,
    Error,
    BlockMemberCheckinMutationVariables
  >({
    mutationKey: ['BlockMemberCheckin'],
    mutationFn: async (variables) =>
      gqlClient.request<
        BlockMemberCheckinMutation,
        BlockMemberCheckinMutationVariables
      >(BlockMemberCheckinDocument, variables),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    ...options,
  });
}
