import {
  EventInviteLinkQueryVariables,
  EventInviteLinksQueryVariables,
  ValidateInviteLinkQueryVariables,
} from '@/lib/api/__generated__/react-query-update';

export const GET_INVITE_LINKS_LIST_KEY = (
  variables: EventInviteLinksQueryVariables
) => ['GetEventInviteLinks', variables] as const;

export const GET_INVITE_LINK_ONE_KEY = (
  variables: EventInviteLinkQueryVariables
) => ['GetEventInviteLink', variables] as const;

export const VALIDATE_INVITE_LINK_KEY = (
  variables: ValidateInviteLinkQueryVariables
) => ['ValidateInviteLink', variables] as const;
