import {
  UpdateCategoryDocument,
  UpdateCategoryMutation,
  UpdateCategoryMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { categoriesKeys } from './categories-query-keys';

export function buildUpdateCategoryOptions<TContext = unknown>(
  options?: UseMutationOptions<
    UpdateCategoryMutation,
    Error,
    UpdateCategoryMutationVariables,
    TContext
  >
): UseMutationOptions<
  UpdateCategoryMutation,
  Error,
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
    meta: {
      successMessage: 'Category updated successfully',
    },
    ...(options ?? {}),
  };
}

export function useUpdateCategoryMutation(
  options?: UseMutationOptions<
    UpdateCategoryMutation,
    Error,
    UpdateCategoryMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UpdateCategoryMutation,
    Error,
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
            queryKey: categoriesKeys.detail({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
        if (vars.input?.slug) {
          qc.invalidateQueries({
            queryKey: categoriesKeys.detail({
              slug: vars.input.slug,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
