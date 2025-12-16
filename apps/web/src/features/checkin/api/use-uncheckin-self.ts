import {
  UncheckInSelfDocument,
  UncheckInSelfMutation,
  UncheckInSelfMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { invalidateCheckinData } from './checkin-api-helpers';

export function useUncheckInSelfMutation(
  options?: UseMutationOptions<
    UncheckInSelfMutation,
    Error,
    UncheckInSelfMutationVariables
  >
) {
  return useMutation<
    UncheckInSelfMutation,
    Error,
    UncheckInSelfMutationVariables
  >({
    mutationKey: ['UncheckInSelf'],
    mutationFn: async (variables) =>
      gqlClient.request<UncheckInSelfMutation, UncheckInSelfMutationVariables>(
        UncheckInSelfDocument,
        variables
      ),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.eventId);
    },
    ...options,
  });
}
