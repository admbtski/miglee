import {
  ValidateInviteLinkDocument,
  ValidateInviteLinkQuery,
  ValidateInviteLinkQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { VALIDATE_INVITE_LINK_KEY } from './invite-links-query-keys';

export function buildValidateInviteLinkOptions(
  variables: ValidateInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<
      ValidateInviteLinkQuery,
      Error,
      ValidateInviteLinkQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  ValidateInviteLinkQuery,
  Error,
  ValidateInviteLinkQuery,
  QueryKey
> {
  return {
    queryKey: VALIDATE_INVITE_LINK_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        ValidateInviteLinkQuery,
        ValidateInviteLinkQueryVariables
      >(ValidateInviteLinkDocument, variables),
    ...(options ?? {}),
  };
}
export function useValidateInviteLinkQuery(
  variables: ValidateInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<
      ValidateInviteLinkQuery,
      Error,
      ValidateInviteLinkQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildValidateInviteLinkOptions(variables, options));
}
