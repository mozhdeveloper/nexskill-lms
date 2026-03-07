-- NexSkill LMS — Remove RLS from admin-managed lookup tables
--
-- Run this in: Supabase Dashboard → SQL Editor
--
-- These tables hold static lookup data (interests, goals) managed by admins.
-- RLS is unnecessary here since:
--   - No user-specific rows (no user_id column)
--   - All authenticated users should be able to read them
--   - Only admins/seed scripts write to them
--
-- This is the alternative to using a service role key in the seed script.
-- Using the service role key (SUPABASE_SERVICE_ROLE_KEY in .env.local) is
-- preferable for production as it keeps RLS enabled on the tables.

ALTER TABLE public.interests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals     DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity
FROM   pg_tables
WHERE  schemaname = 'public'
  AND  tablename IN ('interests', 'goals');
