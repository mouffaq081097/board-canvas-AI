-- Run this in your Supabase SQL Editor to set up the database
-- Go to: https://supabase.com/dashboard/project/_/sql

-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Board',
  canvas_state JSONB NOT NULL DEFAULT '{"objects": [], "connections": []}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own boards
CREATE POLICY "Users can view own boards"
  ON boards FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: users can create boards
CREATE POLICY "Users can create boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can update their own boards
CREATE POLICY "Users can update own boards"
  ON boards FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: users can delete their own boards
CREATE POLICY "Users can delete own boards"
  ON boards FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
