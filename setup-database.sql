-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL,
    name TEXT NOT NULL,
    uid TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert messages
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow everyone to read messages
CREATE POLICY "Anyone can view messages" ON messages
    FOR SELECT USING (true);

-- Enable real-time subscriptions for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;