-- CreateEnum
CREATE TYPE "public"."FeedbackQuestionType" AS ENUM ('TEXT', 'SINGLE_CHOICE', 'MULTI_CHOICE');

-- CreateTable
CREATE TABLE "public"."intent_feedback_questions" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" "public"."FeedbackQuestionType" NOT NULL DEFAULT 'TEXT',
    "label" TEXT NOT NULL,
    "helpText" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "maxLength" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intent_feedback_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."intent_feedback_answers" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intent_feedback_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intent_feedback_questions_intentId_order_idx" ON "public"."intent_feedback_questions"("intentId", "order");

-- CreateIndex
CREATE INDEX "intent_feedback_answers_intentId_userId_idx" ON "public"."intent_feedback_answers"("intentId", "userId");

-- CreateIndex
CREATE INDEX "intent_feedback_answers_questionId_idx" ON "public"."intent_feedback_answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "intent_feedback_answers_intentId_userId_questionId_key" ON "public"."intent_feedback_answers"("intentId", "userId", "questionId");

-- AddForeignKey
ALTER TABLE "public"."intent_feedback_questions" ADD CONSTRAINT "intent_feedback_questions_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "public"."intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."intent_feedback_answers" ADD CONSTRAINT "intent_feedback_answers_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "public"."intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."intent_feedback_answers" ADD CONSTRAINT "intent_feedback_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."intent_feedback_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."intent_feedback_answers" ADD CONSTRAINT "intent_feedback_answers_intentId_userId_fkey" FOREIGN KEY ("intentId", "userId") REFERENCES "public"."intent_members"("intentId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
