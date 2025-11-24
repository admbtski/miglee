import type { Resolvers } from '../../__generated__/resolvers-types';
import { notificationsQuery } from './notifications';
import { intentsQuery, intentQuery } from './intents';
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
import { meQuery } from './auth';
import {
  intentMemberQuery,
  intentMembersQuery,
  intentMemberStatsQuery,
  myMembershipsQuery,
  myIntentsQuery,
} from './intent-members';
import { dmThreadsQuery, dmThreadQuery, dmMessagesQuery } from './dm';
import { commentsQuery, commentQuery } from './comments';
import {
  reviewsQuery,
  reviewQuery,
  reviewStatsQuery,
  myReviewQuery,
} from './reviews';
import { reportsQuery, reportQuery } from './reports';
import { intentMessagesQuery, intentUnreadCountQuery } from './event-chat';
import { myBlocksQuery, isBlockedQuery } from './user-blocks';
import {
  intentInviteLinksQuery,
  intentInviteLinkQuery,
  validateInviteLinkQuery,
} from './invite-links';
import { myFavouritesQuery, isFavouriteQuery } from './favourites';
import {
  intentJoinQuestionsQuery,
  intentJoinRequestsQuery,
  myJoinRequestsQuery,
} from './join-questions';
import {
  myNotificationPreferencesQuery,
  intentMuteQuery,
  dmMuteQuery,
} from './preferences-and-mutes';
import { clustersQuery, regionIntentsQuery } from './map-clusters';
import {
  adminUserCommentsQuery,
  adminUserReviewsQuery,
  adminUserMembershipsQuery,
  adminUserIntentsQuery,
  adminUserDmThreadsQuery,
  adminUserNotificationsQuery,
} from './admin-users';
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

export const Query: Resolvers['Query'] = {
  // Admin queries
  adminUserComments: adminUserCommentsQuery,
  adminUserReviews: adminUserReviewsQuery,
  adminUserMemberships: adminUserMembershipsQuery,
  adminUserIntents: adminUserIntentsQuery,
  adminUserDmThreads: adminUserDmThreadsQuery,
  adminUserNotifications: adminUserNotificationsQuery,
  adminComments: adminCommentsQuery,
  adminReviews: adminReviewsQuery,

  notifications: notificationsQuery,
  intents: intentsQuery,
  intent: intentQuery,
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
  me: meQuery,
  intentMember: intentMemberQuery,
  intentMembers: intentMembersQuery,
  intentMemberStats: intentMemberStatsQuery,
  myMemberships: myMembershipsQuery,
  myIntents: myIntentsQuery,
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
  intentMessages: intentMessagesQuery,
  intentUnreadCount: intentUnreadCountQuery,
  myBlocks: myBlocksQuery,
  isBlocked: isBlockedQuery,
  intentInviteLinks: intentInviteLinksQuery,
  intentInviteLink: intentInviteLinkQuery,
  validateInviteLink: validateInviteLinkQuery,
  myFavourites: myFavouritesQuery,
  isFavourite: isFavouriteQuery,
  intentJoinQuestions: intentJoinQuestionsQuery,
  intentJoinRequests: intentJoinRequestsQuery,
  myJoinRequests: myJoinRequestsQuery,
  myNotificationPreferences: myNotificationPreferencesQuery,
  intentMute: intentMuteQuery,
  dmMute: dmMuteQuery,
  clusters: clustersQuery,
  regionIntents: regionIntentsQuery,
  userEvents: userEventsQuery,
  userReviews: userReviewsQuery,

  // Billing queries
  myPlan: myPlanQuery,
  mySubscription: mySubscriptionQuery,
  myPlanPeriods: myPlanPeriodsQuery,
  myEventSponsorships: myEventSponsorshipsQuery,
  eventSponsorship: eventSponsorshipQuery,
};
