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
import {
  dmThreadsQuery,
  dmThreadQuery,
  dmMessagesQuery,
  dmMuteQuery,
} from './dm';
import { commentsQuery, commentQuery } from './comments';
import {
  reviewsQuery,
  reviewQuery,
  reviewStatsQuery,
  myReviewQuery,
} from './reviews';
import { reportsQuery, reportQuery } from './reports';

export const Query: Resolvers['Query'] = {
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
  dmMute: dmMuteQuery,
  comments: commentsQuery,
  comment: commentQuery,
  reviews: reviewsQuery,
  review: reviewQuery,
  reviewStats: reviewStatsQuery,
  myReview: myReviewQuery,
  reports: reportsQuery,
  report: reportQuery,
};
