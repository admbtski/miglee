import type { Resolvers } from '../../__generated__/resolvers-types';
import { eventsQuery } from './events';
import { notificationsQuery } from './notifications';
import { intentsQuery, intentQuery } from './intents';
import { categoriesQuery, categoryQuery } from './categories';
import { tagsQuery, tagQuery } from './tags';
import { usersQuery, userQuery } from './users';

export const Query: Resolvers['Query'] = {
  events: eventsQuery,
  notifications: notificationsQuery,
  intents: intentsQuery,
  intent: intentQuery,
  categories: categoriesQuery,
  category: categoryQuery,
  tags: tagsQuery,
  tag: tagQuery,
  users: usersQuery,
  user: userQuery,
};
