-- Migration: Add Stormglass daily forecast support
-- Run this migration on your Supabase database

-- Add has_daily_forecast column to spots table
ALTER TABLE spots 
ADD COLUMN IF NOT EXISTS has_daily_forecast BOOLEAN NOT NULL DEFAULT false;

-- Create index for spots with daily forecast
CREATE INDEX IF NOT EXISTS idx_spots_has_daily_forecast ON spots(has_daily_forecast) WHERE has_daily_forecast = true;

-- Add comment
COMMENT ON COLUMN spots.has_daily_forecast IS 'Flag to indicate spots that should get daily forecast updates from Stormglass (limited to 10 spots due to API limits)';

-- Create table to track Stormglass API calls
CREATE TABLE IF NOT EXISTS stormglass_api_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_date DATE NOT NULL DEFAULT CURRENT_DATE,
  call_count INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(call_date)
);

-- Index for API calls tracking
CREATE INDEX IF NOT EXISTS idx_stormglass_calls_date ON stormglass_api_calls(call_date);

-- Modify spot_forecast_cache to include source and validity
ALTER TABLE spot_forecast_cache 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'open-meteo',
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS data_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS data_end TIMESTAMP WITH TIME ZONE;

-- Index for cache validity
CREATE INDEX IF NOT EXISTS idx_forecast_cache_validity ON spot_forecast_cache(spot_id, valid_until) WHERE valid_until IS NOT NULL;

-- Function to increment API call count
CREATE OR REPLACE FUNCTION increment_stormglass_calls()
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Insert or update today's call count
  INSERT INTO stormglass_api_calls (call_date, call_count)
  VALUES (CURRENT_DATE, 1)
  ON CONFLICT (call_date) 
  DO UPDATE SET 
    call_count = stormglass_api_calls.call_count + 1,
    updated_at = NOW()
  RETURNING call_count INTO current_count;
  
  RETURN current_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get today's API call count
CREATE OR REPLACE FUNCTION get_stormglass_call_count()
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  SELECT call_count INTO current_count
  FROM stormglass_api_calls
  WHERE call_date = CURRENT_DATE;
  
  RETURN COALESCE(current_count, 0);
END;
$$ LANGUAGE plpgsql;
