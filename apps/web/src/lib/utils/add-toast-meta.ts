/**
 * Mutation meta configurations for toast messages
 * Import this in your mutation builders to add success messages
 */

export const MUTATION_META = {
  // Intent mutations
  CreateIntent: 'Event created successfully',
  UpdateIntent: 'Event updated successfully',
  DeleteIntent: 'Event deleted successfully',
  CancelIntent: 'Event cancelled successfully',

  // Intent member mutations
  RequestJoinIntent: 'Join request sent successfully',
  CancelJoinRequest: 'Join request cancelled',
  LeaveIntent: 'You left the event',
  InviteMember: 'Member invited successfully',
  ApproveMembership: 'Membership approved',
  RejectMembership: 'Membership rejected',
  KickMember: 'Member kicked successfully',
  UpdateMemberRole: 'Member role updated',
  BanMember: 'Member banned successfully',
  UnbanMember: 'Member unbanned successfully',
  CancelPendingOrInviteForUser: 'Invitation cancelled',

  // Comment mutations
  CreateComment: 'Comment added',
  UpdateComment: 'Comment updated',
  DeleteComment: 'Comment deleted',
  CreateReply: 'Reply added',

  // Review mutations
  CreateReview: 'Review added',
  UpdateReview: 'Review updated',
  DeleteReview: 'Review deleted',

  // Reaction mutations
  AddReaction: 'Reaction added',
  RemoveReaction: 'Reaction removed',

  // DM mutations
  SendDirectMessage: 'Message sent',
  DeleteDirectMessage: 'Message deleted',
  MarkDMAsRead: 'Messages marked as read',
  CreateDMChannel: 'Conversation started',

  // Event chat mutations
  SendEventMessage: 'Message sent',
  DeleteEventMessage: 'Message deleted',
  MarkEventChatAsRead: 'Messages marked as read',

  // Report mutations
  CreateReport: 'Report submitted successfully',

  // User mutations
  UpdateProfile: 'Profile updated',
  UpdatePreferences: 'Preferences updated',
  BlockUser: 'User blocked',
  UnblockUser: 'User unblocked',
  MuteUser: 'User muted',
  UnmuteUser: 'User unmuted',

  // Admin mutations
  AdminSuspendUser: 'User suspended',
  AdminUnsuspendUser: 'User unsuspended',
  AdminBanUser: 'User banned',
  AdminUnbanUser: 'User unbanned',
  AdminDeleteUser: 'User deleted',
  AdminApproveIntent: 'Event approved',
  AdminRejectIntent: 'Event rejected',
  AdminDeleteIntent: 'Event deleted',
  AdminDeleteComment: 'Comment deleted',
  AdminDeleteReview: 'Review deleted',
  AdminKickMember: 'Member kicked',
  AdminBanMember: 'Member banned',
  AdminUnbanMember: 'Member unbanned',

  // Tag mutations
  CreateTag: 'Tag created',
  UpdateTag: 'Tag updated',
  DeleteTag: 'Tag deleted',

  // Category mutations
  CreateCategory: 'Category created',
  UpdateCategory: 'Category updated',
  DeleteCategory: 'Category deleted',

  // Notification mutations
  MarkNotificationAsRead: 'Notification marked as read',
  MarkAllNotificationsAsRead: 'All notifications marked as read',
  DeleteNotification: 'Notification deleted',
} as const;

export type MutationKey = keyof typeof MUTATION_META;
