-- Migration to add fields for Booking Types to live_sessions
ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'Online';

-- Add comments for clarity
COMMENT ON COLUMN live_sessions.max_participants IS 'Maximum number of students allowed to join the live session';
COMMENT ON COLUMN live_sessions.price IS 'Price of the live session in PHP';
COMMENT ON COLUMN live_sessions.format IS 'Format of the session (Online/In-person)';
