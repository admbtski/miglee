import {
  AddNotificationDocument,
  AddNotificationMutation,
  AddNotificationMutationVariables,
  GetNotificationsQuery,
} from '@/graphql/__generated__/react-query';
import { gqlClient } from '@/graphql/client';
import { getQueryClient } from '@/libs/query-client/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';

const GET_NOTIFICATIONS_KEY = ['GetNotifications'] as const;

type Ctx = { previous?: GetNotificationsQuery | undefined };

export function buildAddNotificationOptions<TContext = unknown>(
  options?: UseMutationOptions<
    AddNotificationMutation,
    unknown,
    AddNotificationMutationVariables,
    TContext
  >
): UseMutationOptions<
  AddNotificationMutation,
  unknown,
  AddNotificationMutationVariables,
  TContext
> {
  return {
    mutationKey: ['AddNotification'] as QueryKey,
    mutationFn: async (variables: AddNotificationMutationVariables) =>
      gqlClient.request<
        AddNotificationMutation,
        AddNotificationMutationVariables
      >(AddNotificationDocument, variables),
    ...(options ?? {}),
  };
}

/**
 * Hook z optimistic update + rollback + invalidacją listy.
 */
export function useAddNotificationMutation<TContext extends Ctx = Ctx>(
  options?: UseMutationOptions<
    AddNotificationMutation,
    unknown,
    AddNotificationMutationVariables,
    TContext
  >
) {
  const queryClient = getQueryClient();

  return useMutation<
    AddNotificationMutation,
    unknown,
    AddNotificationMutationVariables,
    TContext
  >(
    buildAddNotificationOptions<TContext>({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: GET_NOTIFICATIONS_KEY });

        const previous = queryClient.getQueryData<GetNotificationsQuery>(
          GET_NOTIFICATIONS_KEY
        );

        const optimisticItem = {
          id: `optimistic-${Date.now()}`,
          message: variables.message,
          __typename: 'Notification' as const,
        };

        queryClient.setQueryData<GetNotificationsQuery>(
          GET_NOTIFICATIONS_KEY,
          (old) => {
            if (!old) {
              return {
                notifications: [optimisticItem],
              } as unknown as GetNotificationsQuery;
            }
            return {
              ...old,
              notifications: [optimisticItem, ...(old.notifications ?? [])],
            };
          }
        );

        return { previous } as TContext;
      },

      onError: (_err, _vars, ctx) => {
        const prev = (ctx as Partial<Ctx> | undefined)?.previous;
        if (prev) {
          queryClient.setQueryData<GetNotificationsQuery>(
            GET_NOTIFICATIONS_KEY,
            prev
          );
        }
      },

      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: GET_NOTIFICATIONS_KEY });
      },

      ...(options ?? {}),
    })
  );
}
