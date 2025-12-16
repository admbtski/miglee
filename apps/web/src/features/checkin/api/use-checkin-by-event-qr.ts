import {
  CheckInByEventQrDocument,
  CheckInByEventQrMutation,
  CheckInByEventQrMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { invalidateCheckinData } from './checkin-api-helpers';

export function useCheckInByEventQrMutation(
  options?: UseMutationOptions<
    CheckInByEventQrMutation,
    Error,
    CheckInByEventQrMutationVariables
  >
) {
  return useMutation<
    CheckInByEventQrMutation,
    Error,
    CheckInByEventQrMutationVariables
  >({
    mutationKey: ['CheckInByEventQr'],
    mutationFn: async (variables) =>
      gqlClient.request<
        CheckInByEventQrMutation,
        CheckInByEventQrMutationVariables
      >(CheckInByEventQrDocument, variables),
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.eventId);
    },
    ...options,
  });
}
