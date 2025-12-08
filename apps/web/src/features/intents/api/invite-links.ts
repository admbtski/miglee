/**
 * React Query hooks for Intent Invite Links
 */

import {
  IntentInviteLinksDocument,
  IntentInviteLinksQuery,
  IntentInviteLinksQueryVariables,
  IntentInviteLinkDocument,
  IntentInviteLinkQuery,
  IntentInviteLinkQueryVariables,
  ValidateInviteLinkDocument,
  ValidateInviteLinkQuery,
  ValidateInviteLinkQueryVariables,
  CreateIntentInviteLinkDocument,
  CreateIntentInviteLinkMutation,
  CreateIntentInviteLinkMutationVariables,
  UpdateIntentInviteLinkDocument,
  UpdateIntentInviteLinkMutation,
  UpdateIntentInviteLinkMutationVariables,
  RevokeIntentInviteLinkDocument,
  RevokeIntentInviteLinkMutation,
  RevokeIntentInviteLinkMutationVariables,
  DeleteIntentInviteLinkDocument,
  DeleteIntentInviteLinkMutation,
  DeleteIntentInviteLinkMutationVariables,
  JoinByInviteLinkDocument,
  JoinByInviteLinkMutation,
  JoinByInviteLinkMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';

/* --------------------------------- KEYS ---------------------------------- */
export const GET_INVITE_LINKS_LIST_KEY = (
  variables: IntentInviteLinksQueryVariables
) => ['GetIntentInviteLinks', variables] as const;

export const GET_INVITE_LINK_ONE_KEY = (
  variables: IntentInviteLinkQueryVariables
) => ['GetIntentInviteLink', variables] as const;

export const VALIDATE_INVITE_LINK_KEY = (
  variables: ValidateInviteLinkQueryVariables
) => ['ValidateInviteLink', variables] as const;

/* ----------------------------- QUERY BUILDERS ---------------------------- */
export function buildGetIntentInviteLinksOptions(
  variables: IntentInviteLinksQueryVariables,
  options?: Omit<
    UseQueryOptions<
      IntentInviteLinksQuery,
      Error,
      IntentInviteLinksQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  IntentInviteLinksQuery,
  Error,
  IntentInviteLinksQuery,
  QueryKey
> {
  return {
    queryKey: GET_INVITE_LINKS_LIST_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        IntentInviteLinksQuery,
        IntentInviteLinksQueryVariables
      >(IntentInviteLinksDocument, variables),
    ...(options ?? {}),
  };
}

export function buildGetIntentInviteLinkOptions(
  variables: IntentInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<
      IntentInviteLinkQuery,
      Error,
      IntentInviteLinkQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  IntentInviteLinkQuery,
  Error,
  IntentInviteLinkQuery,
  QueryKey
> {
  return {
    queryKey: GET_INVITE_LINK_ONE_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<IntentInviteLinkQuery, IntentInviteLinkQueryVariables>(
        IntentInviteLinkDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function buildValidateInviteLinkOptions(
  variables: ValidateInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<
      ValidateInviteLinkQuery,
      Error,
      ValidateInviteLinkQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  ValidateInviteLinkQuery,
  Error,
  ValidateInviteLinkQuery,
  QueryKey
> {
  return {
    queryKey: VALIDATE_INVITE_LINK_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        ValidateInviteLinkQuery,
        ValidateInviteLinkQueryVariables
      >(ValidateInviteLinkDocument, variables),
    ...(options ?? {}),
  };
}

/* --------------------------------- QUERIES -------------------------------- */
export function useIntentInviteLinksQuery(
  variables: IntentInviteLinksQueryVariables,
  options?: Omit<
    UseQueryOptions<
      IntentInviteLinksQuery,
      Error,
      IntentInviteLinksQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetIntentInviteLinksOptions(variables, options));
}

export function useIntentInviteLinkQuery(
  variables: IntentInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<
      IntentInviteLinkQuery,
      Error,
      IntentInviteLinkQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetIntentInviteLinkOptions(variables, options));
}

export function useValidateInviteLinkQuery(
  variables: ValidateInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<
      ValidateInviteLinkQuery,
      Error,
      ValidateInviteLinkQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildValidateInviteLinkOptions(variables, options));
}

/* --------------------------- MUTATION BUILDERS --------------------------- */
export function buildCreateIntentInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CreateIntentInviteLinkMutation,
    unknown,
    CreateIntentInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  CreateIntentInviteLinkMutation,
  unknown,
  CreateIntentInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CreateIntentInviteLink'] as QueryKey,
    mutationFn: async (variables: CreateIntentInviteLinkMutationVariables) =>
      gqlClient.request<
        CreateIntentInviteLinkMutation,
        CreateIntentInviteLinkMutationVariables
      >(CreateIntentInviteLinkDocument, variables),
    meta: {
      successMessage: 'Link zaproszeniowy utworzony pomyślnie',
    },
    ...(options ?? {}),
  };
}

export function buildUpdateIntentInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    UpdateIntentInviteLinkMutation,
    unknown,
    UpdateIntentInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  UpdateIntentInviteLinkMutation,
  unknown,
  UpdateIntentInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['UpdateIntentInviteLink'] as QueryKey,
    mutationFn: async (variables: UpdateIntentInviteLinkMutationVariables) =>
      gqlClient.request<
        UpdateIntentInviteLinkMutation,
        UpdateIntentInviteLinkMutationVariables
      >(UpdateIntentInviteLinkDocument, variables),
    meta: {
      successMessage: 'Link zaproszeniowy zaktualizowany pomyślnie',
    },
    ...(options ?? {}),
  };
}

