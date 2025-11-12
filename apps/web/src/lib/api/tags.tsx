// apps/web/src/hooks/tags.tsx
import {
  CreateTagDocument,
  CreateTagMutation,
  CreateTagMutationVariables,
  DeleteTagDocument,
  DeleteTagMutation,
  DeleteTagMutationVariables,
  GetTagDocument,
  GetTagQuery,
  GetTagQueryVariables,
  GetTagsDocument,
  GetTagsQuery,
  GetTagsQueryVariables,
  // NEW:
  UpdateTagDocument,
  UpdateTagMutation,
  UpdateTagMutationVariables,
  CheckTagSlugAvailableDocument,
  CheckTagSlugAvailableQuery,
  CheckTagSlugAvailableQueryVariables,
  GetTagUsageCountDocument,
  GetTagUsageCountQuery,
  GetTagUsageCountQueryVariables,
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

// -------- Keys --------
export const GET_TAGS_LIST_KEY = (variables?: GetTagsQueryVariables) =>
  variables ? (['GetTags', variables] as const) : (['GetTags'] as const);

export const GET_TAG_ONE_KEY = (variables?: GetTagQueryVariables) =>
  variables ? (['GetTag', variables] as const) : (['GetTag'] as const);

// -------- Queries --------
export function buildGetTagsOptions(
  variables?: GetTagsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetTagsQuery, Error, GetTagsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetTagsQuery, Error, GetTagsQuery, QueryKey> {
  return {
    queryKey: GET_TAGS_LIST_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      variables
        ? gqlClient.request<GetTagsQuery, GetTagsQueryVariables>(
            GetTagsDocument,
            variables
          )
        : gqlClient.request<GetTagsQuery>(GetTagsDocument),
    ...(options ?? {}),
  };
}

export function useGetTagsQuery(
  variables?: GetTagsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetTagsQuery, Error, GetTagsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetTagsOptions(variables, options));
}

export function buildGetTagOptions(
  variables?: GetTagQueryVariables,
  options?: Omit<
    UseQueryOptions<GetTagQuery, unknown, GetTagQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetTagQuery, unknown, GetTagQuery, QueryKey> {
  return {
    queryKey: GET_TAG_ONE_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      variables
        ? gqlClient.request<GetTagQuery, GetTagQueryVariables>(
            GetTagDocument,
            variables
          )
        : gqlClient.request<GetTagQuery>(GetTagDocument),
    ...(options ?? {}),
  };
}

export function useGetTagQuery(
  variables: GetTagQueryVariables,
  options?: Omit<
    UseQueryOptions<GetTagQuery, Error, GetTagQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: GET_TAG_ONE_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<GetTagQuery, GetTagQueryVariables>(
        GetTagDocument,
        variables
      ),
    enabled: !!(variables.id || variables.slug),
    ...(options ?? {}),
  });
}

// -------- Mutations --------
export function buildCreateTagOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CreateTagMutation,
    unknown,
    CreateTagMutationVariables,
    TContext
  >
): UseMutationOptions<
  CreateTagMutation,
  unknown,
  CreateTagMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CreateTag'] as QueryKey,
    mutationFn: async (variables: CreateTagMutationVariables) =>
      gqlClient.request<CreateTagMutation, CreateTagMutationVariables>(
        CreateTagDocument,
        variables
      ),
    meta: {
      successMessage: 'Tag created successfully',
    },
    ...(options ?? {}),
  };
}

export function useCreateTagMutation(
  options?: UseMutationOptions<
    CreateTagMutation,
    unknown,
    CreateTagMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<CreateTagMutation, unknown, CreateTagMutationVariables>(
    buildCreateTagOptions({
      onSuccess: () => {
        // invalidate lists (including bySlugs)
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetTags',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function buildUpdateTagOptions<TContext = unknown>(
  options?: UseMutationOptions<
    UpdateTagMutation,
    unknown,
    UpdateTagMutationVariables,
    TContext
  >
): UseMutationOptions<
  UpdateTagMutation,
  unknown,
  UpdateTagMutationVariables,
  TContext
> {
  return {
    mutationKey: ['UpdateTag'] as QueryKey,
    mutationFn: async (variables: UpdateTagMutationVariables) =>
      gqlClient.request<UpdateTagMutation, UpdateTagMutationVariables>(
        UpdateTagDocument,
        variables
      ),
    meta: {
      successMessage: 'Tag updated successfully',
    },
    ...(options ?? {}),
  };
}

export function useUpdateTagMutation(
  options?: UseMutationOptions<
    UpdateTagMutation,
    unknown,
    UpdateTagMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<UpdateTagMutation, unknown, UpdateTagMutationVariables>(
    buildUpdateTagOptions({
      onSuccess: (_data, vars) => {
        // invalidate lists (including bySlugs)
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetTags',
        });
        // invalidate single by id
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_TAG_ONE_KEY({ id: vars.id }) as unknown as QueryKey,
          });
        }
        // invalidate single by slug if present/changed
        if (vars.input?.slug) {
          qc.invalidateQueries({
            queryKey: GET_TAG_ONE_KEY({
              slug: vars.input.slug,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function buildDeleteTagOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DeleteTagMutation,
    unknown,
    DeleteTagMutationVariables,
    TContext
  >
): UseMutationOptions<
  DeleteTagMutation,
  unknown,
  DeleteTagMutationVariables,
  TContext
> {
  return {
    mutationKey: ['DeleteTag'] as QueryKey,
    mutationFn: async (variables: DeleteTagMutationVariables) =>
      gqlClient.request<DeleteTagMutation, DeleteTagMutationVariables>(
        DeleteTagDocument,
        variables
      ),
    meta: {
      successMessage: 'Tag deleted successfully',
    },
    ...(options ?? {}),
  };
}

export function useDeleteTagMutation(
  options?: UseMutationOptions<
    DeleteTagMutation,
    unknown,
    DeleteTagMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<DeleteTagMutation, unknown, DeleteTagMutationVariables>(
    buildDeleteTagOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetTags',
        });
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_TAG_ONE_KEY({ id: vars.id }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

/* ----------------------- NEW: Check Slug & Usage ----------------------- */

export function useCheckTagSlugAvailableQuery(
  variables: CheckTagSlugAvailableQueryVariables,
  options?: Omit<
    UseQueryOptions<
      CheckTagSlugAvailableQuery,
      unknown,
      CheckTagSlugAvailableQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['CheckTagSlugAvailable', variables] as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        CheckTagSlugAvailableQuery,
        CheckTagSlugAvailableQueryVariables
      >(CheckTagSlugAvailableDocument, variables),
    enabled: !!variables.slug && variables.slug.trim().length > 0,
    ...(options ?? {}),
  });
}

export function useGetTagUsageCountQuery(
  variables: GetTagUsageCountQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetTagUsageCountQuery,
      unknown,
      GetTagUsageCountQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['GetTagUsageCount', variables] as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<GetTagUsageCountQuery, GetTagUsageCountQueryVariables>(
        GetTagUsageCountDocument,
        variables
      ),
    enabled: !!variables.slug && variables.slug.trim().length > 0,
    ...(options ?? {}),
  });
}
