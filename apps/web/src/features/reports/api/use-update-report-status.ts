'use client';

import {
  UpdateReportStatusDocument,
  type UpdateReportStatusMutation,
  type UpdateReportStatusMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { reportKeys } from './reports-query-keys';

export function useUpdateReportStatus(
  options?: UseMutationOptions<
    UpdateReportStatusMutation,
    Error,
    UpdateReportStatusMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateReportStatusMutation,
    Error,
    UpdateReportStatusMutationVariables
  >({
    mutationKey: ['UpdateReportStatus'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UpdateReportStatusMutation>(
        UpdateReportStatusDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Report status updated',
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: reportKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: reportKeys.lists(),
      });
    },
    ...options,
  });
}
