import {
  MyFavouritesDocument,
  MyFavouritesQuery,
  MyFavouritesQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { favouritesKeys } from './favourites-query-keys';

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

export function useMyFavouritesQuery(
  variables?: MyFavouritesQueryVariables,
  options?: Omit<
    UseQueryOptions<MyFavouritesQuery, Error, MyFavouritesQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildMyFavouritesOptions(variables, options));
}
