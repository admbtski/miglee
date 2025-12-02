-- AlterTable
ALTER TABLE "public"."user_category_levels" RENAME CONSTRAINT "user_disciplines_pkey" TO "user_category_levels_pkey";

-- CreateTable
CREATE TABLE "public"."intent_faqs" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intent_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intent_faqs_intentId_order_idx" ON "public"."intent_faqs"("intentId", "order");

-- RenameForeignKey
ALTER TABLE "public"."user_category_levels" RENAME CONSTRAINT "user_disciplines_categoryId_fkey" TO "user_category_levels_categoryId_fkey";

-- RenameForeignKey
ALTER TABLE "public"."user_category_levels" RENAME CONSTRAINT "user_disciplines_userId_fkey" TO "user_category_levels_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."intent_faqs" ADD CONSTRAINT "intent_faqs_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "public"."intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."user_disciplines_categoryId_idx" RENAME TO "user_category_levels_categoryId_idx";

-- RenameIndex
ALTER INDEX "public"."user_disciplines_userId_categoryId_key" RENAME TO "user_category_levels_userId_categoryId_key";

-- RenameIndex
ALTER INDEX "public"."user_disciplines_userId_idx" RENAME TO "user_category_levels_userId_idx";
