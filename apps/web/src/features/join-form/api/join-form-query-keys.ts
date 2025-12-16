import {
  EventJoinQuestionsQueryVariables,
  EventJoinRequestsQueryVariables,
  MyJoinRequestsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';

export const GET_JOIN_QUESTIONS_KEY = (
  variables: EventJoinQuestionsQueryVariables
) => ['GetEventJoinQuestions', variables] as const;

export const GET_JOIN_REQUESTS_KEY = (
  variables: EventJoinRequestsQueryVariables
) => ['GetEventJoinRequests', variables] as const;

export const GET_MY_JOIN_REQUESTS_KEY = (
  variables: MyJoinRequestsQueryVariables
) => ['GetMyJoinRequests', variables] as const;
