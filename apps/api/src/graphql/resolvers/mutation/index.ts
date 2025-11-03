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
  acceptInviteMutation,
  approveMembershipMutation,
  banMemberMutation,
  cancelJoinRequestMutation,
  cancelPendingOrInviteForUserMutation,
  inviteMemberMutation,
  kickMemberMutation,
  leaveIntentMutation,
  rejectMembershipMutation,
  requestJoinIntentMutation,
  unbanMemberMutation,
  updateMemberRoleMutation,
} from './intent-members';

// DM mutations
import {
  sendDmMessageMutation,
  updateDmMessageMutation,
  deleteDmMessageMutation,
  markDmMessageReadMutation,
  markDmThreadReadMutation,
  muteDmThreadMutation,
  deleteDmThreadMutation,
} from './dm';

// Comment mutations
import {
  createCommentMutation,
  updateCommentMutation,
  deleteCommentMutation,
} from './comments';

// Review mutations
import {
  createReviewMutation,
  updateReviewMutation,
  deleteReviewMutation,
} from './reviews';

// Report mutations
import {
  createReportMutation,
  updateReportStatusMutation,
  deleteReportMutation,
} from './reports';

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
  acceptInvite: acceptInviteMutation,
  requestJoinIntent: requestJoinIntentMutation,
  cancelJoinRequest: cancelJoinRequestMutation,
  leaveIntent: leaveIntentMutation,
  inviteMember: inviteMemberMutation,
  approveMembership: approveMembershipMutation,
  rejectMembership: rejectMembershipMutation,
  kickMember: kickMemberMutation,
  updateMemberRole: updateMemberRoleMutation,
  banMember: banMemberMutation,
  unbanMember: unbanMemberMutation,
  cancelPendingOrInviteForUser: cancelPendingOrInviteForUserMutation,

  // ---- Notifications ----
  addNotification: addNotificationMutation,
  deleteNotification: deleteNotificationMutation,
  markNotificationRead: markNotificationReadMutation,
  markAllNotificationsRead: markAllNotificationsReadMutation,

  // ---- DM (Direct Messages) ----
  sendDmMessage: sendDmMessageMutation,
  updateDmMessage: updateDmMessageMutation,
  deleteDmMessage: deleteDmMessageMutation,
  markDmMessageRead: markDmMessageReadMutation,
  markDmThreadRead: markDmThreadReadMutation,
  muteDmThread: muteDmThreadMutation,
  deleteDmThread: deleteDmThreadMutation,

  // ---- Comments ----
  createComment: createCommentMutation,
  updateComment: updateCommentMutation,
  deleteComment: deleteCommentMutation,

  // ---- Reviews ----
  createReview: createReviewMutation,
  updateReview: updateReviewMutation,
  deleteReview: deleteReviewMutation,

  // ---- Reports ----
  createReport: createReportMutation,
  updateReportStatus: updateReportStatusMutation,
  deleteReport: deleteReportMutation,

  // ---- Dev Auth (remove in production) ----
  devLogin: devLoginMutation,
  devLogout: devLogoutMutation,
};
