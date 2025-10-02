-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  locale TEXT NOT NULL DEFAULT 'fr',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spots table
CREATE TABLE IF NOT EXISTS spots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  city TEXT,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  break_type TEXT,
  orientation TEXT,
  level TEXT,
  hazards TEXT,
  best_tide TEXT,
  best_wind TEXT,
  cam_url TEXT NOT NULL,
  cam_type TEXT NOT NULL,
  license_credit TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, spot_id)
);

-- Spot forecast cache table
CREATE TABLE IF NOT EXISTS spot_forecast_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(spot_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_spots_slug ON spots(slug);
CREATE INDEX IF NOT EXISTS idx_spots_is_active ON spots(is_active);
CREATE INDEX IF NOT EXISTS idx_spots_name ON spots(name);
CREATE INDEX IF NOT EXISTS idx_spots_city ON spots(city);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_spot_id ON favorites(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_forecast_cache_spot_id ON spot_forecast_cache(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_forecast_cache_fetched_at ON spot_forecast_cache(fetched_at);

-- RLS Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_forecast_cache ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Spots policies (public read, admin write)
CREATE POLICY "Anyone can view active spots"
  ON spots FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage spots"
  ON spots FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Spot forecast cache policies
CREATE POLICY "Anyone can view forecast cache"
  ON spot_forecast_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage forecast cache"
  ON spot_forecast_cache FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spots_updated_at
  BEFORE UPDATE ON spots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
