import {
  RotateEventCheckinTokenDocument,
  RotateEventCheckinTokenMutation,
  RotateEventCheckinTokenMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { invalidateCheckinData } from './checkin-api-helpers';

export function useRotateEventCheckinTokenMutation(
  options?: UseMutationOptions<
    RotateEventCheckinTokenMutation,
    Error,
    RotateEventCheckinTokenMutationVariables
  >
) {
  return useMutation<
    RotateEventCheckinTokenMutation,
    Error,
    RotateEventCheckinTokenMutationVariables
  >({
    mutationKey: ['RotateEventCheckinToken'],
    mutationFn: async (variables) =>
      gqlClient.request<
        RotateEventCheckinTokenMutation,
        RotateEventCheckinTokenMutationVariables
      >(RotateEventCheckinTokenDocument, variables),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.eventId);
    },
    ...options,
  });
}
