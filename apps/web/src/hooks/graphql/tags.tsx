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
  GetTagsBySlugsDocument,
  GetTagsBySlugsQuery,
  GetTagsBySlugsQueryVariables,
  GetTagsDocument,
  GetTagsQuery,
  GetTagsQueryVariables,
  // NEW:
  UpdateTagDocument,
  UpdateTagMutation,
  UpdateTagMutationVariables,
} from '@/libs/graphql/__generated__/react-query-update';
import { gqlClient } from '@/libs/graphql/client';
import { getQueryClient } from '@/libs/query-client/query-client';
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

// NEW:
export const GET_TAGS_BY_SLUGS_KEY = (
  variables?: GetTagsBySlugsQueryVariables
) =>
  variables
    ? (['GetTagsBySlugs', variables] as const)
    : (['GetTagsBySlugs'] as const);

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

// NEW: -------- tagsBySlugs --------
export function buildGetTagsBySlugsOptions(
  variables?: GetTagsBySlugsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetTagsBySlugsQuery, Error, GetTagsBySlugsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetTagsBySlugsQuery, Error, GetTagsBySlugsQuery, QueryKey> {
  return {
    queryKey: GET_TAGS_BY_SLUGS_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      variables
        ? gqlClient.request<GetTagsBySlugsQuery, GetTagsBySlugsQueryVariables>(
            GetTagsBySlugsDocument,
            variables
          )
        : gqlClient.request<GetTagsBySlugsQuery>(GetTagsBySlugsDocument),
    ...(options ?? {}),
  };
}

export function useGetTagsBySlugsQuery(
  variables: GetTagsBySlugsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetTagsBySlugsQuery, Error, GetTagsBySlugsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    ...buildGetTagsBySlugsOptions(variables, options),
    enabled:
      (options?.enabled ?? true) &&
      !!variables?.slugs &&
      Array.isArray(variables.slugs) &&
      variables.slugs.length > 0,
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
            Array.isArray(q.queryKey) &&
            (q.queryKey[0] === 'GetTags' || q.queryKey[0] === 'GetTagsBySlugs'),
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
            Array.isArray(q.queryKey) &&
            (q.queryKey[0] === 'GetTags' || q.queryKey[0] === 'GetTagsBySlugs'),
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
