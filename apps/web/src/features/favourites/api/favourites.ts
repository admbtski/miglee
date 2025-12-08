import {
  MyFavouritesDocument,
  MyFavouritesQuery,
  MyFavouritesQueryVariables,
  IsFavouriteDocument,
  IsFavouriteQuery,
  IsFavouriteQueryVariables,
  ToggleFavouriteDocument,
  ToggleFavouriteMutation,
  ToggleFavouriteMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  InfiniteData,
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';

/* --------------------------------- KEYS ---------------------------------- */
export const favouritesKeys = {
  all: ['Favourites'] as const,
  lists: () => [...favouritesKeys.all, 'list'] as const,
  list: (variables?: Omit<MyFavouritesQueryVariables, 'offset'>) =>
    [...favouritesKeys.lists(), variables] as const,
  listInfinite: (variables?: Omit<MyFavouritesQueryVariables, 'offset'>) =>
    [...favouritesKeys.lists(), 'infinite', variables] as const,
  details: () => [...favouritesKeys.all, 'detail'] as const,
  detail: (eventId: string) => [...favouritesKeys.details(), eventId] as const,
};

/* ----------------------------- QUERY BUILDERS ---------------------------- */

/**
 * Builder for infinite query (for popup/dropdown)
 */
export function buildMyFavouritesInfiniteOptions(
  variables?: Omit<MyFavouritesQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      MyFavouritesQuery,
      Error,
      InfiniteData<MyFavouritesQuery>,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
): UseInfiniteQueryOptions<
  MyFavouritesQuery,
  Error,
  InfiniteData<MyFavouritesQuery>,
  QueryKey,
  number
> {
  return {
    queryKey: favouritesKeys.listInfinite(variables) as unknown as QueryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const vars: MyFavouritesQueryVariables = {
        ...(variables ?? {}),
        offset: pageParam,
        limit: variables?.limit ?? 20,
      };
      return gqlClient.request<MyFavouritesQuery, MyFavouritesQueryVariables>(
        MyFavouritesDocument,
        vars
      );
    },
    getNextPageParam: (lastPage, _allPages, lastOffset) => {
      const pageInfo = lastPage.myFavourites?.pageInfo;
      if (!pageInfo?.hasNext) return undefined;
      return (lastOffset ?? 0) + (pageInfo.limit ?? 20);
    },
    ...(options ?? {}),
  };
}

/**
 * Builder for regular query (for full page)
 */
