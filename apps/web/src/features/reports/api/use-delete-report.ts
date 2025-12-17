'use client';

import {
  DeleteReportDocument,
  type DeleteReportMutation,
  type DeleteReportMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { reportKeys } from './reports-query-keys';

export function useDeleteReport(
  options?: UseMutationOptions<
    DeleteReportMutation,
    Error,
    DeleteReportMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteReportMutation,
    Error,
    DeleteReportMutationVariables
  >({
    mutationKey: ['DeleteReport'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteReportMutation>(
        DeleteReportDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Report deleted successfully',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
    ...options,
  });
}
