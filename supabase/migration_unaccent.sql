-- Migration: Add unaccent extension and search function for accent-insensitive search
-- Run this migration on your Supabase database

-- Enable unaccent extension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Function to search spots with accent-insensitive search
CREATE OR REPLACE FUNCTION search_spots_unaccent(search_query TEXT)
RETURNS SETOF spots AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM spots
  WHERE unaccent(name) ILIKE unaccent('%' || search_query || '%')
     OR unaccent(city) ILIKE unaccent('%' || search_query || '%')
  ORDER BY name;
END;
$$ LANGUAGE plpgsql;
