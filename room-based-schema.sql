-- Room-based chat system database schema

-- 1. Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    room_code TEXT UNIQUE NOT NULL,
    created_by TEXT NOT NULL, -- user uid
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create room_members table for tracking membership and public keys
CREATE TABLE IF NOT EXISTS room_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- auth user uid
    user_name TEXT NOT NULL, -- display name
    public_key TEXT NOT NULL, -- base64 encoded X25519 public key
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- 3. Add room_id to messages table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'room_id') THEN
        ALTER TABLE messages ADD COLUMN room_id UUID REFERENCES rooms(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Add encrypted fields to messages (replace plain text)
DO $$ 
BEGIN
    -- Add encrypted_content column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'encrypted_content') THEN
        ALTER TABLE messages ADD COLUMN encrypted_content TEXT;
    END IF;
    
    -- Add nonce column for GCM encryption
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'nonce') THEN
        ALTER TABLE messages ADD COLUMN nonce TEXT;
    END IF;
END $$;

-- 5. Enable RLS on new tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for rooms
CREATE POLICY "Users can create rooms" ON rooms
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view rooms they are members of" ON rooms
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            created_by = auth.uid()::text OR
            id IN (
                SELECT room_id FROM room_members 
                WHERE user_id = auth.uid()::text
            )
        )
    );

-- 7. Create policies for room_members
CREATE POLICY "Users can join rooms" ON room_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid()::text);

CREATE POLICY "Members can view room membership" ON room_members
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        room_id IN (
            SELECT room_id FROM room_members 
            WHERE user_id = auth.uid()::text
        )
    );

-- 8. Update messages policies for room-based access
DROP POLICY IF EXISTS "Anyone can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

CREATE POLICY "Room members can view messages" ON messages
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        room_id IN (
            SELECT room_id FROM room_members 
            WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Room members can insert messages" ON messages
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        uid = auth.uid()::text AND
        room_id IN (
            SELECT room_id FROM room_members 
            WHERE user_id = auth.uid()::text
        )
    );

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);

-- 10. Enable real-time subscriptions for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_members;

-- Create a function to get available rooms (public rooms or rooms user is member of)
CREATE OR REPLACE FUNCTION get_available_rooms()
RETURNS TABLE (
    room_id UUID,
    room_name TEXT,
    room_code TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ,
    is_member BOOLEAN,
    member_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as room_id,
        r.name as room_name,
        r.room_code,
        r.created_by,
        r.created_at,
        EXISTS(
            SELECT 1 FROM room_members rm 
            WHERE rm.room_id = r.id AND rm.user_id = auth.uid()::text
        ) as is_member,
        COALESCE(member_counts.count, 0) as member_count
    FROM rooms r
    LEFT JOIN (
        SELECT room_id, COUNT(*) as count
        FROM room_members
        GROUP BY room_id
    ) member_counts ON r.id = member_counts.room_id
    WHERE auth.role() = 'authenticated';
END;
$$;