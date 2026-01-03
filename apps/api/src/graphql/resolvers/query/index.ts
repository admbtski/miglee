import type { Resolvers } from '../../__generated__/resolvers-types';
import { notificationsQuery } from './notifications';
import { eventsQuery, eventQuery } from './events';
import {
  categoriesBySlugsQuery,
  categoriesQuery,
  categoryQuery,
  checkCategorySlugAvailableQuery,
  getCategoryUsageCountQuery,
} from './categories';
import {
  tagsQuery,
  tagQuery,
  tagsBySlugsQuery,
  checkTagSlugAvailableQuery,
  getTagUsageCountQuery,
} from './tags';
import { usersQuery, userQuery } from './users';
import { adminUsersQuery } from './admin-all-users';
import { meQuery } from './auth';
import {
  eventMemberQuery,
  eventMembersQuery,
  eventMemberStatsQuery,
  myMembershipForEventQuery,
  myMembershipsQuery,
  myEventsQuery,
} from './event-members';
import { eventPermissionsQuery } from './event-permissions';
import { dmThreadsQuery, dmThreadQuery, dmMessagesQuery } from './dm';
import { commentsQuery, commentQuery } from './comments';
import {
  reviewsQuery,
  reviewQuery,
  reviewStatsQuery,
  myReviewQuery,
} from './reviews';
import { reportsQuery, reportQuery } from './reports';
import { eventMessagesQuery, eventUnreadCountQuery } from './event-chat';
import { myBlocksQuery, isBlockedQuery } from './user-blocks';
import {
  eventInviteLinksQuery,
  eventInviteLinkQuery,
  validateInviteLinkQuery,
} from './invite-links';
import { myFavouritesQuery, isFavouriteQuery } from './favourites';
import {
  eventJoinQuestionsQuery,
  eventJoinRequestsQuery,
  myJoinRequestsQuery,
} from './join-questions';
import {
  eventFeedbackQuestionsQuery,
  eventFeedbackResultsQuery,
  myFeedbackAnswersQuery,
  canSubmitFeedbackQuery,
} from './feedback-questions';
import {
  myNotificationPreferencesQuery,
  eventMuteQuery,
  dmMuteQuery,
} from './preferences-and-mutes';
import { clustersQuery, regionEventsQuery } from './map-clusters';
import {
  adminUserCommentsQuery,
  adminUserReviewsQuery,
  adminUserMembershipsQuery,
  adminUserEventsQuery,
  adminUserNotificationsQuery,
} from './admin-users';
import { adminUserAuditLogsQuery } from './admin-user-audit-logs';
import { adminCommentsQuery, adminReviewsQuery } from './admin-moderation';
import { userEventsQuery } from './user-events';
import { userReviewsQuery } from './user-reviews';
import {
  myPlanQuery,
  mySubscriptionQuery,
  myPlanPeriodsQuery,
  myEventSponsorshipsQuery,
  eventSponsorshipQuery,
} from './billing';
import { eventAgendaItemsQuery } from './agenda';
import { eventCheckinLogs } from './checkin';
import { eventAuditLogs, exportEventAuditLogs } from './audit';

export const Query: Resolvers['Query'] = {
  // Admin queries
  adminUserComments: adminUserCommentsQuery,
  adminUserReviews: adminUserReviewsQuery,
  adminUserMemberships: adminUserMembershipsQuery,
  adminUserEvents: adminUserEventsQuery,
  adminUserAuditLogs: adminUserAuditLogsQuery,
  adminUserNotifications: adminUserNotificationsQuery,
  adminComments: adminCommentsQuery,
  adminReviews: adminReviewsQuery,

  notifications: notificationsQuery,
  events: eventsQuery,
  event: eventQuery,
  categoriesBySlugs: categoriesBySlugsQuery,
  categories: categoriesQuery,
  category: categoryQuery,
  checkCategorySlugAvailable: checkCategorySlugAvailableQuery,
  getCategoryUsageCount: getCategoryUsageCountQuery,
  tagsBySlugs: tagsBySlugsQuery,
  tags: tagsQuery,
  tag: tagQuery,
  checkTagSlugAvailable: checkTagSlugAvailableQuery,
  getTagUsageCount: getTagUsageCountQuery,
  users: usersQuery,
  user: userQuery,
  adminUsers: adminUsersQuery,
  me: meQuery,
  eventMember: eventMemberQuery,
  eventMembers: eventMembersQuery,
  eventMemberStats: eventMemberStatsQuery,
  eventPermissions: eventPermissionsQuery,
  myMembershipForEvent: myMembershipForEventQuery,
  myMemberships: myMembershipsQuery,
  myEvents: myEventsQuery,
  dmThreads: dmThreadsQuery,
  dmThread: dmThreadQuery,
  dmMessages: dmMessagesQuery,
  comments: commentsQuery,
  comment: commentQuery,
  reviews: reviewsQuery,
  review: reviewQuery,
  reviewStats: reviewStatsQuery,
  myReview: myReviewQuery,
  reports: reportsQuery,
  report: reportQuery,
  eventMessages: eventMessagesQuery,
  eventUnreadCount: eventUnreadCountQuery,
  myBlocks: myBlocksQuery,
  isBlocked: isBlockedQuery,
  eventInviteLinks: eventInviteLinksQuery,
  eventInviteLink: eventInviteLinkQuery,
  validateInviteLink: validateInviteLinkQuery,
  myFavourites: myFavouritesQuery,
  isFavourite: isFavouriteQuery,
  eventJoinQuestions: eventJoinQuestionsQuery,
  eventJoinRequests: eventJoinRequestsQuery,
  myJoinRequests: myJoinRequestsQuery,
  eventFeedbackQuestions: eventFeedbackQuestionsQuery,
  eventFeedbackResults: eventFeedbackResultsQuery,
  myFeedbackAnswers: myFeedbackAnswersQuery,
  canSubmitFeedback: canSubmitFeedbackQuery,
  myNotificationPreferences: myNotificationPreferencesQuery,
  eventMute: eventMuteQuery,
  dmMute: dmMuteQuery,
  clusters: clustersQuery,
  regionEvents: regionEventsQuery,
  userEvents: userEventsQuery,
  userReviews: userReviewsQuery,

  // Billing queries
  myPlan: myPlanQuery,
  mySubscription: mySubscriptionQuery,
  myPlanPeriods: myPlanPeriodsQuery,
  myEventSponsorships: myEventSponsorshipsQuery,
  eventSponsorship: eventSponsorshipQuery,

  // Agenda
  eventAgendaItems: eventAgendaItemsQuery,

  // Check-in
  eventCheckinLogs,

  // Audit logs
  eventAuditLogs,
  exportEventAuditLogs,
};
