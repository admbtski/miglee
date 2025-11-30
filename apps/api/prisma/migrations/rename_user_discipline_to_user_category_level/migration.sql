-- Rename table from user_disciplines to user_category_levels
ALTER TABLE "user_disciplines" RENAME TO "user_category_levels";

-- Update User model relation name (no SQL needed, Prisma only)
-- Update Category model relation name (no SQL needed, Prisma only)

