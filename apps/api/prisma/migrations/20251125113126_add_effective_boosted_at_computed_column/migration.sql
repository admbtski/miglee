-- Note: Cannot use NOW() in GENERATED ALWAYS expression as it's not immutable
-- The 24h boost expiration logic is handled in the application layer
-- This migration adds an optimized index for boost-based sorting

-- Add optimized index on boostedAt for efficient sorting
-- This index is optimized for queries that sort by boostedAt DESC NULLS LAST
CREATE INDEX IF NOT EXISTS idx_intents_boosted_at_desc 
ON intents("boostedAt" DESC NULLS LAST);

-- Add comment for documentation
COMMENT ON INDEX idx_intents_boosted_at_desc IS 
  'Optimized index for sorting events by boost priority. Application layer filters boosts < 24h old.';
