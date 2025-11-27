-- CreateEnum
CREATE TYPE "public"."FeedbackChannel" AS ENUM ('EMAIL', 'IN_APP', 'PUSH', 'DIRECT_LINK');

-- CreateTable
CREATE TABLE "public"."feedback_tracking" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailSentAt" TIMESTAMP(3),
    "emailOpenedAt" TIMESTAMP(3),
    "pageViewedAt" TIMESTAMP(3),
    "formStartedAt" TIMESTAMP(3),
    "formSubmittedAt" TIMESTAMP(3),
    "channel" "public"."FeedbackChannel" NOT NULL DEFAULT 'EMAIL',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_tracking_intentId_idx" ON "public"."feedback_tracking"("intentId");

-- CreateIndex
CREATE INDEX "feedback_tracking_userId_idx" ON "public"."feedback_tracking"("userId");

-- CreateIndex
CREATE INDEX "feedback_tracking_emailSentAt_idx" ON "public"."feedback_tracking"("emailSentAt");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_tracking_intentId_userId_key" ON "public"."feedback_tracking"("intentId", "userId");

-- AddForeignKey
ALTER TABLE "public"."feedback_tracking" ADD CONSTRAINT "feedback_tracking_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "public"."intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback_tracking" ADD CONSTRAINT "feedback_tracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
