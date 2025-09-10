-- Clear all existing messages (optional - run this to start fresh)
DELETE FROM messages;

-- Make sure the table structure is correct
-- ALTER TABLE messages DROP COLUMN IF EXISTS timestamp;
-- ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verify RLS policies are set correctly
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Anyone can view messages" ON messages;

-- Better RLS policies
CREATE POLICY "Authenticated users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can read messages" ON messages
    FOR SELECT USING (true);

-- Make sure realtime is enabled
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;