'use client';

import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  CreateReportDocument,
  type CreateReportMutation,
  type CreateReportMutationVariables,
  DeleteReportDocument,
  type DeleteReportMutation,
  type DeleteReportMutationVariables,
  GetReportDocument,
  type GetReportQuery,
  type GetReportQueryVariables,
  GetReportsDocument,
  type GetReportsQuery,
  type GetReportsQueryVariables,
  UpdateReportStatusDocument,
  type UpdateReportStatusMutation,
  type UpdateReportStatusMutationVariables,
} from './__generated__/react-query-update';
import { gqlClient } from './client';

// =============================================================================
// Query Keys
// =============================================================================

export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (filters?: GetReportsQueryVariables) =>
    [...reportKeys.lists(), filters] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
};

// =============================================================================
// Queries (Admin only)
// =============================================================================

/**
 * Get all reports (admin only)
 */
export function useGetReports(
  variables?: GetReportsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetReportsQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetReportsQuery, Error>({
    queryKey: reportKeys.list(variables),
    queryFn: async () => {
      const res = await gqlClient.request<GetReportsQuery>(
        GetReportsDocument,
        variables
      );
      return res;
    },
    ...options,
  });
}

/**
 * Get a single report (admin only)
 */
export function useGetReport(
  variables: GetReportQueryVariables,
  options?: Omit<UseQueryOptions<GetReportQuery, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<GetReportQuery, Error>({
    queryKey: reportKeys.detail(variables.id),
    queryFn: async () => {
      const res = await gqlClient.request<GetReportQuery>(
        GetReportDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.id,
    ...options,
  });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new report
 */
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

/**
 * Update report status (admin only)
 */
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

/**
 * Delete a report (admin only)
 */
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
