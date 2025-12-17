import {
  GetNotificationsQuery,
  GetNotificationsQueryVariables,
  NotificationAddedSubscription,
} from '@/lib/api/__generated__/react-query-update';

export type NotificationNode = NonNullable<
  NotificationAddedSubscription['notificationAdded']
>;

export type OnNotification = (notification: NotificationNode) => void;

export type CtxList = { previous?: GetNotificationsQuery | undefined };

type NotificationsVarsBase = GetNotificationsQueryVariables;

export type NotificationsVarsNoOffset = Omit<
  NotificationsVarsBase,
  'offset'
> & {
  recipientId: string;
};

export type NotificationsVarsList = NotificationsVarsNoOffset & {
  offset?: number | null | undefined;
};
