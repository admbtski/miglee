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

// Event mutations (create/update/delete)
import {
  cancelEventMutation,
  closeEventJoinMutation,
  createEventMutation,
  deleteEventMutation,
  reopenEventJoinMutation,
  updateEventMutation,
  // Publication management
  publishEventMutation,
  scheduleEventPublicationMutation,
  cancelScheduledPublicationMutation,
  unpublishEventMutation,
} from './events';

// Notification mutations
import {
  addNotificationMutation,
  deleteNotificationMutation,
  markAllNotificationsReadMutation,
  markNotificationReadMutation,
} from './notifications';

// Event member / moderation mutations
import {
  acceptInviteMutation,
  approveMembershipMutation,
  banMemberMutation,
  cancelPendingOrInviteForUserMutation,
  inviteMemberMutation,
  joinWaitlistOpenMutation,
  kickMemberMutation,
  leaveEventMutation,
  leaveWaitlistMutation,
  promoteFromWaitlistMutation,
  rejectMembershipMutation,
  requestJoinEventMutation,
  unbanMemberMutation,
  updateMemberRoleMutation,
} from './event-members';

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
  hideCommentMutation,
  unhideCommentMutation,
} from './comments';

// Review mutations
import {
  createReviewMutation,
  updateReviewMutation,
  deleteReviewMutation,
  hideReviewMutation,
  unhideReviewMutation,
} from './reviews';

// Report mutations
import {
  createReportMutation,
  updateReportStatusMutation,
  deleteReportMutation,
} from './reports';

// Event Chat mutations
import {
  sendEventMessageMutation,
  editEventMessageMutation,
  deleteEventMessageMutation,
  markEventChatReadMutation,
  publishEventTypingMutation,
} from './event-chat';

// User Blocks mutations
import { blockUserMutation, unblockUserMutation } from './user-blocks';

// Event Invite Links mutations
import {
  createEventInviteLinkMutation,
  updateEventInviteLinkMutation,
  revokeEventInviteLinkMutation,
  deleteEventInviteLinkMutation,
  joinByInviteLinkMutation,
} from './invite-links';

// Favourites mutations
import { toggleFavouriteMutation } from './favourites';

// Join Questions mutations
import { joinQuestionsMutations } from './join-questions';

// Feedback Questions mutations
import {
  createFeedbackQuestionMutation,
  updateFeedbackQuestionMutation,
  deleteFeedbackQuestionMutation,
  reorderFeedbackQuestionsMutation,
  submitReviewAndFeedbackMutation,
  sendFeedbackRequestsMutation,
  updateEventFeedbackQuestionsMutation,
} from './feedback-questions';

// FAQ mutations
import { faqMutations } from './faq';

// Join Requests mutations
import {
  requestJoinEventWithAnswersMutation,
  approveJoinRequestMutation,
  rejectJoinRequestMutation,
  cancelJoinRequestMutation as cancelJoinRequestMutationNew,
} from './join-requests';

// Notification Preferences & Mutes mutations
import {
  updateNotificationPreferencesMutation,
  muteEventMutation,
  muteDmThreadMutation,
} from './preferences-and-mutes';

// Reactions mutations
import {
  addDmReactionMutation,
  removeDmReactionMutation,
} from './dm-reactions';
import {
  addEventReactionMutation,
  removeEventReactionMutation,
} from './event-reactions';

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

// Admin Event Management mutations
import {
  adminUpdateEventMutation,
  adminDeleteEventMutation,
  adminCancelEventMutation,
  adminRestoreEventMutation,
  adminChangeEventOwnerMutation,
  adminBulkUpdateEventsMutation,
  adminUpdateMemberRoleMutation,
  adminKickMemberMutation,
  adminBanMemberMutation,
  adminUnbanMemberMutation,
} from './admin-events';

// Admin Content Moderation mutations
import {
  adminDeleteCommentMutation,
  adminDeleteReviewMutation,
} from './admin-moderation';

// User Profile & Privacy mutations
import {
  updateUserProfileMutation,
  updateUserPrivacyMutation,
  upsertUserCategoryLevelMutation,
  removeUserCategoryLevelMutation,
  upsertUserAvailabilityMutation,
  removeUserAvailabilityMutation,
  addUserSocialLinkMutation,
  removeUserSocialLinkMutation,
  updateUserLocaleMutation,
  updateUserTimezoneMutation,
} from './user-profile';

