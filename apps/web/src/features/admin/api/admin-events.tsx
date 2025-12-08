/**
 * Admin Event Management API Hooks
 */

import {
  AdminUpdateEventDocument,
  AdminUpdateEventMutation,
  AdminUpdateEventMutationVariables,
  AdminDeleteEventDocument,
  AdminDeleteEventMutation,
  AdminDeleteEventMutationVariables,
  AdminCancelEventDocument,
  AdminCancelEventMutation,
  AdminCancelEventMutationVariables,
  AdminRestoreEventDocument,
  AdminRestoreEventMutation,
  AdminRestoreEventMutationVariables,
  AdminChangeEventOwnerDocument,
  AdminChangeEventOwnerMutation,
  AdminChangeEventOwnerMutationVariables,
  AdminBulkUpdateEventsDocument,
  AdminBulkUpdateEventsMutation,
  AdminBulkUpdateEventsMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

/* ===================== Mutation builders ===================== */

export function buildAdminUpdateEventOptions(
  options?: UseMutationOptions<
    AdminUpdateEventMutation,
    unknown,
    AdminUpdateEventMutationVariables
  >
): UseMutationOptions<
  AdminUpdateEventMutation,
  unknown,
  AdminUpdateEventMutationVariables
> {
  return {
    mutationFn: (variables: AdminUpdateEventMutationVariables) =>
      gqlClient.request<
        AdminUpdateEventMutation,
        AdminUpdateEventMutationVariables
      >(AdminUpdateEventDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminDeleteEventOptions(
  options?: UseMutationOptions<
    AdminDeleteEventMutation,
    unknown,
    AdminDeleteEventMutationVariables
  >
): UseMutationOptions<
  AdminDeleteEventMutation,
  unknown,
  AdminDeleteEventMutationVariables
> {
  return {
    mutationFn: (variables: AdminDeleteEventMutationVariables) =>
      gqlClient.request<
        AdminDeleteEventMutation,
        AdminDeleteEventMutationVariables
      >(AdminDeleteEventDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminCancelEventOptions(
  options?: UseMutationOptions<
    AdminCancelEventMutation,
    unknown,
    AdminCancelEventMutationVariables
  >
): UseMutationOptions<
  AdminCancelEventMutation,
  unknown,
  AdminCancelEventMutationVariables
> {
  return {
    mutationFn: (variables: AdminCancelEventMutationVariables) =>
      gqlClient.request<
        AdminCancelEventMutation,
        AdminCancelEventMutationVariables
      >(AdminCancelEventDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminRestoreEventOptions(
  options?: UseMutationOptions<
    AdminRestoreEventMutation,
    unknown,
    AdminRestoreEventMutationVariables
  >
): UseMutationOptions<
  AdminRestoreEventMutation,
  unknown,
  AdminRestoreEventMutationVariables
> {
  return {
    mutationFn: (variables: AdminRestoreEventMutationVariables) =>
      gqlClient.request<
        AdminRestoreEventMutation,
        AdminRestoreEventMutationVariables
      >(AdminRestoreEventDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminChangeEventOwnerOptions(
  options?: UseMutationOptions<
    AdminChangeEventOwnerMutation,
    unknown,
    AdminChangeEventOwnerMutationVariables
  >
): UseMutationOptions<
  AdminChangeEventOwnerMutation,
  unknown,
  AdminChangeEventOwnerMutationVariables
> {
  return {
    mutationFn: (variables: AdminChangeEventOwnerMutationVariables) =>
      gqlClient.request<
        AdminChangeEventOwnerMutation,
        AdminChangeEventOwnerMutationVariables
      >(AdminChangeEventOwnerDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminBulkUpdateEventsOptions(
  options?: UseMutationOptions<
    AdminBulkUpdateEventsMutation,
    unknown,
    AdminBulkUpdateEventsMutationVariables
  >
): UseMutationOptions<
  AdminBulkUpdateEventsMutation,
  unknown,
  AdminBulkUpdateEventsMutationVariables
> {
  return {
    mutationFn: (variables: AdminBulkUpdateEventsMutationVariables) =>
      gqlClient.request<
        AdminBulkUpdateEventsMutation,
        AdminBulkUpdateEventsMutationVariables
      >(AdminBulkUpdateEventsDocument, variables),
    ...(options ?? {}),
  };
}

/* ========================= Hooks ========================= */

export function useAdminUpdateEventMutation(
  options?: UseMutationOptions<
    AdminUpdateEventMutation,
    unknown,
    AdminUpdateEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminUpdateEventMutation,
    unknown,
    AdminUpdateEventMutationVariables
  >(
    buildAdminUpdateEventOptions({
      onSuccess: () => {
        // Invalidate events list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useAdminDeleteEventMutation(
  options?: UseMutationOptions<
    AdminDeleteEventMutation,
    unknown,
    AdminDeleteEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminDeleteEventMutation,
    unknown,
    AdminDeleteEventMutationVariables
  >(
    buildAdminDeleteEventOptions({
      onSuccess: () => {
        // Invalidate events list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useAdminCancelEventMutation(
  options?: UseMutationOptions<
    AdminCancelEventMutation,
    unknown,
    AdminCancelEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminCancelEventMutation,
    unknown,
    AdminCancelEventMutationVariables
  >(
    buildAdminCancelEventOptions({
      onSuccess: () => {
        // Invalidate events list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useAdminRestoreEventMutation(
  options?: UseMutationOptions<
    AdminRestoreEventMutation,
    unknown,
    AdminRestoreEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminRestoreEventMutation,
    unknown,
    AdminRestoreEventMutationVariables
  >(
    buildAdminRestoreEventOptions({
      onSuccess: () => {
        // Invalidate events list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useAdminChangeEventOwnerMutation(
  options?: UseMutationOptions<
    AdminChangeEventOwnerMutation,
    unknown,
    AdminChangeEventOwnerMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminChangeEventOwnerMutation,
    unknown,
    AdminChangeEventOwnerMutationVariables
  >(
    buildAdminChangeEventOwnerOptions({
      onSuccess: () => {
        // Invalidate events list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useAdminBulkUpdateEventsMutation(
  options?: UseMutationOptions<
    AdminBulkUpdateEventsMutation,
    unknown,
    AdminBulkUpdateEventsMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminBulkUpdateEventsMutation,
    unknown,
    AdminBulkUpdateEventsMutationVariables
  >(
    buildAdminBulkUpdateEventsOptions({
      onSuccess: () => {
        // Invalidate events list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
      },
      ...(options ?? {}),
    })
  );
}
