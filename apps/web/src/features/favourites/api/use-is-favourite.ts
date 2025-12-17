import {
  IsFavouriteDocument,
  IsFavouriteQuery,
  IsFavouriteQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { favouritesKeys } from './favourites-query-keys';

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
