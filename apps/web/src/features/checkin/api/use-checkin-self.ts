/**
 * React Query hooks for Event Check-in System
 */

import {
  CheckInSelfDocument,
  CheckInSelfMutation,
  CheckInSelfMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { invalidateCheckinData } from './checkin-api-helpers';

export function useCheckInSelfMutation(
  options?: UseMutationOptions<
    CheckInSelfMutation,
    Error,
    CheckInSelfMutationVariables
  >
) {
  return useMutation<CheckInSelfMutation, Error, CheckInSelfMutationVariables>({
    mutationKey: ['CheckInSelf'],
    mutationFn: async (variables) =>
      gqlClient.request<CheckInSelfMutation, CheckInSelfMutationVariables>(
        CheckInSelfDocument,
        variables
      ),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.eventId);
    },
    ...options,
  });
}
