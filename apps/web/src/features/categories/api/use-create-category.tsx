import {
  CreateCategoryDocument,
  CreateCategoryMutation,
  CreateCategoryMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';

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
    meta: {
      successMessage: 'Category created successfully',
    },
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
