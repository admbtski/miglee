import type { Resolvers } from '../../__generated__/resolvers-types';

// Category mutations
import {
  createCategoryMutation,
  deleteCategoryMutation,
  updateCategoryMutation,
} from './categories';

// Tag mutations
import {
  createTagMutation,
  deleteTagMutation,
  updateTagMutation,
} from './tags';

// Intent mutations (create/update/delete)
import {
  cancelIntentMutation,
  createIntentMutation,
  deleteIntentMutation,
  updateIntentMutation,
} from './intents';

// Notification mutations
import {
  addNotificationMutation,
  deleteNotificationMutation,
  markAllNotificationsReadMutation,
  markNotificationReadMutation,
} from './notifications';

// Intent member / moderation mutations
import {
  approveMembershipMutation,
  cancelJoinRequestMutation,
  inviteIntentMutation,
  kickMemberMutation,
  leaveIntentMutation,
  rejectMembershipMutation,
  requestJoinIntentMutation,
  updateMemberRoleMutation,
} from './intent-members';
import { devLoginMutation, devLogoutMutation } from './auth';

/**
 * Root Mutation resolvers map.
 * This object registers all mutation resolvers under the GraphQL Mutation type.
 */
export const Mutation: Resolvers['Mutation'] = {
  // ---- Category ----
  createCategory: createCategoryMutation,
  updateCategory: updateCategoryMutation,
  deleteCategory: deleteCategoryMutation,

  // ---- Tag ----
  createTag: createTagMutation,
  updateTag: updateTagMutation,
  deleteTag: deleteTagMutation,

  // ---- Intent ----
  createIntent: createIntentMutation,
  updateIntent: updateIntentMutation,
  cancelIntent: cancelIntentMutation,
  deleteIntent: deleteIntentMutation,

  // ---- Intent Members / Moderation ----
  requestJoinIntent: requestJoinIntentMutation,
  cancelJoinRequest: cancelJoinRequestMutation,
  leaveIntent: leaveIntentMutation,
  inviteIntent: inviteIntentMutation,
  approveMembership: approveMembershipMutation,
  rejectMembership: rejectMembershipMutation,
  kickMember: kickMemberMutation,
  updateMemberRole: updateMemberRoleMutation,

  // ---- Notifications ----
  addNotification: addNotificationMutation,
  deleteNotification: deleteNotificationMutation,
  markNotificationRead: markNotificationReadMutation,
  markAllNotificationsRead: markAllNotificationsReadMutation,

  devLogin: devLoginMutation,
  devLogout: devLogoutMutation,
};
