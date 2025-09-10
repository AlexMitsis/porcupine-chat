-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Anyone can view messages" ON messages;

-- Create better RLS policies
CREATE POLICY "Authenticated users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can read messages" ON messages
    FOR SELECT USING (true);

-- Make sure realtime is enabled (run this if it wasn't added before)
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;