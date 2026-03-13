-- Run this in Supabase SQL Editor
-- Add these NEW tables to your existing NewsHive Pro schema

-- ─── Reactions (🔥❤️😮) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  news_url TEXT NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('fire', 'heart', 'wow')) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, news_url)  -- one reaction per user per article
);

-- ─── Reading History (for personalized feed) ─────────────────────────────
CREATE TABLE IF NOT EXISTS reading_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  news_url TEXT NOT NULL,
  title TEXT,
  category TEXT DEFAULT 'general',
  read_at TIMESTAMP DEFAULT NOW()
);

-- ─── Newsletter Subscribers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Enable RLS ───────────────────────────────────────────────────────────
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subs ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ─────────────────────────────────────────────────────────

-- Reactions: anyone can read, users can manage their own
CREATE POLICY "Anyone can read reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Reading history: users see only their own
CREATE POLICY "Users can read own history" ON reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert history" ON reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Newsletter: users can subscribe
CREATE POLICY "Users can subscribe" ON newsletter_subs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own sub" ON newsletter_subs FOR SELECT USING (auth.uid() = user_id);

-- ─── Indexes for performance ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reactions_news_url ON reactions(news_url);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_news_url ON comments(news_url);
