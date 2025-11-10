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
  CheckCategorySlugAvailableDocument,
  CheckCategorySlugAvailableQuery,
  CheckCategorySlugAvailableQueryVariables,
  GetCategoryUsageCountDocument,
  GetCategoryUsageCountQuery,
  GetCategoryUsageCountQueryVariables,
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

export const GET_CATEGORIES_LIST_KEY = (
  variables?: GetCategoriesQueryVariables
) =>
  variables
    ? (['GetCategories', variables] as const)
    : (['GetCategories'] as const);

export const GET_CATEGORY_ONE_KEY = (variables?: GetCategoryQueryVariables) =>
  variables
    ? (['GetCategory', variables] as const)
    : (['GetCategory'] as const);

/* -------------------------------- QUERIES -------------------------------- */

export function buildGetCategoriesOptions(
  variables?: GetCategoriesQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCategoriesQuery, Error, GetCategoriesQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetCategoriesQuery, Error, GetCategoriesQuery, QueryKey> {
  return {
    queryKey: GET_CATEGORIES_LIST_KEY(variables) as unknown as QueryKey,
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
    UseQueryOptions<GetCategoriesQuery, Error, GetCategoriesQuery, QueryKey>,
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
    queryKey: GET_CATEGORY_ONE_KEY(variables) as unknown as QueryKey,
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
    queryKey: GET_CATEGORY_ONE_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<GetCategoryQuery, GetCategoryQueryVariables>(
        GetCategoryDocument,
        variables
      ),
    enabled: !!(variables?.id || variables?.slug),
    ...(options ?? {}),
  });
}

/* ------------------------------- MUTATIONS ------------------------------- */

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
      onSuccess: (_data, _vars, _ctx) => {
        // odśwież listę
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetCategories',
        });
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
    mutationKey: ['UpdateCategory'] as QueryKey,
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
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetCategories',
        });

        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_CATEGORY_ONE_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
        if (vars.input?.slug) {
          qc.invalidateQueries({
            queryKey: GET_CATEGORY_ONE_KEY({
              slug: vars.input.slug,
            }) as unknown as QueryKey,
          });
        }
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
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetCategories',
        });

        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_CATEGORY_ONE_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

/* ----------------------- NEW: Check Slug & Usage ----------------------- */

export function useCheckCategorySlugAvailableQuery(
  variables: CheckCategorySlugAvailableQueryVariables,
  options?: Omit<
    UseQueryOptions<
      CheckCategorySlugAvailableQuery,
      unknown,
      CheckCategorySlugAvailableQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['CheckCategorySlugAvailable', variables] as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        CheckCategorySlugAvailableQuery,
        CheckCategorySlugAvailableQueryVariables
      >(CheckCategorySlugAvailableDocument, variables),
    enabled: !!variables.slug && variables.slug.trim().length > 0,
    ...(options ?? {}),
  });
}

export function useGetCategoryUsageCountQuery(
  variables: GetCategoryUsageCountQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetCategoryUsageCountQuery,
      unknown,
      GetCategoryUsageCountQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['GetCategoryUsageCount', variables] as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        GetCategoryUsageCountQuery,
        GetCategoryUsageCountQueryVariables
      >(GetCategoryUsageCountDocument, variables),
    enabled: !!variables.slug && variables.slug.trim().length > 0,
    ...(options ?? {}),
  });
}
