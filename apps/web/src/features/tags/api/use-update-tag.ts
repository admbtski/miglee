// apps/web/src/hooks/tags.tsx
import {
  // NEW:
  UpdateTagDocument,
  UpdateTagMutation,
  UpdateTagMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { tagsKeys } from './tags-query-keys';

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
            queryKey: tagsKeys.detail({ id: vars.id }) as unknown as QueryKey,
          });
        }
        // invalidate single by slug if present/changed
        if (vars.input?.slug) {
          qc.invalidateQueries({
            queryKey: tagsKeys.detail({
              slug: vars.input.slug,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
