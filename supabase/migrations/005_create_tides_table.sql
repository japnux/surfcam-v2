-- Create tides table to cache tide data
CREATE TABLE IF NOT EXISTS public.tides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  coefficient TEXT NOT NULL,
  tides JSONB NOT NULL, -- Array of {time, height, type}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Ensure one entry per spot per day
  UNIQUE(spot_id, date)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_tides_spot_date ON public.tides(spot_id, date);
CREATE INDEX IF NOT EXISTS idx_tides_expires ON public.tides(expires_at);

-- Enable RLS
ALTER TABLE public.tides ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read tides
CREATE POLICY "Tides are viewable by everyone"
  ON public.tides
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert/update
CREATE POLICY "Service role can manage tides"
  ON public.tides
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to clean expired tides (optional, for maintenance)
CREATE OR REPLACE FUNCTION clean_expired_tides()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.tides
  WHERE expires_at < NOW();
END;
$$;

-- Comment
COMMENT ON TABLE public.tides IS 'Cached tide data for spots';
