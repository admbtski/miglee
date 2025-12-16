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
import { GET_CATEGORY_ONE_KEY } from './category-query-keys';

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
    meta: {
      successMessage: 'Category updated successfully',
    },
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
