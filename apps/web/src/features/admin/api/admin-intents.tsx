/**
 * Admin Intent Management API Hooks
 */

import {
  AdminUpdateIntentDocument,
  AdminUpdateIntentMutation,
  AdminUpdateIntentMutationVariables,
  AdminDeleteIntentDocument,
  AdminDeleteIntentMutation,
  AdminDeleteIntentMutationVariables,
  AdminCancelIntentDocument,
  AdminCancelIntentMutation,
  AdminCancelIntentMutationVariables,
  AdminRestoreIntentDocument,
  AdminRestoreIntentMutation,
  AdminRestoreIntentMutationVariables,
  AdminChangeIntentOwnerDocument,
  AdminChangeIntentOwnerMutation,
  AdminChangeIntentOwnerMutationVariables,
  AdminBulkUpdateIntentsDocument,
  AdminBulkUpdateIntentsMutation,
  AdminBulkUpdateIntentsMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

/* ===================== Mutation builders ===================== */

export function buildAdminUpdateIntentOptions(
  options?: UseMutationOptions<
    AdminUpdateIntentMutation,
    unknown,
    AdminUpdateIntentMutationVariables
  >
): UseMutationOptions<
  AdminUpdateIntentMutation,
  unknown,
  AdminUpdateIntentMutationVariables
> {
  return {
    mutationFn: (variables: AdminUpdateIntentMutationVariables) =>
      gqlClient.request<
        AdminUpdateIntentMutation,
        AdminUpdateIntentMutationVariables
      >(AdminUpdateIntentDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminDeleteIntentOptions(
  options?: UseMutationOptions<
    AdminDeleteIntentMutation,
    unknown,
    AdminDeleteIntentMutationVariables
  >
): UseMutationOptions<
  AdminDeleteIntentMutation,
  unknown,
  AdminDeleteIntentMutationVariables
> {
  return {
    mutationFn: (variables: AdminDeleteIntentMutationVariables) =>
      gqlClient.request<
        AdminDeleteIntentMutation,
        AdminDeleteIntentMutationVariables
      >(AdminDeleteIntentDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminCancelIntentOptions(
  options?: UseMutationOptions<
    AdminCancelIntentMutation,
    unknown,
    AdminCancelIntentMutationVariables
  >
): UseMutationOptions<
  AdminCancelIntentMutation,
  unknown,
  AdminCancelIntentMutationVariables
> {
  return {
    mutationFn: (variables: AdminCancelIntentMutationVariables) =>
      gqlClient.request<
        AdminCancelIntentMutation,
        AdminCancelIntentMutationVariables
      >(AdminCancelIntentDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminRestoreIntentOptions(
  options?: UseMutationOptions<
    AdminRestoreIntentMutation,
    unknown,
    AdminRestoreIntentMutationVariables
  >
): UseMutationOptions<
  AdminRestoreIntentMutation,
  unknown,
  AdminRestoreIntentMutationVariables
> {
  return {
    mutationFn: (variables: AdminRestoreIntentMutationVariables) =>
      gqlClient.request<
        AdminRestoreIntentMutation,
        AdminRestoreIntentMutationVariables
      >(AdminRestoreIntentDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminChangeIntentOwnerOptions(
  options?: UseMutationOptions<
    AdminChangeIntentOwnerMutation,
    unknown,
    AdminChangeIntentOwnerMutationVariables
  >
): UseMutationOptions<
  AdminChangeIntentOwnerMutation,
  unknown,
  AdminChangeIntentOwnerMutationVariables
> {
  return {
    mutationFn: (variables: AdminChangeIntentOwnerMutationVariables) =>
      gqlClient.request<
        AdminChangeIntentOwnerMutation,
        AdminChangeIntentOwnerMutationVariables
      >(AdminChangeIntentOwnerDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminBulkUpdateIntentsOptions(
  options?: UseMutationOptions<
    AdminBulkUpdateIntentsMutation,
    unknown,
    AdminBulkUpdateIntentsMutationVariables
  >
): UseMutationOptions<
  AdminBulkUpdateIntentsMutation,
  unknown,
  AdminBulkUpdateIntentsMutationVariables
> {
  return {
    mutationFn: (variables: AdminBulkUpdateIntentsMutationVariables) =>
      gqlClient.request<
        AdminBulkUpdateIntentsMutation,
        AdminBulkUpdateIntentsMutationVariables
      >(AdminBulkUpdateIntentsDocument, variables),
    ...(options ?? {}),
  };
}

/* ========================= Hooks ========================= */

export function useAdminUpdateIntentMutation(
  options?: UseMutationOptions<
    AdminUpdateIntentMutation,
    unknown,
    AdminUpdateIntentMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminUpdateIntentMutation,
    unknown,
    AdminUpdateIntentMutationVariables
  >(
    buildAdminUpdateIntentOptions({
      onSuccess: () => {
        // Invalidate intents list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useAdminDeleteIntentMutation(
  options?: UseMutationOptions<
    AdminDeleteIntentMutation,
    unknown,
    AdminDeleteIntentMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminDeleteIntentMutation,
    unknown,
    AdminDeleteIntentMutationVariables
  >(
    buildAdminDeleteIntentOptions({
      onSuccess: () => {
        // Invalidate intents list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useAdminCancelIntentMutation(
  options?: UseMutationOptions<
    AdminCancelIntentMutation,
    unknown,
    AdminCancelIntentMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminCancelIntentMutation,
    unknown,
    AdminCancelIntentMutationVariables
  >(
    buildAdminCancelIntentOptions({
      onSuccess: () => {
        // Invalidate intents list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useAdminRestoreIntentMutation(
  options?: UseMutationOptions<
    AdminRestoreIntentMutation,
    unknown,
    AdminRestoreIntentMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminRestoreIntentMutation,
    unknown,
    AdminRestoreIntentMutationVariables
  >(
    buildAdminRestoreIntentOptions({
      onSuccess: () => {
        // Invalidate intents list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useAdminChangeIntentOwnerMutation(
  options?: UseMutationOptions<
    AdminChangeIntentOwnerMutation,
    unknown,
    AdminChangeIntentOwnerMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminChangeIntentOwnerMutation,
    unknown,
    AdminChangeIntentOwnerMutationVariables
  >(
    buildAdminChangeIntentOwnerOptions({
      onSuccess: () => {
        // Invalidate intents list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useAdminBulkUpdateIntentsMutation(
  options?: UseMutationOptions<
    AdminBulkUpdateIntentsMutation,
    unknown,
    AdminBulkUpdateIntentsMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    AdminBulkUpdateIntentsMutation,
    unknown,
    AdminBulkUpdateIntentsMutationVariables
  >(
    buildAdminBulkUpdateIntentsOptions({
      onSuccess: () => {
        // Invalidate intents list
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
      },
      ...(options ?? {}),
    })
  );
}
