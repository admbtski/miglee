import {
  PublishEventDocument,
  PublishEventMutation,
  PublishEventMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GET_EVENT_DETAIL_KEY } from './events-query-keys';

export function usePublishEventMutation(
  options?: UseMutationOptions<
    PublishEventMutation,
    Error,
    PublishEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    PublishEventMutation,
    Error,
    PublishEventMutationVariables
  >({
    mutationKey: ['PublishEvent'],
    mutationFn: async (variables) =>
      gqlClient.request<PublishEventMutation, PublishEventMutationVariables>(
        PublishEventDocument,
        variables
      ),
    meta: {
      successMessage: 'Event published successfully',
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
      });
      if (vars.id) {
        qc.invalidateQueries({
          queryKey: GET_EVENT_DETAIL_KEY({
            id: vars.id,
          }) as unknown as QueryKey,
        });
      }
    },
    ...options,
  });
}
