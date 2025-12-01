-- AlterEnum
-- Check if CUSTOM already exists before adding it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CUSTOM' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Mode')
    ) THEN
        ALTER TYPE "public"."Mode" ADD VALUE 'CUSTOM';
    END IF;
END $$;
