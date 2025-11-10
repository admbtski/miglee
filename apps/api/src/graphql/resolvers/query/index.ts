import type { Resolvers } from '../../__generated__/resolvers-types';
import { notificationsQuery } from './notifications';
import { intentsQuery, intentQuery } from './intents';
import {
  categoriesBySlugsQuery,
  categoriesQuery,
  categoryQuery,
} from './categories';
import { tagsQuery, tagQuery, tagsBySlugsQuery } from './tags';
import { usersQuery, userQuery } from './users';
import { meQuery } from './auth';
import {
  intentMemberQuery,
  intentMembersQuery,
  intentMemberStatsQuery,
  myMembershipsQuery,
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
import { intentInviteLinksQuery, intentInviteLinkQuery } from './invite-links';
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
} from './admin-users';

export const Query: Resolvers['Query'] = {
  // Admin queries
  adminUserComments: adminUserCommentsQuery,
  adminUserReviews: adminUserReviewsQuery,
  adminUserMemberships: adminUserMembershipsQuery,
  adminUserIntents: adminUserIntentsQuery,
  adminUserDmThreads: adminUserDmThreadsQuery,

  notifications: notificationsQuery,
  intents: intentsQuery,
  intent: intentQuery,
  categoriesBySlugs: categoriesBySlugsQuery,
  categories: categoriesQuery,
  category: categoryQuery,
  tagsBySlugs: tagsBySlugsQuery,
  tags: tagsQuery,
  tag: tagQuery,
  users: usersQuery,
  user: userQuery,
  me: meQuery,
  intentMember: intentMemberQuery,
  intentMembers: intentMembersQuery,
  intentMemberStats: intentMemberStatsQuery,
  myMemberships: myMembershipsQuery,
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
  myNotificationPreferences: myNotificationPreferencesQuery,
  intentMute: intentMuteQuery,
  dmMute: dmMuteQuery,
  clusters: clustersQuery,
  regionIntents: regionIntentsQuery,
};