export function buildMyFavouritesOptions(
  variables?: MyFavouritesQueryVariables,
  options?: Omit<
    UseQueryOptions<MyFavouritesQuery, Error, MyFavouritesQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<MyFavouritesQuery, Error, MyFavouritesQuery, QueryKey> {
  return {
    queryKey: favouritesKeys.list(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<MyFavouritesQuery, MyFavouritesQueryVariables>(
        MyFavouritesDocument,
        variables ?? {}
      ),
    ...(options ?? {}),
  };
}

/**
 * Builder for checking if event is favourited
 */
export function buildIsFavouriteOptions(
  variables: IsFavouriteQueryVariables,
  options?: Omit<
    UseQueryOptions<IsFavouriteQuery, Error, IsFavouriteQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<IsFavouriteQuery, Error, IsFavouriteQuery, QueryKey> {
  return {
    queryKey: favouritesKeys.detail(variables.eventId) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<IsFavouriteQuery, IsFavouriteQueryVariables>(
        IsFavouriteDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

/* --------------------------------- QUERIES -------------------------------- */

/**
 * Infinite query hook for favourites (for popup/dropdown)
 */
export function useMyFavouritesInfiniteQuery(
  variables?: Omit<MyFavouritesQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      MyFavouritesQuery,
      Error,
      InfiniteData<MyFavouritesQuery>,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  return useInfiniteQuery<
    MyFavouritesQuery,
    Error,
    InfiniteData<MyFavouritesQuery>,
    QueryKey,
    number
  >(buildMyFavouritesInfiniteOptions(variables, options));
}

/**
 * Regular query hook for favourites (for full page)
 */
export function useMyFavouritesQuery(
  variables?: MyFavouritesQueryVariables,
  options?: Omit<
    UseQueryOptions<MyFavouritesQuery, Error, MyFavouritesQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildMyFavouritesOptions(variables, options));
}

/**
 * Query hook to check if event is favourited
 */
export function useIsFavouriteQuery(
  variables: IsFavouriteQueryVariables,
  options?: Omit<
    UseQueryOptions<IsFavouriteQuery, Error, IsFavouriteQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildIsFavouriteOptions(variables, {
      enabled: !!variables.eventId,
      ...(options ?? {}),
    })
  );
}

/* --------------------------- MUTATION BUILDERS --------------------------- */

export function buildToggleFavouriteOptions<TContext = unknown>(
  options?: UseMutationOptions<
    ToggleFavouriteMutation,
    unknown,
    ToggleFavouriteMutationVariables,
    TContext
  >
): UseMutationOptions<
  ToggleFavouriteMutation,
  unknown,
  ToggleFavouriteMutationVariables,
  TContext
> {
  return {
    mutationKey: ['ToggleFavourite'] as QueryKey,
    mutationFn: async (variables: ToggleFavouriteMutationVariables) =>
      gqlClient.request<
        ToggleFavouriteMutation,
        ToggleFavouriteMutationVariables
      >(ToggleFavouriteDocument, variables),
    ...(options ?? {}),
  };
}

/* -------------------------------- MUTATIONS ------------------------------- */

type ToggleFavouriteContext = {
  previousQueries: Array<{ key: readonly unknown[]; data: unknown }>;
};

export function useToggleFavouriteMutation(
  options?: UseMutationOptions<
    ToggleFavouriteMutation,
    unknown,
    ToggleFavouriteMutationVariables,
    ToggleFavouriteContext
  >
) {
  const qc = getQueryClient();
  return useMutation<
    ToggleFavouriteMutation,
    unknown,
    ToggleFavouriteMutationVariables,
    ToggleFavouriteContext
  >(
    buildToggleFavouriteOptions({
      onMutate: async (vars) => {
        // Cancel any outgoing refetches
        await qc.cancelQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            (q.queryKey[0] === 'GetEvent' ||
              q.queryKey[0] === 'GetEvents' ||
              q.queryKey[0] === 'GetEventsLight' ||
              q.queryKey[0] === 'Favourites'),
        });

        // Snapshot the previous value
        const previousQueries = qc
          .getQueryCache()
          .findAll({
            predicate: (q) =>
              Array.isArray(q.queryKey) &&
              (q.queryKey[0] === 'GetEvent' ||
                q.queryKey[0] === 'GetEvents' ||
                q.queryKey[0] === 'GetEventsLight' ||
                q.queryKey[0] === 'Favourites'),
          })
          .map((q) => ({ key: q.queryKey, data: q.state.data }));

        // Optimistically update favourites list (remove the item)
        qc.setQueriesData(
          {
            predicate: (q) =>
              Array.isArray(q.queryKey) && q.queryKey[0] === 'Favourites',
          },
          (old: any) => {
            if (!old) return old;

            // Handle infinite query
            if (old.pages) {
              return {
                ...old,
                pages: old.pages.map((page: any) => ({
                  ...page,
                  myFavourites: {
                    ...page.myFavourites,
                    items:
                      page.myFavourites?.items?.filter(
                        (fav: any) => fav.event?.id !== vars.eventId
                      ) ?? [],
                  },
                })),
              };
            }

            // Handle regular query
            if (old.myFavourites?.items) {
              return {
                ...old,
                myFavourites: {
                  ...old.myFavourites,
                  items: old.myFavourites.items.filter(
                    (fav: any) => fav.event?.id !== vars.eventId
                  ),
                },
              };
            }

            return old;
          }
        );

        // Optimistically update all event queries
        qc.setQueriesData(
          {
            predicate: (q) =>
              Array.isArray(q.queryKey) &&
              (q.queryKey[0] === 'GetEvent' ||
                q.queryKey[0] === 'GetEvents' ||
                q.queryKey[0] === 'GetEventsLight'),
          },
          (old: any) => {
            if (!old) return old;

            // Handle single event query (GetEvent)
            if (old.event) {
              if (old.event.id === vars.eventId) {
                return {
                  ...old,
                  event: {
                    ...old.event,
                    isFavourite: !old.event.isFavourite,
                    savedCount: old.event.isFavourite
                      ? Math.max(0, (old.event.savedCount ?? 0) - 1)
                      : (old.event.savedCount ?? 0) + 1,
                  },
                };
              }
            }

            // Handle events list query (GetEvents/GetEventsLight)
            if (old.events?.items) {
              return {
                ...old,
                events: {
                  ...old.events,
                  items: old.events.items.map((event: any) =>
                    event.id === vars.eventId
                      ? {
                          ...event,
                          isFavourite: !event.isFavourite,
                          savedCount: event.isFavourite
                            ? Math.max(0, (event.savedCount ?? 0) - 1)
                            : (event.savedCount ?? 0) + 1,
                        }
                      : event
                  ),
                },
              };
            }

            return old;
          }
        );

        return { previousQueries };
      },
      onError: (_err, _vars, context) => {
        // Rollback on error
        if (context?.previousQueries) {
          context.previousQueries.forEach(({ key, data }) => {
            qc.setQueryData(key, data);
          });
        }
      },
      onSuccess: (_data, vars) => {
        // Invalidate favourites lists (don't refetch immediately to avoid race condition)
        qc.invalidateQueries({
          queryKey: favouritesKeys.lists(),
        });
        // Invalidate specific event favourite status
        qc.invalidateQueries({
          queryKey: favouritesKeys.detail(vars.eventId),
        });
        // Invalidate event queries to update isFavourite field
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            (q.queryKey[0] === 'GetEvent' ||
              q.queryKey[0] === 'GetEvents' ||
              q.queryKey[0] === 'GetEventsLight'),
        });
      },
      ...(options ?? {}),
    })
  );
}

/* --------------------------------- HELPERS -------------------------------- */

/**
 * Flatten pages from infinite query
 */
export const flatFavouritesPages = (pages?: MyFavouritesQuery[]) => {
  return pages?.flatMap((p) => p.myFavourites?.items ?? []) ?? [];
};
