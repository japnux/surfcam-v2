-- Create table for Stormglass API call logs
CREATE TABLE IF NOT EXISTS stormglass_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES spots(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL, -- 'forecast' or 'tides'
  status TEXT NOT NULL, -- 'success', 'error', 'quota_exceeded'
  response_summary JSONB, -- Summary of the response (hours count, data range, etc.)
  error_message TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stormglass_logs_spot_id ON stormglass_logs(spot_id);
CREATE INDEX IF NOT EXISTS idx_stormglass_logs_created_at ON stormglass_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stormglass_logs_status ON stormglass_logs(status);

-- Enable RLS
ALTER TABLE stormglass_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read logs (admin check done server-side)
CREATE POLICY "Authenticated users can read stormglass logs"
  ON stormglass_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Service role can insert logs
CREATE POLICY "Service role can insert stormglass logs"
  ON stormglass_logs
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE stormglass_logs IS 'Logs of all Stormglass API calls for monitoring and debugging';
