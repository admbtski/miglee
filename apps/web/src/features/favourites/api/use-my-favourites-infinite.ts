import {
  MyFavouritesDocument,
  MyFavouritesQuery,
  MyFavouritesQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { favouritesKeys } from './favourites-query-keys';

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

export const flatFavouritesPages = (pages?: MyFavouritesQuery[]) => {
  return pages?.flatMap((p) => p.myFavourites?.items ?? []) ?? [];
};
