-- Run this in Supabase SQL Editor
-- Ensure RLS is enabled and policies exist for core tables (profiles, saved_news, comments)
-- This supplements migration-002 which only covered reactions, reading_history, newsletter_subs.

-- ─── Profiles ─────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (needed for comments display)
CREATE POLICY IF NOT EXISTS "Anyone can read profiles"
  ON profiles FOR SELECT USING (true);

-- Users can update only their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during registration)
CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── Saved News ───────────────────────────────────────────────────────────
ALTER TABLE saved_news ENABLE ROW LEVEL SECURITY;

-- Users can only read their own saved articles
CREATE POLICY IF NOT EXISTS "Users can read own saved"
  ON saved_news FOR SELECT USING (auth.uid() = user_id);

-- Users can save articles for themselves
CREATE POLICY IF NOT EXISTS "Users can insert own saved"
  ON saved_news FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved articles
CREATE POLICY IF NOT EXISTS "Users can delete own saved"
  ON saved_news FOR DELETE USING (auth.uid() = user_id);

-- ─── Comments ─────────────────────────────────────────────────────────────
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-toxic comments
CREATE POLICY IF NOT EXISTS "Anyone can read comments"
  ON comments FOR SELECT USING (is_toxic = false);

-- Authenticated users can insert comments
CREATE POLICY IF NOT EXISTS "Users can insert comments"
  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY IF NOT EXISTS "Users can delete own comments"
  ON comments FOR DELETE USING (auth.uid() = user_id);

-- ─── Indexes for performance ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_saved_news_user_id ON saved_news(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_news_url ON saved_news(url);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
