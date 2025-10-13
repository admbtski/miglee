import type { Resolvers } from '../../__generated__/resolvers-types';
import {
  createCategoryMutation,
  deleteCategoryMutation,
  updateCategoryMutation,
} from './categories';
import {
  createIntentMutation,
  deleteIntentMutation,
  updateIntentMutation,
} from './intents';
import { addNotificationMutation } from './notifications';
import {
  createTagMutation,
  deleteTagMutation,
  updateTagMutation,
} from './tags';

export const Mutation: Resolvers['Mutation'] = {
  addNotification: addNotificationMutation,
  createCategory: createCategoryMutation,
  updateCategory: updateCategoryMutation,
  deleteCategory: deleteCategoryMutation,
  createTag: createTagMutation,
  updateTag: updateTagMutation,
  deleteTag: deleteTagMutation,
  createIntent: createIntentMutation,
  updateIntent: updateIntentMutation,
  deleteIntent: deleteIntentMutation,
};
