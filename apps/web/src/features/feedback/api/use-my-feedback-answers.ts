import {
  MyFeedbackAnswersDocument,
  MyFeedbackAnswersQuery,
  MyFeedbackAnswersQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_MY_FEEDBACK_ANSWERS_KEY } from './feedback-query-keys';

export function buildGetMyFeedbackAnswersOptions(
  variables: MyFeedbackAnswersQueryVariables,
  options?: Omit<
    UseQueryOptions<
      MyFeedbackAnswersQuery,
      Error,
      MyFeedbackAnswersQuery['myFeedbackAnswers'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  MyFeedbackAnswersQuery,
  Error,
  MyFeedbackAnswersQuery['myFeedbackAnswers'],
  QueryKey
> {
  return {
    queryKey: GET_MY_FEEDBACK_ANSWERS_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        MyFeedbackAnswersQuery,
        MyFeedbackAnswersQueryVariables
      >(MyFeedbackAnswersDocument, variables),
    select: (data) => data.myFeedbackAnswers,
    ...(options ?? {}),
  };
}

export function useMyFeedbackAnswersQuery(
  variables: MyFeedbackAnswersQueryVariables,
  options?: Omit<
    UseQueryOptions<
      MyFeedbackAnswersQuery,
      Error,
      MyFeedbackAnswersQuery['myFeedbackAnswers'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetMyFeedbackAnswersOptions(variables, options));
}
