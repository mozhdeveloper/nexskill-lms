-- =====================================================
-- FIX: Lesson Content Items Timeout Issue
-- =====================================================
-- This script optimizes triggers and policies to prevent
-- "canceling statement due to statement timeout" errors
-- when coaches add lesson content items.
-- =====================================================

-- =====================================================
-- STEP 1: Optimize the reset_lesson_completion trigger
-- =====================================================
-- The current trigger deletes ALL user_lesson_progress on every insert
-- This is expensive. Let's make it more targeted.

-- First, drop the problematic triggers
DROP TRIGGER IF EXISTS trg_reset_lesson_completion_on_content_change ON lesson_content_items;
DROP FUNCTION IF EXISTS reset_lesson_completion_on_content_change();

-- Create optimized version that only affects the specific lesson
CREATE OR REPLACE FUNCTION reset_lesson_completion_on_content_change()
RETURNS trigger AS $function$
DECLARE
  target_lesson_id UUID;
BEGIN
  -- Get the lesson_id efficiently
  IF TG_OP = 'DELETE' THEN
    target_lesson_id := OLD.lesson_id;
  ELSE
    target_lesson_id := NEW.lesson_id;
  END IF;

  IF target_lesson_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD;
    ELSE RETURN NEW;
    END IF;
  END IF;

  -- Only delete progress for THIS specific lesson (not all lessons)
  -- This is already optimal, but let's ensure it's fast
  DELETE FROM user_lesson_progress
  WHERE lesson_id = target_lesson_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD;
  ELSE RETURN NEW;
  END IF;
END;
$function$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trg_reset_lesson_completion_on_content_change
AFTER INSERT OR UPDATE OR DELETE ON lesson_content_items
FOR EACH ROW EXECUTE FUNCTION reset_lesson_completion_on_content_change();


-- =====================================================
-- STEP 2: Optimize the course verification status trigger
-- =====================================================
-- This trigger updates course verification_status on every content change
-- Make it more efficient

DROP TRIGGER IF EXISTS trg_lesson_content_items_change ON lesson_content_items;
DROP FUNCTION IF EXISTS update_course_verification_status_on_content_change();

CREATE OR REPLACE FUNCTION update_course_verification_status_on_content_change()
RETURNS trigger AS $function$
DECLARE
  v_course_id UUID;
  v_current_status TEXT;
BEGIN
  -- Get course_id efficiently based on table
  IF TG_TABLE_NAME = 'modules' THEN
    v_course_id := NEW.course_id;
  ELSIF TG_TABLE_NAME = 'module_content_items' THEN
    SELECT course_id INTO v_course_id FROM modules WHERE id = NEW.module_id;
  ELSIF TG_TABLE_NAME = 'lesson_content_items' THEN
    -- lesson_content_items already has course_id column, use it directly
    v_course_id := NEW.course_id;
  END IF;

  IF v_course_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only update if status is 'approved' (don't waste cycles on draft/pending)
  SELECT verification_status INTO v_current_status FROM courses WHERE id = v_course_id;

  IF v_current_status = 'approved' THEN
    UPDATE courses
    SET verification_status = 'pending_review', 
        updated_at = timezone('utc'::text, now())
    WHERE id = v_course_id;
  END IF;

  RETURN NEW;
END;
$function$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lesson_content_items_change
AFTER INSERT OR UPDATE ON lesson_content_items
FOR EACH ROW EXECUTE FUNCTION update_course_verification_status_on_content_change();


-- =====================================================
-- STEP 3: Add database indexes for faster lookups
-- =====================================================
-- These indexes speed up the RLS policy checks

-- Index for coach_id lookups in courses table
CREATE INDEX IF NOT EXISTS idx_courses_coach_id ON courses(coach_id);

-- Index for course_id lookups in modules table
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);

-- Index for lesson_id lookups in lesson_content_items
CREATE INDEX IF NOT EXISTS idx_lesson_content_items_lesson_id ON lesson_content_items(lesson_id);

-- Composite index for RLS policy checks (coach + course)
CREATE INDEX IF NOT EXISTS idx_lesson_content_items_course_lesson ON lesson_content_items(course_id, lesson_id);

-- Index for user_lesson_progress (for the reset trigger)
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);


-- =====================================================
-- STEP 4: Optimize RLS Policies
-- =====================================================
-- The current policies have redundant subqueries
-- Let's create a more efficient version using EXISTS with proper indexes

-- Drop old redundant policies (if they exist)
DROP POLICY IF EXISTS "Coaches can manage module content" ON lesson_content_items;
DROP POLICY IF EXISTS "coaches_manage_module_content" ON lesson_content_items;

-- Create optimized policy using simpler EXISTS check
-- This leverages the indexes we created above
CREATE POLICY "coaches_manage_lesson_content_items" ON lesson_content_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lesson_content_items.course_id 
        AND c.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lesson_content_items.course_id 
        AND c.coach_id = auth.uid()
    )
  );


-- =====================================================
-- STEP 5: Increase statement timeout for this session/table
-- =====================================================
-- As a temporary workaround, increase the timeout
-- Run this in your Supabase SQL Editor or add to your connection string

-- View current timeout setting
SHOW statement_timeout;

-- Set a higher timeout (2 minutes instead of default 30s)
-- This is a session-level setting, apply to your connection pool
-- ALTER DATABASE postgres SET statement_timeout = '2min';

-- Or set it per-connection in your app:
-- In your Supabase client initialization, add:
-- options: { statement_timeout: '120000' }


-- =====================================================
-- STEP 6: Analyze tables for query planner optimization
-- =====================================================
-- Update statistics so PostgreSQL can make better query plans
ANALYZE courses;
ANALYZE modules;
ANALYZE lesson_content_items;
ANALYZE user_lesson_progress;


-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run these queries to verify the changes

-- Check triggers
SELECT trigger_name, event_manipulation, action_timing 
FROM information_schema.triggers 
WHERE event_object_table = 'lesson_content_items';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'lesson_content_items';

-- Check policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'lesson_content_items';

-- Test insert (should be faster now)
-- INSERT INTO lesson_content_items (lesson_id, course_id, module_id, content_type, metadata, position, is_published)
-- VALUES ('test-lesson-id', 'test-course-id', 'test-module-id', 'video', '{}', 0, true);
