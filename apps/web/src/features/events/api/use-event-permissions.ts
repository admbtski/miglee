import type {
  GetEventPermissionsQuery,
  GetEventPermissionsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { GetEventPermissionsDocument } from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { GET_EVENT_PERMISSIONS_KEY } from './events-query-keys';

export function buildGetEventPermissionsOptions(
  eventId: string,
  options?: Omit<
    UseQueryOptions<
      GetEventPermissionsQuery,
      Error,
      GetEventPermissionsQuery,
      ReturnType<typeof GET_EVENT_PERMISSIONS_KEY>
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetEventPermissionsQuery,
  Error,
  GetEventPermissionsQuery,
  ReturnType<typeof GET_EVENT_PERMISSIONS_KEY>
> {
  return {
    queryKey: GET_EVENT_PERMISSIONS_KEY(eventId),
    queryFn: async () =>
      gqlClient.request<
        GetEventPermissionsQuery,
        GetEventPermissionsQueryVariables
      >(GetEventPermissionsDocument, { eventId }),
    ...options,
  };
}

export function useEventPermissionsQuery(
  eventId: string,
  options?: Omit<
    UseQueryOptions<
      GetEventPermissionsQuery,
      Error,
      GetEventPermissionsQuery,
      ReturnType<typeof GET_EVENT_PERMISSIONS_KEY>
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventPermissionsOptions(eventId, options));
}
