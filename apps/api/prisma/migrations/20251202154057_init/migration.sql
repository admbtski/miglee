-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "public"."Visibility" AS ENUM ('PUBLIC', 'HIDDEN');

-- CreateEnum
CREATE TYPE "public"."AddressVisibility" AS ENUM ('PUBLIC', 'AFTER_JOIN', 'HIDDEN');

-- CreateEnum
CREATE TYPE "public"."MembersVisibility" AS ENUM ('PUBLIC', 'AFTER_JOIN', 'HIDDEN');

-- CreateEnum
CREATE TYPE "public"."JoinMode" AS ENUM ('OPEN', 'REQUEST', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "public"."Mode" AS ENUM ('ONE_TO_ONE', 'GROUP', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."MeetingKind" AS ENUM ('ONSITE', 'ONLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "public"."Level" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "public"."EventMemberRole" AS ENUM ('OWNER', 'MODERATOR', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "public"."EventMemberStatus" AS ENUM ('JOINED', 'PENDING', 'INVITED', 'REJECTED', 'BANNED', 'LEFT', 'KICKED', 'CANCELLED', 'WAITLIST');

-- CreateEnum
CREATE TYPE "public"."NotificationKind" AS ENUM ('EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_CANCELED', 'EVENT_DELETED', 'EVENT_INVITE', 'EVENT_MEMBERSHIP_APPROVED', 'EVENT_MEMBERSHIP_REJECTED', 'EVENT_REMINDER', 'JOIN_REQUEST', 'NEW_MESSAGE', 'NEW_COMMENT', 'NEW_REVIEW', 'BANNED', 'UNBANNED', 'SYSTEM', 'WAITLIST_JOINED', 'WAITLIST_PROMOTED');

-- CreateEnum
CREATE TYPE "public"."NotificationEntity" AS ENUM ('EVENT', 'MESSAGE', 'PAYMENT', 'INVOICE', 'USER', 'REVIEW', 'SYSTEM', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."SponsorshipStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('PLUS', 'PRO');

-- CreateEnum
CREATE TYPE "public"."UserPlanSource" AS ENUM ('SUBSCRIPTION', 'ONE_OFF');

-- CreateEnum
CREATE TYPE "public"."BillingPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('INCOMPLETE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'PAUSED');

-- CreateEnum
CREATE TYPE "public"."EventPlan" AS ENUM ('FREE', 'PLUS', 'PRO');

-- CreateEnum
CREATE TYPE "public"."MemberEvent" AS ENUM ('JOIN', 'REQUEST', 'APPROVE', 'REJECT', 'LEAVE', 'KICK', 'BAN', 'UNBAN', 'INVITE', 'ACCEPT_INVITE', 'CANCEL_REQUEST', 'WAITLIST', 'WAITLIST_LEAVE', 'WAITLIST_PROMOTE');

-- CreateEnum
CREATE TYPE "public"."JoinQuestionType" AS ENUM ('TEXT', 'SINGLE_CHOICE', 'MULTI_CHOICE');

-- CreateEnum
CREATE TYPE "public"."FeedbackQuestionType" AS ENUM ('TEXT', 'SINGLE_CHOICE', 'MULTI_CHOICE');

-- CreateEnum
CREATE TYPE "public"."ReportEntity" AS ENUM ('EVENT', 'COMMENT', 'REVIEW', 'USER', 'MESSAGE');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarKey" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "verifiedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedReason" TEXT,
    "restorationToken" TEXT,
    "restorationTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "locale" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "acceptedTermsAt" TIMESTAMP(3),
    "acceptedMarketingAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "names" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "visibility" "public"."Visibility" NOT NULL DEFAULT 'PUBLIC',
    "joinMode" "public"."JoinMode" NOT NULL DEFAULT 'OPEN',
    "mode" "public"."Mode" NOT NULL DEFAULT 'GROUP',
    "min" INTEGER,
    "max" INTEGER,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "joinOpensMinutesBeforeStart" INTEGER,
    "joinCutoffMinutesBeforeStart" INTEGER,
    "allowJoinLate" BOOLEAN NOT NULL DEFAULT true,
    "lateJoinCutoffMinutesAfterStart" INTEGER,
    "joinManuallyClosed" BOOLEAN NOT NULL DEFAULT false,
    "joinManuallyClosedAt" TIMESTAMP(3),
    "joinManuallyClosedById" TEXT,
    "joinManualCloseReason" TEXT,
    "meetingKind" "public"."MeetingKind" NOT NULL DEFAULT 'ONSITE',
    "onlineUrl" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "address" TEXT,
    "placeId" TEXT,
    "radiusKm" DOUBLE PRECISION,
    "cityName" TEXT,
    "cityPlaceId" TEXT,
    "geom" geography(Point, 4326),
    "levels" "public"."Level"[] DEFAULT ARRAY[]::"public"."Level"[],
    "coverKey" TEXT,
    "addressVisibility" "public"."AddressVisibility" NOT NULL DEFAULT 'PUBLIC',
    "membersVisibility" "public"."MembersVisibility" NOT NULL DEFAULT 'PUBLIC',
    "joinedCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "messagesCount" INTEGER NOT NULL DEFAULT 0,
    "savedCount" INTEGER NOT NULL DEFAULT 0,
    "sponsorshipPlan" "public"."EventPlan" NOT NULL DEFAULT 'FREE',
    "boostedAt" TIMESTAMP(3),
    "highlightColor" TEXT,
    "ownerId" TEXT,
    "canceledAt" TIMESTAMP(3),
    "canceledById" TEXT,
    "cancelReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "deleteReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_members" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."EventMemberRole" NOT NULL DEFAULT 'PARTICIPANT',
    "status" "public"."EventMemberStatus" NOT NULL DEFAULT 'PENDING',
    "addedById" TEXT,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "note" TEXT,
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_member_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "kind" "public"."MemberEvent" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_member_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comments" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "hiddenAt" TIMESTAMP(3),
    "hiddenById" TEXT,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "hiddenAt" TIMESTAMP(3),
    "hiddenById" TEXT,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dm_threads" (
    "id" TEXT NOT NULL,
    "aUserId" TEXT NOT NULL,
    "bUserId" TEXT NOT NULL,
    "pairKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "dm_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dm_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dm_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dm_message_reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dm_message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "kind" "public"."NotificationKind" NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "entityType" "public"."NotificationEntity" NOT NULL,
    "entityId" TEXT,
    "eventId" TEXT,
    "title" TEXT,
    "body" TEXT,
    "data" JSONB,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_chat_messages" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "event_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_chat_message_reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_chat_message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_chat_reads" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_chat_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dm_reads" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dm_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_blocks" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "entity" "public"."ReportEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "public"."SubscriptionPlan" NOT NULL,
    "billingPeriod" "public"."BillingPeriod" NOT NULL DEFAULT 'MONTHLY',
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripePriceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_plan_periods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "public"."SubscriptionPlan" NOT NULL,
    "source" "public"."UserPlanSource" NOT NULL,
    "billingPeriod" "public"."BillingPeriod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'pln',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePaymentEventId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_plan_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_sponsorships" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "plan" "public"."EventPlan" NOT NULL,
    "status" "public"."SponsorshipStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "boostsTotal" INTEGER NOT NULL DEFAULT 0,
    "boostsUsed" INTEGER NOT NULL DEFAULT 0,
    "localPushesTotal" INTEGER NOT NULL DEFAULT 0,
    "localPushesUsed" INTEGER NOT NULL DEFAULT 0,
    "stripePaymentEventId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_sponsorships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_sponsorship_periods" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "plan" "public"."EventPlan" NOT NULL,
    "actionType" TEXT NOT NULL DEFAULT 'new',
    "boostsAdded" INTEGER NOT NULL DEFAULT 0,
    "localPushesAdded" INTEGER NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'pln',
    "stripeCustomerId" TEXT,
    "stripePaymentEventId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_sponsorship_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "success" BOOLEAN NOT NULL DEFAULT false,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "lastError" TEXT,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_invite_links" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT,
    "label" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "event_invite_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_invite_link_usages" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "event_invite_link_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_favourites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_favourites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailOnInvite" BOOLEAN NOT NULL DEFAULT true,
    "emailOnJoinRequest" BOOLEAN NOT NULL DEFAULT true,
    "emailOnMessage" BOOLEAN NOT NULL DEFAULT false,
    "pushOnReminder" BOOLEAN NOT NULL DEFAULT true,
    "inAppOnEverything" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_mutes" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "muted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_mutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dm_mutes" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "muted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dm_mutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_ownership_transfers" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "actorId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_ownership_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT,
    "bioShort" TEXT,
    "bioLong" TEXT,
    "city" TEXT,
    "country" TEXT,
    "homeLat" DOUBLE PRECISION,
    "homeLng" DOUBLE PRECISION,
    "coverKey" TEXT,
    "speaks" TEXT[],
    "interests" TEXT[],
    "preferredMode" "public"."Mode",
    "preferredMaxDistanceKm" DOUBLE PRECISION,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_privacy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dmPolicy" TEXT NOT NULL DEFAULT 'ALL',
    "showLastSeen" TEXT NOT NULL DEFAULT 'ALL',
    "showLocation" TEXT NOT NULL DEFAULT 'CITY',
    "showEvents" TEXT NOT NULL DEFAULT 'ALL',
    "showReviews" TEXT NOT NULL DEFAULT 'ALL',
    "showStats" TEXT NOT NULL DEFAULT 'ALL',
    "defaultAddressVisibility" "public"."AddressVisibility" NOT NULL DEFAULT 'PUBLIC',
    "defaultMembersVisibility" "public"."MembersVisibility" NOT NULL DEFAULT 'PUBLIC',

    CONSTRAINT "user_privacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventsCreated" INTEGER NOT NULL DEFAULT 0,
    "eventsJoined" INTEGER NOT NULL DEFAULT 0,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "hostRatingAvg" DOUBLE PRECISION,
    "attendeeRatingAvg" DOUBLE PRECISION,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_social_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "provider" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_category_levels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "level" "public"."Level" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "user_category_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_availability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "tzSnap" TEXT,

    CONSTRAINT "user_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slug" TEXT NOT NULL,
    "data" JSONB,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_join_questions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" "public"."JoinQuestionType" NOT NULL DEFAULT 'TEXT',
    "label" TEXT NOT NULL,
    "helpText" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "options" JSONB,
    "maxLength" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_join_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_join_answers" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_join_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_feedback_questions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" "public"."FeedbackQuestionType" NOT NULL DEFAULT 'TEXT',
    "label" TEXT NOT NULL,
    "helpText" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "maxLength" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_feedback_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_feedback_answers" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_feedback_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_faqs" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_assets" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "blurhash" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" TEXT,
    "ownerId" TEXT,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_CategoryToEvent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToEvent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_EventToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_name_key" ON "public"."users"("name");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "public"."users"("name");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "users_lastSeenAt_idx" ON "public"."users"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "public"."categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "public"."tags"("slug");

-- CreateIndex
CREATE INDEX "tags_label_idx" ON "public"."tags"("label");

-- CreateIndex
CREATE INDEX "tags_slug_idx" ON "public"."tags"("slug");

-- CreateIndex
CREATE INDEX "events_startAt_idx" ON "public"."events"("startAt");

-- CreateIndex
CREATE INDEX "events_endAt_idx" ON "public"."events"("endAt");

-- CreateIndex
CREATE INDEX "events_boostedAt_idx" ON "public"."events"("boostedAt");

-- CreateIndex
CREATE INDEX "events_visibility_idx" ON "public"."events"("visibility");

-- CreateIndex
CREATE INDEX "events_joinMode_idx" ON "public"."events"("joinMode");

-- CreateIndex
CREATE INDEX "events_mode_idx" ON "public"."events"("mode");

-- CreateIndex
CREATE INDEX "events_meetingKind_idx" ON "public"."events"("meetingKind");

-- CreateIndex
CREATE INDEX "events_lat_lng_idx" ON "public"."events"("lat", "lng");

-- CreateIndex
CREATE INDEX "events_placeId_idx" ON "public"."events"("placeId");

-- CreateIndex
CREATE INDEX "events_canceledAt_idx" ON "public"."events"("canceledAt");

-- CreateIndex
CREATE INDEX "events_deletedAt_idx" ON "public"."events"("deletedAt");

-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "public"."events"("createdAt");

-- CreateIndex
CREATE INDEX "events_visibility_meetingKind_startAt_idx" ON "public"."events"("visibility", "meetingKind", "startAt");

-- CreateIndex
CREATE INDEX "events_visibility_startAt_joinedCount_idx" ON "public"."events"("visibility", "startAt", "joinedCount");

-- CreateIndex
CREATE INDEX "events_joinManuallyClosed_startAt_idx" ON "public"."events"("joinManuallyClosed", "startAt");

-- CreateIndex
CREATE INDEX "events_joinOpensMinutesBeforeStart_idx" ON "public"."events"("joinOpensMinutesBeforeStart");

-- CreateIndex
CREATE INDEX "events_joinCutoffMinutesBeforeStart_idx" ON "public"."events"("joinCutoffMinutesBeforeStart");

-- CreateIndex
CREATE INDEX "events_lateJoinCutoffMinutesAfterStart_idx" ON "public"."events"("lateJoinCutoffMinutesAfterStart");

-- CreateIndex
CREATE INDEX "event_members_userId_status_idx" ON "public"."event_members"("userId", "status");

-- CreateIndex
CREATE INDEX "event_members_eventId_status_idx" ON "public"."event_members"("eventId", "status");

-- CreateIndex
CREATE INDEX "event_members_eventId_role_idx" ON "public"."event_members"("eventId", "role");

-- CreateIndex
CREATE INDEX "event_members_eventId_status_role_idx" ON "public"."event_members"("eventId", "status", "role");

-- CreateIndex
CREATE INDEX "event_members_userId_createdAt_idx" ON "public"."event_members"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_members_eventId_userId_key" ON "public"."event_members"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_member_events_eventId_createdAt_idx" ON "public"."event_member_events"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "event_member_events_userId_createdAt_idx" ON "public"."event_member_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "comments_eventId_createdAt_idx" ON "public"."comments"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "comments_authorId_createdAt_idx" ON "public"."comments"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "comments_eventId_threadId_createdAt_idx" ON "public"."comments"("eventId", "threadId", "createdAt");

-- CreateIndex
CREATE INDEX "comments_parentId_createdAt_idx" ON "public"."comments"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "comments_deletedById_idx" ON "public"."comments"("deletedById");

-- CreateIndex
CREATE INDEX "comments_hiddenById_idx" ON "public"."comments"("hiddenById");

-- CreateIndex
CREATE INDEX "reviews_eventId_createdAt_idx" ON "public"."reviews"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_authorId_createdAt_idx" ON "public"."reviews"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_eventId_rating_createdAt_idx" ON "public"."reviews"("eventId", "rating", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_deletedById_idx" ON "public"."reviews"("deletedById");

-- CreateIndex
CREATE INDEX "reviews_hiddenById_idx" ON "public"."reviews"("hiddenById");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_eventId_authorId_key" ON "public"."reviews"("eventId", "authorId");

-- CreateIndex
CREATE UNIQUE INDEX "dm_threads_pairKey_key" ON "public"."dm_threads"("pairKey");

-- CreateIndex
CREATE INDEX "dm_threads_aUserId_bUserId_idx" ON "public"."dm_threads"("aUserId", "bUserId");

-- CreateIndex
CREATE INDEX "dm_threads_lastMessageAt_idx" ON "public"."dm_threads"("lastMessageAt");

-- CreateIndex
CREATE INDEX "dm_messages_threadId_createdAt_idx" ON "public"."dm_messages"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "dm_messages_senderId_createdAt_idx" ON "public"."dm_messages"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "dm_message_reactions_messageId_idx" ON "public"."dm_message_reactions"("messageId");

-- CreateIndex
CREATE INDEX "dm_message_reactions_userId_idx" ON "public"."dm_message_reactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dm_message_reactions_messageId_userId_emoji_key" ON "public"."dm_message_reactions"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "notifications_recipientId_readAt_idx" ON "public"."notifications"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_recipientId_createdAt_idx" ON "public"."notifications"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_recipientId_entityType_readAt_idx" ON "public"."notifications"("recipientId", "entityType", "readAt");

-- CreateIndex
CREATE INDEX "notifications_recipientId_kind_readAt_idx" ON "public"."notifications"("recipientId", "kind", "readAt");

-- CreateIndex
CREATE INDEX "notifications_eventId_idx" ON "public"."notifications"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_recipientId_dedupeKey_key" ON "public"."notifications"("recipientId", "dedupeKey");

-- CreateIndex
CREATE INDEX "event_chat_messages_eventId_createdAt_idx" ON "public"."event_chat_messages"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "event_chat_messages_authorId_createdAt_idx" ON "public"."event_chat_messages"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "event_chat_message_reactions_messageId_idx" ON "public"."event_chat_message_reactions"("messageId");

-- CreateIndex
CREATE INDEX "event_chat_message_reactions_userId_idx" ON "public"."event_chat_message_reactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_chat_message_reactions_messageId_userId_emoji_key" ON "public"."event_chat_message_reactions"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "event_chat_reads_userId_lastReadAt_idx" ON "public"."event_chat_reads"("userId", "lastReadAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_chat_reads_eventId_userId_key" ON "public"."event_chat_reads"("eventId", "userId");

-- CreateIndex
CREATE INDEX "dm_reads_userId_lastReadAt_idx" ON "public"."dm_reads"("userId", "lastReadAt");

-- CreateIndex
CREATE UNIQUE INDEX "dm_reads_threadId_userId_key" ON "public"."dm_reads"("threadId", "userId");

-- CreateIndex
CREATE INDEX "user_blocks_blockedId_idx" ON "public"."user_blocks"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "user_blocks_blockerId_blockedId_key" ON "public"."user_blocks"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "reports_entity_entityId_idx" ON "public"."reports"("entity", "entityId");

-- CreateIndex
CREATE INDEX "reports_status_createdAt_idx" ON "public"."reports"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_stripeSubscriptionId_key" ON "public"."user_subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "user_subscriptions_userId_status_idx" ON "public"."user_subscriptions"("userId", "status");

-- CreateIndex
CREATE INDEX "user_subscriptions_currentPeriodEnd_idx" ON "public"."user_subscriptions"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "user_plan_periods_userId_endsAt_idx" ON "public"."user_plan_periods"("userId", "endsAt");

-- CreateIndex
CREATE INDEX "user_plan_periods_stripeSubscriptionId_idx" ON "public"."user_plan_periods"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "user_plan_periods_stripePaymentEventId_idx" ON "public"."user_plan_periods"("stripePaymentEventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_sponsorships_eventId_key" ON "public"."event_sponsorships"("eventId");

-- CreateIndex
CREATE INDEX "event_sponsorships_plan_status_idx" ON "public"."event_sponsorships"("plan", "status");

-- CreateIndex
CREATE INDEX "event_sponsorships_endsAt_idx" ON "public"."event_sponsorships"("endsAt");

-- CreateIndex
CREATE INDEX "event_sponsorship_periods_sponsorId_idx" ON "public"."event_sponsorship_periods"("sponsorId");

-- CreateIndex
CREATE INDEX "event_sponsorship_periods_eventId_idx" ON "public"."event_sponsorship_periods"("eventId");

-- CreateIndex
CREATE INDEX "event_sponsorship_periods_createdAt_idx" ON "public"."event_sponsorship_periods"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_eventId_key" ON "public"."payment_events"("eventId");

-- CreateIndex
CREATE INDEX "payment_events_type_receivedAt_idx" ON "public"."payment_events"("type", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_invite_links_code_key" ON "public"."event_invite_links"("code");

-- CreateIndex
CREATE INDEX "event_invite_links_code_idx" ON "public"."event_invite_links"("code");

-- CreateIndex
CREATE INDEX "event_invite_links_eventId_idx" ON "public"."event_invite_links"("eventId");

-- CreateIndex
CREATE INDEX "event_invite_links_eventId_revokedAt_idx" ON "public"."event_invite_links"("eventId", "revokedAt");

-- CreateIndex
CREATE INDEX "event_invite_links_eventId_expiresAt_idx" ON "public"."event_invite_links"("eventId", "expiresAt");

-- CreateIndex
CREATE INDEX "event_invite_links_expiresAt_idx" ON "public"."event_invite_links"("expiresAt");

-- CreateIndex
CREATE INDEX "event_invite_link_usages_linkId_idx" ON "public"."event_invite_link_usages"("linkId");

-- CreateIndex
CREATE INDEX "event_invite_link_usages_userId_idx" ON "public"."event_invite_link_usages"("userId");

-- CreateIndex
CREATE INDEX "event_invite_link_usages_usedAt_idx" ON "public"."event_invite_link_usages"("usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_invite_link_usages_linkId_userId_key" ON "public"."event_invite_link_usages"("linkId", "userId");

-- CreateIndex
CREATE INDEX "event_favourites_userId_createdAt_idx" ON "public"."event_favourites"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "event_favourites_eventId_idx" ON "public"."event_favourites"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_favourites_userId_eventId_key" ON "public"."event_favourites"("userId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "public"."notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_mutes_eventId_userId_key" ON "public"."event_mutes"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "dm_mutes_threadId_userId_key" ON "public"."dm_mutes"("threadId", "userId");

-- CreateIndex
CREATE INDEX "event_ownership_transfers_eventId_createdAt_idx" ON "public"."event_ownership_transfers"("eventId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "public"."user_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_privacy_userId_key" ON "public"."user_privacy"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_userId_key" ON "public"."user_stats"("userId");

-- CreateIndex
CREATE INDEX "user_social_links_userId_idx" ON "public"."user_social_links"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_social_links_userId_provider_key" ON "public"."user_social_links"("userId", "provider");

-- CreateIndex
CREATE INDEX "user_category_levels_userId_idx" ON "public"."user_category_levels"("userId");

-- CreateIndex
CREATE INDEX "user_category_levels_categoryId_idx" ON "public"."user_category_levels"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "user_category_levels_userId_categoryId_key" ON "public"."user_category_levels"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "user_availability_userId_weekday_idx" ON "public"."user_availability"("userId", "weekday");

-- CreateIndex
CREATE INDEX "user_badges_userId_idx" ON "public"."user_badges"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_slug_key" ON "public"."user_badges"("userId", "slug");

-- CreateIndex
CREATE INDEX "event_join_questions_eventId_order_idx" ON "public"."event_join_questions"("eventId", "order");

-- CreateIndex
CREATE INDEX "event_join_answers_eventId_userId_idx" ON "public"."event_join_answers"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_join_answers_questionId_idx" ON "public"."event_join_answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "event_join_answers_eventId_userId_questionId_key" ON "public"."event_join_answers"("eventId", "userId", "questionId");

-- CreateIndex
CREATE INDEX "event_feedback_questions_eventId_order_idx" ON "public"."event_feedback_questions"("eventId", "order");

-- CreateIndex
CREATE INDEX "event_feedback_answers_eventId_userId_idx" ON "public"."event_feedback_answers"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_feedback_answers_questionId_idx" ON "public"."event_feedback_answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "event_feedback_answers_eventId_userId_questionId_key" ON "public"."event_feedback_answers"("eventId", "userId", "questionId");

-- CreateIndex
CREATE INDEX "event_faqs_eventId_order_idx" ON "public"."event_faqs"("eventId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_key_key" ON "public"."media_assets"("key");

-- CreateIndex
CREATE INDEX "media_assets_ownerId_idx" ON "public"."media_assets"("ownerId");

-- CreateIndex
CREATE INDEX "media_assets_purpose_idx" ON "public"."media_assets"("purpose");

-- CreateIndex
CREATE INDEX "media_assets_createdAt_idx" ON "public"."media_assets"("createdAt");

-- CreateIndex
CREATE INDEX "_CategoryToEvent_B_index" ON "public"."_CategoryToEvent"("B");

-- CreateIndex
CREATE INDEX "_EventToTag_B_index" ON "public"."_EventToTag"("B");

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_joinManuallyClosedById_fkey" FOREIGN KEY ("joinManuallyClosedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_canceledById_fkey" FOREIGN KEY ("canceledById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_members" ADD CONSTRAINT "event_members_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_members" ADD CONSTRAINT "event_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_members" ADD CONSTRAINT "event_members_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_member_events" ADD CONSTRAINT "event_member_events_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_member_events" ADD CONSTRAINT "event_member_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_member_events" ADD CONSTRAINT "event_member_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_hiddenById_fkey" FOREIGN KEY ("hiddenById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_hiddenById_fkey" FOREIGN KEY ("hiddenById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dm_threads" ADD CONSTRAINT "dm_threads_aUserId_fkey" FOREIGN KEY ("aUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dm_threads" ADD CONSTRAINT "dm_threads_bUserId_fkey" FOREIGN KEY ("bUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dm_messages" ADD CONSTRAINT "dm_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."dm_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dm_messages" ADD CONSTRAINT "dm_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dm_messages" ADD CONSTRAINT "dm_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."dm_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dm_message_reactions" ADD CONSTRAINT "dm_message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."dm_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dm_message_reactions" ADD CONSTRAINT "dm_message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_chat_messages" ADD CONSTRAINT "event_chat_messages_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_chat_messages" ADD CONSTRAINT "event_chat_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_chat_messages" ADD CONSTRAINT "event_chat_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."event_chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_chat_message_reactions" ADD CONSTRAINT "event_chat_message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."event_chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_chat_message_reactions" ADD CONSTRAINT "event_chat_message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_chat_reads" ADD CONSTRAINT "event_chat_reads_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_chat_reads" ADD CONSTRAINT "event_chat_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dm_reads" ADD CONSTRAINT "dm_reads_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."dm_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dm_reads" ADD CONSTRAINT "dm_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_blocks" ADD CONSTRAINT "user_blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_blocks" ADD CONSTRAINT "user_blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_plan_periods" ADD CONSTRAINT "user_plan_periods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_sponsorships" ADD CONSTRAINT "event_sponsorships_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_sponsorships" ADD CONSTRAINT "event_sponsorships_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_sponsorship_periods" ADD CONSTRAINT "event_sponsorship_periods_sponsorshipId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."event_sponsorships"("eventId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_sponsorship_periods" ADD CONSTRAINT "event_sponsorship_periods_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_sponsorship_periods" ADD CONSTRAINT "event_sponsorship_periods_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_invite_links" ADD CONSTRAINT "event_invite_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_invite_links" ADD CONSTRAINT "event_invite_links_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_invite_links" ADD CONSTRAINT "event_invite_links_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_invite_link_usages" ADD CONSTRAINT "event_invite_link_usages_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "public"."event_invite_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_invite_link_usages" ADD CONSTRAINT "event_invite_link_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_favourites" ADD CONSTRAINT "event_favourites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_favourites" ADD CONSTRAINT "event_favourites_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_mutes" ADD CONSTRAINT "event_mutes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_mutes" ADD CONSTRAINT "event_mutes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dm_mutes" ADD CONSTRAINT "dm_mutes_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."dm_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dm_mutes" ADD CONSTRAINT "dm_mutes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_ownership_transfers" ADD CONSTRAINT "event_ownership_transfers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_ownership_transfers" ADD CONSTRAINT "event_ownership_transfers_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_ownership_transfers" ADD CONSTRAINT "event_ownership_transfers_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_ownership_transfers" ADD CONSTRAINT "event_ownership_transfers_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_privacy" ADD CONSTRAINT "user_privacy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_stats" ADD CONSTRAINT "user_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_social_links" ADD CONSTRAINT "user_social_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_category_levels" ADD CONSTRAINT "user_category_levels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_category_levels" ADD CONSTRAINT "user_category_levels_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_availability" ADD CONSTRAINT "user_availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_join_questions" ADD CONSTRAINT "event_join_questions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_join_answers" ADD CONSTRAINT "event_join_answers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_join_answers" ADD CONSTRAINT "event_join_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."event_join_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_join_answers" ADD CONSTRAINT "event_join_answers_eventId_userId_fkey" FOREIGN KEY ("eventId", "userId") REFERENCES "public"."event_members"("eventId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_feedback_questions" ADD CONSTRAINT "event_feedback_questions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_feedback_answers" ADD CONSTRAINT "event_feedback_answers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_feedback_answers" ADD CONSTRAINT "event_feedback_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."event_feedback_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_feedback_answers" ADD CONSTRAINT "event_feedback_answers_eventId_userId_fkey" FOREIGN KEY ("eventId", "userId") REFERENCES "public"."event_members"("eventId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_faqs" ADD CONSTRAINT "event_faqs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CategoryToEvent" ADD CONSTRAINT "_CategoryToEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CategoryToEvent" ADD CONSTRAINT "_CategoryToEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_EventToTag" ADD CONSTRAINT "_EventToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_EventToTag" ADD CONSTRAINT "_EventToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
