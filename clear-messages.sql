-- Clear all existing messages to start fresh
DELETE FROM messages;

-- Reset the sequence if needed (PostgreSQL)
-- ALTER SEQUENCE messages_id_seq RESTART WITH 1;