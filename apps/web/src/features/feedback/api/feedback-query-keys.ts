import {
  CanSubmitFeedbackQueryVariables,
  EventFeedbackQuestionsQueryVariables,
  EventFeedbackResultsQueryVariables,
  MyFeedbackAnswersQueryVariables,
} from '@/lib/api/__generated__/react-query-update';

export const GET_FEEDBACK_QUESTIONS_KEY = (
  variables: EventFeedbackQuestionsQueryVariables
) => ['GetEventFeedbackQuestions', variables] as const;

export const GET_FEEDBACK_RESULTS_KEY = (
  variables: EventFeedbackResultsQueryVariables
) => ['GetEventFeedbackResults', variables] as const;

export const GET_MY_FEEDBACK_ANSWERS_KEY = (
  variables: MyFeedbackAnswersQueryVariables
) => ['GetMyFeedbackAnswers', variables] as const;

export const GET_CAN_SUBMIT_FEEDBACK_KEY = (
  variables: CanSubmitFeedbackQueryVariables
) => ['GetCanSubmitFeedback', variables] as const;
