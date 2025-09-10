-- Enable realtime for messages table
-- Run this in Supabase SQL Editor to ensure real-time works

-- First, make sure the table is in the publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable Row Level Security (should already be enabled)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Verify current RLS policies
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Anyone can view messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;
DROP POLICY IF EXISTS "Anyone can read messages" ON messages;

-- Create proper RLS policies
CREATE POLICY "Authenticated users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can read messages" ON messages
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT ALL ON messages TO authenticated;
GRANT ALL ON messages TO anon;