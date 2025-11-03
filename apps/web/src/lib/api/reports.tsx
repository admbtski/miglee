'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type {
  GetReportsQuery,
  GetReportsQueryVariables,
  GetReportQuery,
  GetReportQueryVariables,
  CreateReportMutation,
  CreateReportMutationVariables,
  UpdateReportStatusMutation,
  UpdateReportStatusMutationVariables,
  DeleteReportMutation,
  DeleteReportMutationVariables,
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
        /* GraphQL */ `
          query GetReports(
            $limit: Int = 20
            $offset: Int = 0
            $status: ReportStatus
            $entity: ReportEntity
          ) {
            reports(
              limit: $limit
              offset: $offset
              status: $status
              entity: $entity
            ) {
              ...ReportsResultCore
            }
          }
        `,
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
        /* GraphQL */ `
          query GetReport($id: ID!) {
            report(id: $id) {
              ...ReportCore
            }
          }
        `,
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
    mutationFn: async (variables) => {
      const res = await gqlClient.request<CreateReportMutation>(
        /* GraphQL */ `
          mutation CreateReport($input: CreateReportInput!) {
            createReport(input: $input) {
              ...ReportCore
            }
          }
        `,
        variables
      );
      return res;
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
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UpdateReportStatusMutation>(
        /* GraphQL */ `
          mutation UpdateReportStatus(
            $id: ID!
            $input: UpdateReportStatusInput!
          ) {
            updateReportStatus(id: $id, input: $input) {
              ...ReportCore
            }
          }
        `,
        variables
      );
      return res;
    },
    onSuccess: (data, variables) => {
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
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteReportMutation>(
        /* GraphQL */ `
          mutation DeleteReport($id: ID!) {
            deleteReport(id: $id)
          }
        `,
        variables
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
    ...options,
  });
}