// User Account Deletion
import { deleteMyAccountMutation } from './delete-my-account';

// User Account Restoration
import {
  requestAccountRestorationMutation,
  restoreMyAccountMutation,
} from './restore-account';

// Media Upload mutations
import { getUploadUrl, confirmMediaUpload } from './media';

// Billing mutations
import {
  createSubscriptionCheckoutMutation,
  createOneOffCheckoutMutation,
  createEventSponsorshipCheckoutMutation,
  cancelSubscriptionMutation,
  reactivateSubscriptionMutation,
  useBoostMutation,
  useLocalPushMutation,
  getUserPlanReceiptUrlMutation,
  getEventSponsorshipReceiptUrlMutation,
} from './billing';

// Appearance mutations
import { updateEventAppearanceMutation } from './appearance';

// Agenda mutations
import { updateEventAgendaMutation } from './agenda';

// Audit mutations
import { archiveEventAuditLogs } from './audit';

// Check-in mutations
import {
  checkInSelf,
  uncheckInSelf,
  checkInMember,
  uncheckInMember,
  rejectMemberCheckin,
  blockMemberCheckin,
  unblockMemberCheckin,
  checkInByEventQr,
  checkInByUserQr,
  updateEventCheckinConfig,
  rotateEventCheckinToken,
  rotateMemberCheckinToken,
} from './checkin';

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

  // ---- Admin Event Management ----
  adminUpdateEvent: adminUpdateEventMutation,
  adminDeleteEvent: adminDeleteEventMutation,
  adminCancelEvent: adminCancelEventMutation,
  adminRestoreEvent: adminRestoreEventMutation,
  adminChangeEventOwner: adminChangeEventOwnerMutation,
  adminBulkUpdateEvents: adminBulkUpdateEventsMutation,

  // ---- Admin Event Member Management ----
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

  // ---- Event ----
  createEvent: createEventMutation,
  updateEvent: updateEventMutation,
  cancelEvent: cancelEventMutation,
  deleteEvent: deleteEventMutation,
  closeEventJoin: closeEventJoinMutation,
  reopenEventJoin: reopenEventJoinMutation,

  // ---- Event Publication ----
  publishEvent: publishEventMutation,
  scheduleEventPublication: scheduleEventPublicationMutation,
  cancelScheduledPublication: cancelScheduledPublicationMutation,
  unpublishEvent: unpublishEventMutation,

  // ---- Event Members / Moderation ----
  acceptInvite: acceptInviteMutation,
  requestJoinEvent: requestJoinEventMutation,
  requestJoinEventWithAnswers: requestJoinEventWithAnswersMutation,
  cancelJoinRequest: cancelJoinRequestMutationNew, // Updated to handle CANCELLED status
  leaveEvent: leaveEventMutation,
  inviteMember: inviteMemberMutation,
  approveMembership: approveMembershipMutation,
  approveJoinRequest: approveJoinRequestMutation,
  rejectMembership: rejectMembershipMutation,
  rejectJoinRequest: rejectJoinRequestMutation,
  kickMember: kickMemberMutation,
  updateMemberRole: updateMemberRoleMutation,
  banMember: banMemberMutation,
  unbanMember: unbanMemberMutation,
  cancelPendingOrInviteForUser: cancelPendingOrInviteForUserMutation,

  // ---- Waitlist ----
  joinWaitlistOpen: joinWaitlistOpenMutation,
  leaveWaitlist: leaveWaitlistMutation,
  promoteFromWaitlist: promoteFromWaitlistMutation,

  // ---- Check-in ----
  checkInSelf,
  uncheckInSelf,
  checkInMember,
  uncheckInMember,
  rejectMemberCheckin,
  blockMemberCheckin,
  unblockMemberCheckin,
  checkInByEventQr,
  checkInByUserQr,
  updateEventCheckinConfig,
  rotateEventCheckinToken,
  rotateMemberCheckinToken,

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
  sendEventMessage: sendEventMessageMutation,
  editEventMessage: editEventMessageMutation,
  deleteEventMessage: deleteEventMessageMutation,
  markEventChatRead: markEventChatReadMutation,
  publishEventTyping: publishEventTypingMutation,

  // ---- Comments ----
  createComment: createCommentMutation,
  updateComment: updateCommentMutation,
  deleteComment: deleteCommentMutation,
  hideComment: hideCommentMutation,
  unhideComment: unhideCommentMutation,

  // ---- Reviews ----
  createReview: createReviewMutation,
  updateReview: updateReviewMutation,
  deleteReview: deleteReviewMutation,
  hideReview: hideReviewMutation,
  unhideReview: unhideReviewMutation,

  // ---- Reports ----
  createReport: createReportMutation,
  updateReportStatus: updateReportStatusMutation,
  deleteReport: deleteReportMutation,

  // ---- User Blocks ----
  blockUser: blockUserMutation,
  unblockUser: unblockUserMutation,

  // ---- Event Invite Links ----
  createEventInviteLink: createEventInviteLinkMutation,
  updateEventInviteLink: updateEventInviteLinkMutation,
  revokeEventInviteLink: revokeEventInviteLinkMutation,
  deleteEventInviteLink: deleteEventInviteLinkMutation,
  joinByInviteLink: joinByInviteLinkMutation,

  // ---- Favourites ----
  toggleFavourite: toggleFavouriteMutation,

  // ---- Feedback Management ----
  createFeedbackQuestion: createFeedbackQuestionMutation,
  updateFeedbackQuestion: updateFeedbackQuestionMutation,
  deleteFeedbackQuestion: deleteFeedbackQuestionMutation,
  reorderFeedbackQuestions: reorderFeedbackQuestionsMutation,
  submitReviewAndFeedback: submitReviewAndFeedbackMutation,
  sendFeedbackRequests: sendFeedbackRequestsMutation,
  updateEventFeedbackQuestions: updateEventFeedbackQuestionsMutation,

  // ---- FAQ Management ----
  updateEventFaqs: faqMutations.updateEventFaqs!,

  // ---- Join Questions Management ----
  updateEventJoinQuestions: joinQuestionsMutations.updateEventJoinQuestions!,

  // ---- Notification Preferences & Mutes ----
  updateNotificationPreferences: updateNotificationPreferencesMutation,
  muteEvent: muteEventMutation,
  muteDmThread: muteDmThreadMutation,

  // ---- Reactions ----
  addDmReaction: addDmReactionMutation,
  removeDmReaction: removeDmReactionMutation,
  addEventReaction: addEventReactionMutation,
  removeEventReaction: removeEventReactionMutation,

  // ---- User Profile & Privacy ----
  updateUserProfile: updateUserProfileMutation,
  updateUserPrivacy: updateUserPrivacyMutation,
  upsertUserCategoryLevel: upsertUserCategoryLevelMutation,
  removeUserCategoryLevel: removeUserCategoryLevelMutation,
  upsertUserAvailability: upsertUserAvailabilityMutation,
  removeUserAvailability: removeUserAvailabilityMutation,
  addUserSocialLink: addUserSocialLinkMutation,
  removeUserSocialLink: removeUserSocialLinkMutation,
  updateUserLocale: updateUserLocaleMutation,
  updateUserTimezone: updateUserTimezoneMutation,

  // ---- User Account Deletion ----
  deleteMyAccount: deleteMyAccountMutation,

  // ---- User Account Restoration ----
  requestAccountRestoration: requestAccountRestorationMutation,
  restoreMyAccount: restoreMyAccountMutation,

  // ---- Media Upload ----
  getUploadUrl,
  confirmMediaUpload,

  // ---- Billing & Subscriptions ----
  createSubscriptionCheckout: createSubscriptionCheckoutMutation,
  createOneOffCheckout: createOneOffCheckoutMutation,
  createEventSponsorshipCheckout: createEventSponsorshipCheckoutMutation,
  cancelSubscription: cancelSubscriptionMutation,
  reactivateSubscription: reactivateSubscriptionMutation,
  useBoost: useBoostMutation,
  useLocalPush: useLocalPushMutation,
  getUserPlanReceiptUrl: getUserPlanReceiptUrlMutation,
  getEventSponsorshipReceiptUrl: getEventSponsorshipReceiptUrlMutation,

  // ---- Appearance ----
  updateEventAppearance: updateEventAppearanceMutation,

  // ---- Agenda ----
  updateEventAgenda: updateEventAgendaMutation,

  // ---- Audit ----
  archiveEventAuditLogs,

  // ---- Dev Auth (remove in production) ----
  devLogin: devLoginMutation,
  devLogout: devLogoutMutation,
};
