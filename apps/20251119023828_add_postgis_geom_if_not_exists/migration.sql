-- Enable PostGIS extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geom column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'intents'
      AND column_name = 'geom'
  ) THEN
    ALTER TABLE "intents" ADD COLUMN "geom" geography(Point, 4326);
    
    -- Populate existing rows with geom from lat/lng
    UPDATE "intents"
    SET "geom" = ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography
    WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL;
  END IF;
END $$;

-- Create GIST index if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'intents'
      AND indexname = 'intents_geom_idx'
  ) THEN
    CREATE INDEX "intents_geom_idx" ON "intents" USING GIST ("geom");
  END IF;
END $$;

-- Create or replace trigger function to auto-update geom from lat/lng
CREATE OR REPLACE FUNCTION update_intent_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  ELSE
    NEW.geom := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_intent_geom ON "intents";
CREATE TRIGGER trigger_update_intent_geom
  BEFORE INSERT OR UPDATE OF lat, lng ON "intents"
  FOR EACH ROW
  EXECUTE FUNCTION update_intent_geom();
