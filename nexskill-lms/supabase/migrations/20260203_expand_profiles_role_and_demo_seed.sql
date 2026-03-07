-- ============================================================
-- Migration: Expand profiles.role constraint + demo seed users
-- Run this in the Supabase SQL editor (dashboard.supabase.com)
-- ============================================================

-- 1. Drop the restrictive role CHECK constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add the expanded constraint covering all app roles
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY[
    'student'::text,
    'coach'::text,
    'admin'::text,
    'sub_coach'::text,
    'content_editor'::text,
    'community_manager'::text,
    'support_staff'::text,
    'org_owner'::text,
    'platform_owner'::text,
    'unassigned'::text
  ]));

-- ============================================================
-- 3. (Optional) Seed demo accounts
--    Run the block below ONLY if you want to create demo users
--    directly from SQL. Requires Supabase service-role access.
--
--    PREFERRED APPROACH: Use the Quick Login button in the app
--    which calls supabase.auth.signUp() automatically on first use.
--
--    If you prefer SQL seeding, uncomment and run the block below
--    from the Supabase SQL editor while logged in as service role:
--
-- DO $$
-- DECLARE
--   student_id uuid := gen_random_uuid();
--   coach_id   uuid := gen_random_uuid();
--   admin_id   uuid := gen_random_uuid();
-- BEGIN
--   -- These insert directly into auth.users (service role only)
--   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
--   VALUES
--     (student_id, 'alex.doe@nexskill.demo',   crypt('demo1234', gen_salt('bf')), now(), 'authenticated'),
--     (coach_id,   'jordan.doe@nexskill.demo', crypt('demo1234', gen_salt('bf')), now(), 'authenticated'),
--     (admin_id,   'morgan.doe@nexskill.demo', crypt('demo1234', gen_salt('bf')), now(), 'authenticated')
--   ON CONFLICT (email) DO NOTHING;
--
--   INSERT INTO public.profiles (id, email, first_name, last_name, username, role)
--   VALUES
--     (student_id, 'alex.doe@nexskill.demo',   'Alex',   'Doe', 'alex_doe',   'student'),
--     (coach_id,   'jordan.doe@nexskill.demo', 'Jordan', 'Doe', 'jordan_doe', 'coach'),
--     (admin_id,   'morgan.doe@nexskill.demo', 'Morgan', 'Doe', 'morgan_doe', 'admin')
--   ON CONFLICT (id) DO UPDATE
--     SET role = EXCLUDED.role;
-- END $$;
-- ============================================================
