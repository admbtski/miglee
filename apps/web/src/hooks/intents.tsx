import {
  CreateIntentDocument,
  CreateIntentMutation,
  CreateIntentMutationVariables,
  DeleteIntentDocument,
  DeleteIntentMutation,
  DeleteIntentMutationVariables,
  GetIntentDocument,
  GetIntentQuery,
  GetIntentQueryVariables,
  GetIntentsDocument,
  GetIntentsQuery,
  GetIntentsQueryVariables,
  UpdateIntentDocument,
  UpdateIntentMutation,
  UpdateIntentMutationVariables,
} from '@/graphql/__generated__/react-query';
import { gqlClient } from '@/graphql/client';
import { getQueryClient } from '@/libs/query-client/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';

// -------- Keys --------
export const GET_INTENTS_LIST_KEY = (variables?: GetIntentsQueryVariables) =>
  variables ? ['GetIntents', variables] : ['GetIntents'];

export const GET_INTENT_ONE_KEY = (variables: GetIntentQueryVariables) =>
  ['GetIntent', variables] as const;

// -------- Query builders --------
export function buildGetIntentsOptions(
  variables?: GetIntentsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetIntentsQuery, unknown, GetIntentsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetIntentsQuery, unknown, GetIntentsQuery, QueryKey> {
  return {
    queryKey: GET_INTENTS_LIST_KEY(variables),
    queryFn: async () =>
      variables
        ? gqlClient.request<GetIntentsQuery, GetIntentsQueryVariables>(
            GetIntentsDocument,
            variables
          )
        : gqlClient.request<GetIntentsQuery>(GetIntentsDocument),
    ...(options ?? {}),
  };
}

export function buildGetIntentOptions(
  variables: GetIntentQueryVariables,
  options?: Omit<
    UseQueryOptions<GetIntentQuery, unknown, GetIntentQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetIntentQuery, unknown, GetIntentQuery, QueryKey> {
  return {
    queryKey: GET_INTENT_ONE_KEY(variables),
    queryFn: async () =>
      gqlClient.request<GetIntentQuery, GetIntentQueryVariables>(
        GetIntentDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

// -------- Queries (hooks) --------
export function useIntentsQuery(
  variables?: GetIntentsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetIntentsQuery, unknown, GetIntentsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetIntentsOptions(variables, options));
}

export function useIntentQuery(
  variables: GetIntentQueryVariables,
  options?: Omit<
    UseQueryOptions<GetIntentQuery, unknown, GetIntentQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetIntentOptions(variables, {
      enabled: !!variables.id,
      ...(options ?? {}),
    })
  );
}

// -------- Mutation builders --------
export function buildCreateIntentOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CreateIntentMutation,
    unknown,
    CreateIntentMutationVariables,
    TContext
  >
): UseMutationOptions<
  CreateIntentMutation,
  unknown,
  CreateIntentMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CreateIntent'] as QueryKey,
    mutationFn: async (variables: CreateIntentMutationVariables) =>
      gqlClient.request<CreateIntentMutation, CreateIntentMutationVariables>(
        CreateIntentDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function buildUpdateIntentOptions<TContext = unknown>(
  options?: UseMutationOptions<
    UpdateIntentMutation,
    unknown,
    UpdateIntentMutationVariables,
    TContext
  >
): UseMutationOptions<
  UpdateIntentMutation,
  unknown,
  UpdateIntentMutationVariables,
  TContext
> {
  return {
    mutationKey: ['UpdateIntent'] as QueryKey,
    mutationFn: async (variables: UpdateIntentMutationVariables) =>
      gqlClient.request<UpdateIntentMutation, UpdateIntentMutationVariables>(
        UpdateIntentDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function buildDeleteIntentOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DeleteIntentMutation,
    unknown,
    DeleteIntentMutationVariables,
    TContext
  >
): UseMutationOptions<
  DeleteIntentMutation,
  unknown,
  DeleteIntentMutationVariables,
  TContext
> {
  return {
    mutationKey: ['DeleteIntent'] as QueryKey,
    mutationFn: async (variables: DeleteIntentMutationVariables) =>
      gqlClient.request<DeleteIntentMutation, DeleteIntentMutationVariables>(
        DeleteIntentDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

// -------- Mutations (hooks) --------
export function useCreateIntentMutation(
  options?: UseMutationOptions<
    CreateIntentMutation,
    unknown,
    CreateIntentMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CreateIntentMutation,
    unknown,
    CreateIntentMutationVariables
  >(
    buildCreateIntentOptions({
      onSuccess: (_data, _vars) => {
        // szeroka invalidacja list
        qc.invalidateQueries({ queryKey: ['GetIntents'] });
      },
      ...(options ?? {}),
    })
  );
}

export function useUpdateIntentMutation(
  options?: UseMutationOptions<
    UpdateIntentMutation,
    unknown,
    UpdateIntentMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UpdateIntentMutation,
    unknown,
    UpdateIntentMutationVariables
  >(
    buildUpdateIntentOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({ queryKey: ['GetIntents'] });
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({ id: vars.id }),
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function useDeleteIntentMutation(
  options?: UseMutationOptions<
    DeleteIntentMutation,
    unknown,
    DeleteIntentMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    DeleteIntentMutation,
    unknown,
    DeleteIntentMutationVariables
  >(
    buildDeleteIntentOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['GetIntents'] });
      },
      ...(options ?? {}),
    })
  );
}
