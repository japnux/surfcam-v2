-- Migration: Community Comments System
-- Description: Adds spot comments with upvotes and auto-archiving after 48h

-- Comments table
CREATE TABLE IF NOT EXISTS spot_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 3 AND char_length(content) <= 500),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment votes table
CREATE TABLE IF NOT EXISTS comment_votes (
  comment_id UUID NOT NULL REFERENCES spot_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_spot_comments_spot_id ON spot_comments(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_comments_user_id ON spot_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_spot_comments_created_at ON spot_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_spot_comments_is_archived ON spot_comments(is_archived);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);

-- Enable RLS
ALTER TABLE spot_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active comments" ON spot_comments FOR SELECT USING (is_archived = false);
CREATE POLICY "Authenticated users can create comments" ON spot_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON spot_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view votes" ON comment_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON comment_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON comment_votes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON comment_votes FOR UPDATE USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_spot_comments_updated_at BEFORE UPDATE ON spot_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-archive function
CREATE OR REPLACE FUNCTION archive_old_comments() RETURNS void AS $$
BEGIN
  UPDATE spot_comments SET is_archived = true WHERE is_archived = false AND created_at < NOW() - INTERVAL '48 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
