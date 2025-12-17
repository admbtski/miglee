import { GetNotificationsQueryVariables } from '@/lib/api/__generated__/react-query-update';

export const GET_NOTIFICATIONS_KEY = (
  variables?: GetNotificationsQueryVariables
) =>
  variables
    ? (['GetNotifications', variables] as const)
    : (['GetNotifications'] as const);

export const GET_NOTIFICATIONS_INFINITE_KEY = (
  variables?: Omit<GetNotificationsQueryVariables, 'offset'>
) =>
  variables
    ? (['GetNotificationsInfinite', variables] as const)
    : (['GetNotificationsInfinite'] as const);
