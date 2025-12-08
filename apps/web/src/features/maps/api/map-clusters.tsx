'use client';

import {
  GetClustersDocument,
  GetClustersQuery,
  GetClustersQueryVariables,
  GetRegionEventsDocument,
  GetRegionEventsQuery,
  GetRegionEventsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useQuery,
  UseQueryOptions,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';

// ==================== Clusters Query ====================

export const GET_CLUSTERS_KEY = (variables: GetClustersQueryVariables) =>
  ['GetClusters', variables] as const;

export function buildGetClustersOptions(
  variables: GetClustersQueryVariables,
  options?: Omit<
    UseQueryOptions<GetClustersQuery, Error, GetClustersQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetClustersQuery, Error, GetClustersQuery, QueryKey> {
  return {
    queryKey: GET_CLUSTERS_KEY(variables) as unknown as QueryKey,
    queryFn: async () => {
      return gqlClient.request<GetClustersQuery, GetClustersQueryVariables>(
        GetClustersDocument,
        variables
      );
    },
    staleTime: 15_000, // 15 seconds
    gcTime: 60_000, // 1 minute
    ...(options ?? {}),
  };
}

export function useGetClustersQuery(
  variables: GetClustersQueryVariables,
  options?: Omit<
    UseQueryOptions<GetClustersQuery, Error, GetClustersQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetClustersOptions(variables, options));
}

// ==================== Region Events Query ====================

export const GET_REGION_EVENTS_KEY = (
  variables: GetRegionEventsQueryVariables
) => ['GetRegionEvents', variables] as const;

export function buildGetRegionEventsOptions(
  variables: GetRegionEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetRegionEventsQuery,
      Error,
      GetRegionEventsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetRegionEventsQuery,
  Error,
  GetRegionEventsQuery,
  QueryKey
> {
  return {
    queryKey: GET_REGION_EVENTS_KEY(variables) as unknown as QueryKey,
    queryFn: async () => {
      return gqlClient.request<
        GetRegionEventsQuery,
        GetRegionEventsQueryVariables
      >(GetRegionEventsDocument, variables);
    },
    enabled: !!variables.region,
    staleTime: 30_000, // 30 seconds
    gcTime: 120_000, // 2 minutes
    ...(options ?? {}),
  };
}

export function useGetRegionEventsQuery(
  variables: GetRegionEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetRegionEventsQuery,
      Error,
      GetRegionEventsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetRegionEventsOptions(variables, options));
}

// ==================== Region Events Infinite Query ====================

export function useGetRegionEventsInfiniteQuery(
  variables: Omit<GetRegionEventsQueryVariables, 'page'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetRegionEventsQuery,
      Error,
      GetRegionEventsQuery,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  return useInfiniteQuery({
    queryKey: ['GetRegionEventsInfinite', variables] as unknown as QueryKey,
    queryFn: async ({ pageParam = 1 }) => {
      // Additional validation to prevent empty region queries
      if (!variables.region || variables.region.trim() === '') {
        throw new Error('Region is required');
      }

      return gqlClient.request<
        GetRegionEventsQuery,
        GetRegionEventsQueryVariables
      >(GetRegionEventsDocument, {
        ...variables,
        page: pageParam,
      });
    },
    getNextPageParam: (lastPage) => {
      const meta = lastPage.regionEvents?.meta;
      if (!meta) return undefined;

      // Jeśli jest nextPage w meta, zwróć go
      if (meta.nextPage) {
        return meta.nextPage;
      }

      return undefined; // Brak kolejnych stron
    },
    initialPageParam: 1,
    enabled: !!variables.region && variables.region.trim() !== '',
    staleTime: 30_000,
    gcTime: 120_000,
    ...options,
  });
}
