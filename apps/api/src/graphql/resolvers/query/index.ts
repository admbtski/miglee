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
};
