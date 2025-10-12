import {
  CreateCategoryDocument,
  CreateCategoryMutation,
  CreateCategoryMutationVariables,
  DeleteCategoryDocument,
  DeleteCategoryMutation,
  DeleteCategoryMutationVariables,
  GetCategoriesDocument,
  GetCategoriesQuery,
  GetCategoriesQueryVariables,
  GetCategoryDocument,
  GetCategoryQuery,
  GetCategoryQueryVariables,
  UpdateCategoryDocument,
  UpdateCategoryMutation,
  UpdateCategoryMutationVariables,
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
export const GET_CATEGORIES_LIST_KEY = (
  variables?: GetCategoriesQueryVariables
) => (variables ? ['GetCategories', variables] : ['GetCategories']);

export const GET_CATEGORY_ONE_KEY = (variables?: GetCategoryQueryVariables) =>
  variables ? ['GetCategory', variables] : ['GetCategory'];

// -------- Queries --------
export function buildGetCategoriesOptions(
  variables?: GetCategoriesQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCategoriesQuery, unknown, GetCategoriesQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetCategoriesQuery, unknown, GetCategoriesQuery, QueryKey> {
  return {
    queryKey: GET_CATEGORIES_LIST_KEY(variables),
    queryFn: async () => {
      if (variables) {
        return gqlClient.request<
          GetCategoriesQuery,
          GetCategoriesQueryVariables
        >(GetCategoriesDocument, variables);
      }
      return gqlClient.request<GetCategoriesQuery>(GetCategoriesDocument);
    },
    ...(options ?? {}),
  };
}

export function useGetCategoriesQuery(
  variables?: GetCategoriesQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCategoriesQuery, unknown, GetCategoriesQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetCategoriesOptions(variables, options));
}

export function buildGetCategoryOptions(
  variables?: GetCategoryQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCategoryQuery, unknown, GetCategoryQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetCategoryQuery, unknown, GetCategoryQuery, QueryKey> {
  return {
    queryKey: GET_CATEGORY_ONE_KEY(variables),
    queryFn: async () => {
      if (variables) {
        return gqlClient.request<GetCategoryQuery, GetCategoryQueryVariables>(
          GetCategoryDocument,
          variables
        );
      }
      return gqlClient.request<GetCategoryQuery>(GetCategoryDocument);
    },
    ...(options ?? {}),
  };
}

export function useGetCategoryQuery(
  variables: GetCategoryQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCategoryQuery, unknown, GetCategoryQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: GET_CATEGORY_ONE_KEY(variables),
    queryFn: async () =>
      gqlClient.request<GetCategoryQuery, GetCategoryQueryVariables>(
        GetCategoryDocument,
        variables
      ),
    enabled: !!(variables.id || variables.slug),
    ...(options ?? {}),
  });
}

// -------- Mutations --------
export function buildCreateCategoryOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CreateCategoryMutation,
    unknown,
    CreateCategoryMutationVariables,
    TContext
  >
): UseMutationOptions<
  CreateCategoryMutation,
  unknown,
  CreateCategoryMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CreateCategory'] as QueryKey,
    mutationFn: async (variables: CreateCategoryMutationVariables) =>
      gqlClient.request<
        CreateCategoryMutation,
        CreateCategoryMutationVariables
      >(CreateCategoryDocument, variables),
    ...(options ?? {}),
  };
}

export function useCreateCategoryMutation(
  options?: UseMutationOptions<
    CreateCategoryMutation,
    unknown,
    CreateCategoryMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CreateCategoryMutation,
    unknown,
    CreateCategoryMutationVariables
  >(
    buildCreateCategoryOptions({
      onSuccess: (_data, _vars) => {
        qc.invalidateQueries({ queryKey: ['Categories'] });
      },
      ...(options ?? {}),
    })
  );
}

export function buildUpdateCategoryOptions<TContext = unknown>(
  options?: UseMutationOptions<
    UpdateCategoryMutation,
    unknown,
    UpdateCategoryMutationVariables,
    TContext
  >
): UseMutationOptions<
  UpdateCategoryMutation,
  unknown,
  UpdateCategoryMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CreateCategory'] as QueryKey,
    mutationFn: async (variables: UpdateCategoryMutationVariables) =>
      gqlClient.request<
        UpdateCategoryMutation,
        UpdateCategoryMutationVariables
      >(UpdateCategoryDocument, variables),
    ...(options ?? {}),
  };
}

export function useUpdateCategoryMutation(
  options?: UseMutationOptions<
    UpdateCategoryMutation,
    unknown,
    UpdateCategoryMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UpdateCategoryMutation,
    unknown,
    UpdateCategoryMutationVariables
  >(
    buildUpdateCategoryOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({ queryKey: ['Categories'] });
        if (vars.id)
          qc.invalidateQueries({
            queryKey: GET_CATEGORY_ONE_KEY({ id: vars.id }),
          });
      },
      ...(options ?? {}),
    })
  );
}

export function buildDeleteCategoryOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DeleteCategoryMutation,
    unknown,
    DeleteCategoryMutationVariables,
    TContext
  >
): UseMutationOptions<
  DeleteCategoryMutation,
  unknown,
  DeleteCategoryMutationVariables,
  TContext
> {
  return {
    mutationKey: ['DeleteCategory'] as QueryKey,
    mutationFn: async (variables: DeleteCategoryMutationVariables) =>
      gqlClient.request<
        DeleteCategoryMutation,
        DeleteCategoryMutationVariables
      >(DeleteCategoryDocument, variables),
    ...(options ?? {}),
  };
}

export function useDeleteCategoryMutation(
  options?: UseMutationOptions<
    DeleteCategoryMutation,
    unknown,
    DeleteCategoryMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    DeleteCategoryMutation,
    unknown,
    DeleteCategoryMutationVariables
  >(
    buildDeleteCategoryOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['Categories'] });
      },
      ...(options ?? {}),
    })
  );
}
