'use client';

import {
  CreateReportDocument,
  type CreateReportMutation,
  type CreateReportMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { reportKeys } from './reports-query-keys';

export function useCreateReport(
  options?: UseMutationOptions<
    CreateReportMutation,
    Error,
    CreateReportMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    CreateReportMutation,
    Error,
    CreateReportMutationVariables
  >({
    mutationKey: ['CreateReport'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<CreateReportMutation>(
        CreateReportDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Report submitted successfully',
    },
    onSuccess: () => {
      // Invalidate reports list (for admins)
      queryClient.invalidateQueries({
        queryKey: reportKeys.lists(),
      });
    },
    ...options,
  });
}
