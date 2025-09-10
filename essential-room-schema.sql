-- Essential room-based schema - run this in Supabase SQL Editor

-- 1. Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    room_code TEXT UNIQUE NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create room_members table
CREATE TABLE IF NOT EXISTS room_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    public_key TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- 3. Add room_id to messages (if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'room_id') THEN
        ALTER TABLE messages ADD COLUMN room_id UUID REFERENCES rooms(id) ON DELETE CASCADE;
        ALTER TABLE messages ADD COLUMN encrypted_content TEXT;
        ALTER TABLE messages ADD COLUMN nonce TEXT;
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- 5. Basic policies (more permissive for testing)
DROP POLICY IF EXISTS "Anyone can manage rooms" ON rooms;
CREATE POLICY "Anyone can manage rooms" ON rooms FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can manage room_members" ON room_members;  
CREATE POLICY "Anyone can manage room_members" ON room_members FOR ALL USING (true);

-- 6. Update messages policy for rooms
DROP POLICY IF EXISTS "Room members can view messages" ON messages;
DROP POLICY IF EXISTS "Room members can insert messages" ON messages;

CREATE POLICY "Anyone can manage messages" ON messages FOR ALL USING (true);

-- 7. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_members;