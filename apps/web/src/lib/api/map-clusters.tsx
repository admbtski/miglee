'use client';

import {
  GetClustersDocument,
  GetClustersQuery,
  GetClustersQueryVariables,
  GetRegionIntentsDocument,
  GetRegionIntentsQuery,
  GetRegionIntentsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';

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

// ==================== Region Intents Query ====================

export const GET_REGION_INTENTS_KEY = (
  variables: GetRegionIntentsQueryVariables
) => ['GetRegionIntents', variables] as const;

export function buildGetRegionIntentsOptions(
  variables: GetRegionIntentsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetRegionIntentsQuery,
      Error,
      GetRegionIntentsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetRegionIntentsQuery,
  Error,
  GetRegionIntentsQuery,
  QueryKey
> {
  return {
    queryKey: GET_REGION_INTENTS_KEY(variables) as unknown as QueryKey,
    queryFn: async () => {
      return gqlClient.request<
        GetRegionIntentsQuery,
        GetRegionIntentsQueryVariables
      >(GetRegionIntentsDocument, variables);
    },
    enabled: !!variables.region,
    staleTime: 30_000, // 30 seconds
    gcTime: 120_000, // 2 minutes
    ...(options ?? {}),
  };
}

export function useGetRegionIntentsQuery(
  variables: GetRegionIntentsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetRegionIntentsQuery,
      Error,
      GetRegionIntentsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetRegionIntentsOptions(variables, options));
}
