-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationKind" ADD VALUE 'EVENT_INVITE_ACCEPTED';
ALTER TYPE "public"."NotificationKind" ADD VALUE 'EVENT_MEMBER_KICKED';
ALTER TYPE "public"."NotificationKind" ADD VALUE 'EVENT_MEMBER_ROLE_CHANGED';
ALTER TYPE "public"."NotificationKind" ADD VALUE 'EVENT_REVIEW_RECEIVED';
ALTER TYPE "public"."NotificationKind" ADD VALUE 'EVENT_FEEDBACK_RECEIVED';
ALTER TYPE "public"."NotificationKind" ADD VALUE 'EVENT_FEEDBACK_REQUEST';
ALTER TYPE "public"."NotificationKind" ADD VALUE 'REVIEW_HIDDEN';
ALTER TYPE "public"."NotificationKind" ADD VALUE 'EVENT_COMMENT_ADDED';
ALTER TYPE "public"."NotificationKind" ADD VALUE 'COMMENT_REPLY';
ALTER TYPE "public"."NotificationKind" ADD VALUE 'COMMENT_HIDDEN';
ALTER TYPE "public"."NotificationKind" ADD VALUE 'EVENT_CHAT_MESSAGE';
