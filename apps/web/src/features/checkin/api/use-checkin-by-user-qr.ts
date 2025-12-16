import {
  CheckInByUserQrDocument,
  CheckInByUserQrMutation,
  CheckInByUserQrMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useCheckInByUserQrMutation(
  options?: UseMutationOptions<
    CheckInByUserQrMutation,
    Error,
    CheckInByUserQrMutationVariables
  >
) {
  return useMutation<
    CheckInByUserQrMutation,
    Error,
    CheckInByUserQrMutationVariables
  >({
    mutationKey: ['CheckInByUserQr'],
    mutationFn: async (variables) =>
      gqlClient.request<
        CheckInByUserQrMutation,
        CheckInByUserQrMutationVariables
      >(CheckInByUserQrDocument, variables),
    ...options,
  });
}
