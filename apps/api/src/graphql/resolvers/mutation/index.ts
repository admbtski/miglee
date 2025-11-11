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
  createOrGetDmThreadMutation,
  sendDmMessageMutation,
  updateDmMessageMutation,
  deleteDmMessageMutation,
  markDmMessageReadMutation,
  markDmThreadReadMutation,
  deleteDmThreadMutation,
  publishDmTypingMutation,
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

// Event Chat mutations
import {
  sendIntentMessageMutation,
  editIntentMessageMutation,
  deleteIntentMessageMutation,
  markIntentChatReadMutation,
  publishIntentTypingMutation,
} from './event-chat';

// User Blocks mutations
import { blockUserMutation, unblockUserMutation } from './user-blocks';

// Intent Invite Links mutations
import {
  createIntentInviteLinkMutation,
  deleteIntentInviteLinkMutation,
  useIntentInviteLinkMutation,
} from './invite-links';

// Notification Preferences & Mutes mutations
import {
  updateNotificationPreferencesMutation,
  muteIntentMutation,
  muteDmThreadMutation,
} from './preferences-and-mutes';

// Reactions mutations
import {
  addDmReactionMutation,
  removeDmReactionMutation,
} from './dm-reactions';
import {
  addIntentReactionMutation,
  removeIntentReactionMutation,
} from './intent-reactions';

import { devLoginMutation, devLogoutMutation } from './auth';

// Admin User Management mutations
import {
  adminUpdateUserMutation,
  adminDeleteUserMutation,
  adminInviteUserMutation,
  adminCreateUserMutation,
  adminSuspendUserMutation,
  adminUnsuspendUserMutation,
} from './admin-users';

// Admin Intent Management mutations
import {
  adminUpdateIntentMutation,
  adminDeleteIntentMutation,
  adminCancelIntentMutation,
  adminRestoreIntentMutation,
  adminChangeIntentOwnerMutation,
  adminBulkUpdateIntentsMutation,
  adminUpdateMemberRoleMutation,
  adminKickMemberMutation,
  adminBanMemberMutation,
  adminUnbanMemberMutation,
} from './admin-intents';

// Admin Content Moderation mutations
import {
  adminDeleteCommentMutation,
  adminDeleteReviewMutation,
} from './admin-moderation';

/**
 * Root Mutation resolvers map.
 * This object registers all mutation resolvers under the GraphQL Mutation type.
 */
export const Mutation: Resolvers['Mutation'] = {
  // ---- Admin User Management ----
  adminUpdateUser: adminUpdateUserMutation,
  adminDeleteUser: adminDeleteUserMutation,
  adminInviteUser: adminInviteUserMutation,
  adminCreateUser: adminCreateUserMutation,
  adminSuspendUser: adminSuspendUserMutation,
  adminUnsuspendUser: adminUnsuspendUserMutation,

  // ---- Admin Intent Management ----
  adminUpdateIntent: adminUpdateIntentMutation,
  adminDeleteIntent: adminDeleteIntentMutation,
  adminCancelIntent: adminCancelIntentMutation,
  adminRestoreIntent: adminRestoreIntentMutation,
  adminChangeIntentOwner: adminChangeIntentOwnerMutation,
  adminBulkUpdateIntents: adminBulkUpdateIntentsMutation,

  // ---- Admin Intent Member Management ----
  adminUpdateMemberRole: adminUpdateMemberRoleMutation,
  adminKickMember: adminKickMemberMutation,
  adminBanMember: adminBanMemberMutation,
  adminUnbanMember: adminUnbanMemberMutation,

  // ---- Admin Content Moderation ----
  adminDeleteComment: adminDeleteCommentMutation,
  adminDeleteReview: adminDeleteReviewMutation,

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
  createOrGetDmThread: createOrGetDmThreadMutation,
  sendDmMessage: sendDmMessageMutation,
  updateDmMessage: updateDmMessageMutation,
  deleteDmMessage: deleteDmMessageMutation,
  markDmMessageRead: markDmMessageReadMutation,
  markDmThreadRead: markDmThreadReadMutation,
  deleteDmThread: deleteDmThreadMutation,
  publishDmTyping: publishDmTypingMutation,

  // ---- Event Chat ----
  sendIntentMessage: sendIntentMessageMutation,
  editIntentMessage: editIntentMessageMutation,
  deleteIntentMessage: deleteIntentMessageMutation,
  markIntentChatRead: markIntentChatReadMutation,
  publishIntentTyping: publishIntentTypingMutation,

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

  // ---- User Blocks ----
  blockUser: blockUserMutation,
  unblockUser: unblockUserMutation,

  // ---- Intent Invite Links ----
  createIntentInviteLink: createIntentInviteLinkMutation,
  deleteIntentInviteLink: deleteIntentInviteLinkMutation,
  useIntentInviteLink: useIntentInviteLinkMutation,

  // ---- Notification Preferences & Mutes ----
  updateNotificationPreferences: updateNotificationPreferencesMutation,
  muteIntent: muteIntentMutation,
  muteDmThread: muteDmThreadMutation,

  // ---- Reactions ----
  addDmReaction: addDmReactionMutation,
  removeDmReaction: removeDmReactionMutation,
  addIntentReaction: addIntentReactionMutation,
  removeIntentReaction: removeIntentReactionMutation,

  // ---- Dev Auth (remove in production) ----
  devLogin: devLoginMutation,
  devLogout: devLogoutMutation,
};
