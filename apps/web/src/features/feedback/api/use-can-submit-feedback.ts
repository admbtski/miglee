import {
  CanSubmitFeedbackDocument,
  CanSubmitFeedbackQuery,
  CanSubmitFeedbackQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_CAN_SUBMIT_FEEDBACK_KEY } from './feedback-query-keys';

export function buildGetCanSubmitFeedbackOptions(
  variables: CanSubmitFeedbackQueryVariables,
  options?: Omit<
    UseQueryOptions<
      CanSubmitFeedbackQuery,
      Error,
      CanSubmitFeedbackQuery['canSubmitFeedback'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  CanSubmitFeedbackQuery,
  Error,
  CanSubmitFeedbackQuery['canSubmitFeedback'],
  QueryKey
> {
  return {
    queryKey: GET_CAN_SUBMIT_FEEDBACK_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        CanSubmitFeedbackQuery,
        CanSubmitFeedbackQueryVariables
      >(CanSubmitFeedbackDocument, variables),
    select: (data) => data.canSubmitFeedback,
    ...(options ?? {}),
  };
}

export function useCanSubmitFeedbackQuery(
  variables: CanSubmitFeedbackQueryVariables,
  options?: Omit<
    UseQueryOptions<
      CanSubmitFeedbackQuery,
      Error,
      CanSubmitFeedbackQuery['canSubmitFeedback'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetCanSubmitFeedbackOptions(variables, options));
}
