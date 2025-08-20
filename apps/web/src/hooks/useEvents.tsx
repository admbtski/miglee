import {
  GetEventsDocument,
  GetEventsQuery,
  GetEventsQueryVariables,
} from '@/graphql/__generated__/react-query';
import { gqlClient } from '@/graphql/client';
import {
  queryOptions,
  useQuery,
  UseQueryOptions,
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';

// Shared builder for both normal and suspense queries
// - Keeps queryKey and queryFn in one place
// - Accepts either UseQueryOptions or UseSuspenseQueryOptions
export const buildEventsOptions = <
  TOpts extends
    | Omit<UseQueryOptions<GetEventsQuery>, 'queryKey' | 'queryFn'>
    | Omit<UseSuspenseQueryOptions<GetEventsQuery>, 'queryKey' | 'queryFn'>,
>(
  variables?: GetEventsQueryVariables,
  options?: TOpts
) =>
  queryOptions({
    // Ensure stable key, include variables if provided
    queryKey: variables ? ['GetEvents', variables] : ['GetEvents'],

    // Query function executed by React Query
    queryFn: async () =>
      gqlClient.request<GetEventsQuery, GetEventsQueryVariables>(
        GetEventsDocument,
        variables as GetEventsQueryVariables
      ),

    // Spread additional options from caller
    ...(options ?? {
      refetchInterval: 2000,
    }),
  });

// Standard query hook (with loading state handling)
export const useGetEventsQuery = (
  variables?: GetEventsQueryVariables,
  options?: Omit<UseQueryOptions<GetEventsQuery>, 'queryKey' | 'queryFn'>
) => {
  return useQuery(buildEventsOptions(variables, options));
};

// Suspense query hook (throws promises, must be used inside <Suspense>)
export const useSuspenseGetEventsQuery = (
  variables?: GetEventsQueryVariables,
  options?: Omit<
    UseSuspenseQueryOptions<GetEventsQuery>,
    'queryKey' | 'queryFn'
  >
) => {
  return useSuspenseQuery(buildEventsOptions(variables, options));
};
