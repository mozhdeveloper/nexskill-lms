-- Migration: Add status column and enum to live_sessions

-- 1. Create the session_status enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE session_status AS ENUM ('scheduled', 'ongoing', 'completed', 'canceled');
    END IF;
END$$;

-- 2. Add the status column to live_sessions if it doesn't exist
ALTER TABLE public.live_sessions
ADD COLUMN IF NOT EXISTS status session_status NULL DEFAULT 'scheduled';

-- 3. (Optional) Update existing rows to set status to 'scheduled' if null
UPDATE public.live_sessions SET status = 'scheduled' WHERE status IS NULL;