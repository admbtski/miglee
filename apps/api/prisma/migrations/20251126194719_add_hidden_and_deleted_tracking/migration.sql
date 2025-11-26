-- AlterTable
ALTER TABLE "public"."comments" ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenById" TEXT;

-- AlterTable
ALTER TABLE "public"."reviews" ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenById" TEXT;

-- CreateIndex
CREATE INDEX "comments_deletedById_idx" ON "public"."comments"("deletedById");

-- CreateIndex
CREATE INDEX "comments_hiddenById_idx" ON "public"."comments"("hiddenById");

-- CreateIndex
CREATE INDEX "reviews_deletedById_idx" ON "public"."reviews"("deletedById");

-- CreateIndex
CREATE INDEX "reviews_hiddenById_idx" ON "public"."reviews"("hiddenById");

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_hiddenById_fkey" FOREIGN KEY ("hiddenById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_hiddenById_fkey" FOREIGN KEY ("hiddenById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
