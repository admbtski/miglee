-- CreateTable: MediaAsset
CREATE TABLE "media_assets" (
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

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_key_key" ON "media_assets"("key");
CREATE INDEX "media_assets_ownerId_idx" ON "media_assets"("ownerId");
CREATE INDEX "media_assets_purpose_idx" ON "media_assets"("purpose");
CREATE INDEX "media_assets_createdAt_idx" ON "media_assets"("createdAt");

-- AlterTable: users - replace imageUrl with avatarKey
ALTER TABLE "users" DROP COLUMN IF EXISTS "imageUrl";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarKey" TEXT;

-- AlterTable: user_profiles - replace coverUrl with coverKey
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "coverUrl";
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "coverKey" TEXT;

-- AlterTable: intents - add coverKey
ALTER TABLE "intents" ADD COLUMN IF NOT EXISTS "coverKey" TEXT;