export function buildRevokeIntentInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    RevokeIntentInviteLinkMutation,
    unknown,
    RevokeIntentInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  RevokeIntentInviteLinkMutation,
  unknown,
  RevokeIntentInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['RevokeIntentInviteLink'] as QueryKey,
    mutationFn: async (variables: RevokeIntentInviteLinkMutationVariables) =>
      gqlClient.request<
        RevokeIntentInviteLinkMutation,
        RevokeIntentInviteLinkMutationVariables
      >(RevokeIntentInviteLinkDocument, variables),
    meta: {
      successMessage: 'Link zaproszeniowy odwołany pomyślnie',
    },
    ...(options ?? {}),
  };
}

export function buildDeleteIntentInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DeleteIntentInviteLinkMutation,
    unknown,
    DeleteIntentInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  DeleteIntentInviteLinkMutation,
  unknown,
  DeleteIntentInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['DeleteIntentInviteLink'] as QueryKey,
    mutationFn: async (variables: DeleteIntentInviteLinkMutationVariables) =>
      gqlClient.request<
        DeleteIntentInviteLinkMutation,
        DeleteIntentInviteLinkMutationVariables
      >(DeleteIntentInviteLinkDocument, variables),
    meta: {
      successMessage: 'Link zaproszeniowy usunięty pomyślnie',
    },
    ...(options ?? {}),
  };
}

export function buildJoinByInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    JoinByInviteLinkMutation,
    unknown,
    JoinByInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  JoinByInviteLinkMutation,
  unknown,
  JoinByInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['JoinByInviteLink'] as QueryKey,
    mutationFn: async (variables: JoinByInviteLinkMutationVariables) =>
      gqlClient.request<
        JoinByInviteLinkMutation,
        JoinByInviteLinkMutationVariables
      >(JoinByInviteLinkDocument, variables),
    meta: {
      successMessage: 'Dołączono do wydarzenia pomyślnie',
    },
    ...(options ?? {}),
  };
}

/* -------------------------------- MUTATIONS ------------------------------- */
export function useCreateIntentInviteLinkMutation(
  options?: UseMutationOptions<
    CreateIntentInviteLinkMutation,
    unknown,
    CreateIntentInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CreateIntentInviteLinkMutation,
    unknown,
    CreateIntentInviteLinkMutationVariables
  >(
    buildCreateIntentInviteLinkOptions({
      onSuccess: (data, _vars) => {
        // Invalidate the list query for this intent
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetIntentInviteLinks' &&
            (q.queryKey[1] as any)?.intentId ===
              data.createIntentInviteLink.intentId,
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useUpdateIntentInviteLinkMutation(
  options?: UseMutationOptions<
    UpdateIntentInviteLinkMutation,
    unknown,
    UpdateIntentInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UpdateIntentInviteLinkMutation,
    unknown,
    UpdateIntentInviteLinkMutationVariables
  >(
    buildUpdateIntentInviteLinkOptions({
      onSuccess: (data, vars) => {
        // Invalidate list queries for this intent
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetIntentInviteLinks' &&
            (q.queryKey[1] as any)?.intentId ===
              data.updateIntentInviteLink.intentId,
        });
        // Invalidate detail query
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_INVITE_LINK_ONE_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function useRevokeIntentInviteLinkMutation(
  options?: UseMutationOptions<
    RevokeIntentInviteLinkMutation,
    unknown,
    RevokeIntentInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    RevokeIntentInviteLinkMutation,
    unknown,
    RevokeIntentInviteLinkMutationVariables
  >(
    buildRevokeIntentInviteLinkOptions({
      onSuccess: (data, vars) => {
        // Invalidate all list queries (to show/hide revoked links)
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetIntentInviteLinks' &&
            (q.queryKey[1] as any)?.intentId ===
              data.revokeIntentInviteLink.intentId,
        });
        // Invalidate detail query
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_INVITE_LINK_ONE_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function useDeleteIntentInviteLinkMutation(
  options?: UseMutationOptions<
    DeleteIntentInviteLinkMutation,
    unknown,
    DeleteIntentInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    DeleteIntentInviteLinkMutation,
    unknown,
    DeleteIntentInviteLinkMutationVariables
  >(
    buildDeleteIntentInviteLinkOptions({
      onSuccess: (_data, vars) => {
        // Invalidate all list queries
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetIntentInviteLinks',
        });
        // Invalidate detail query
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_INVITE_LINK_ONE_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function useJoinByInviteLinkMutation(
  options?: UseMutationOptions<
    JoinByInviteLinkMutation,
    unknown,
    JoinByInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    JoinByInviteLinkMutation,
    unknown,
    JoinByInviteLinkMutationVariables
  >(
    buildJoinByInviteLinkOptions({
      onSuccess: (data, _vars) => {
        // Invalidate intent queries
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            (q.queryKey[0] === 'GetIntent' || q.queryKey[0] === 'GetIntents'),
        });
        // Invalidate memberships
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'myMemberships',
        });
        // Invalidate specific intent
        if (data.joinByInviteLink.id) {
          qc.invalidateQueries({
            queryKey: [
              'GetIntent',
              { id: data.joinByInviteLink.id },
            ] as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
