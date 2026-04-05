-- =====================================================
-- FIX: Recursive Trigger Timeout Issue
-- =====================================================
-- This migration fixes the connection timeout caused by
-- recursive trigger chains when inserting lesson_content_items
-- =====================================================

-- ─────────────────────────────────────────────────────────
-- STEP 1: Drop problematic recursive triggers
-- ─────────────────────────────────────────────────────────

-- Drop the lesson_content_items triggers that cause recursion
DROP TRIGGER IF EXISTS trg_reset_lesson_completion_on_content_change ON public.lesson_content_items;
DROP TRIGGER IF EXISTS trg_lessons_change ON public.lessons;
DROP TRIGGER IF EXISTS trg_quizzes_change ON public.quizzes;

-- Drop the trigger functions that cause recursion
DROP FUNCTION IF EXISTS public.reset_lesson_completion_on_content_change();
DROP FUNCTION IF EXISTS public.update_course_verification_on_lesson_change();
DROP FUNCTION IF EXISTS public.update_course_verification_on_quiz_change();

-- ─────────────────────────────────────────────────────────
-- STEP 2: Simplify the course verification trigger function
-- ─────────────────────────────────────────────────────────

-- Replace with a simpler version that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.update_course_verification_status_on_content_change()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_current_status TEXT;
BEGIN
  -- Determine the course_id based on which table triggered this
  IF TG_TABLE_NAME = 'modules' THEN
    v_course_id := NEW.course_id;
  ELSIF TG_TABLE_NAME = 'module_content_items' THEN
    SELECT course_id INTO v_course_id FROM modules WHERE id = NEW.module_id;
  ELSIF TG_TABLE_NAME = 'lesson_content_items' THEN
    -- For lesson_content_items, get course_id directly from the record
    v_course_id := NEW.course_id;
  END IF;

  -- If we couldn't determine course_id, exit
  IF v_course_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get current verification status
  SELECT verification_status INTO v_current_status FROM courses WHERE id = v_course_id;

  -- Only update if course was approved
  IF v_current_status = 'approved' THEN
    -- Use a direct update without triggering more recursion
    UPDATE courses
    SET
      verification_status = 'pending_review',
      updated_at = NOW()
    WHERE id = v_course_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- STEP 3: Recreate triggers with proper conditions
-- ─────────────────────────────────────────────────────────

-- Recreate the lesson_content_items trigger (simpler version)
CREATE OR REPLACE FUNCTION public.reset_lesson_completion_on_content_change()
RETURNS TRIGGER AS $$
DECLARE
  target_lesson_id UUID;
BEGIN
  -- Get the lesson_id from either NEW or OLD record
  IF TG_OP = 'DELETE' THEN
    target_lesson_id := OLD.lesson_id;
  ELSE
    target_lesson_id := NEW.lesson_id;
  END IF;

  -- Guard: Don't proceed if lesson_id is NULL
  IF target_lesson_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Reset lesson-level completion
  DELETE FROM user_lesson_progress
  WHERE lesson_id = target_lesson_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger on lesson_content_items
DROP TRIGGER IF EXISTS trg_reset_lesson_completion_on_content_change ON public.lesson_content_items;
CREATE TRIGGER trg_reset_lesson_completion_on_content_change
    AFTER INSERT OR UPDATE OR DELETE ON public.lesson_content_items
    FOR EACH ROW
    EXECUTE FUNCTION public.reset_lesson_completion_on_content_change();

-- ─────────────────────────────────────────────────────────
-- STEP 4: Add lesson_content_items to the verification trigger
-- ─────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_lesson_content_items_change ON public.lesson_content_items;
CREATE TRIGGER trg_lesson_content_items_change
    AFTER INSERT OR UPDATE ON public.lesson_content_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_course_verification_status_on_content_change();

-- ─────────────────────────────────────────────────────────
-- STEP 5: Simplify RLS policies to prevent recursive checks
-- ─────────────────────────────────────────────────────────

-- Drop and recreate lesson_content_items policies with simpler checks
DROP POLICY IF EXISTS "Coaches can manage their course content items" ON public.lesson_content_items;
DROP POLICY IF EXISTS "Admins can manage all content items" ON public.lesson_content_items;

-- Coach policy - direct check without nested EXISTS
CREATE POLICY "Coaches can manage their course content items"
ON public.lesson_content_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_id
    AND c.coach_id = auth.uid()
  )
);

-- Admin policy - simpler check
CREATE POLICY "Admins can manage all content items"
ON public.lesson_content_items
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- ─────────────────────────────────────────────────────────
-- STEP 6: Add indexes to speed up policy checks
-- ─────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_courses_coach_id ON courses(coach_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_lesson_content_items_course_id ON lesson_content_items(course_id);

-- ─────────────────────────────────────────────────────────
-- STEP 7: Verify the fix
-- ─────────────────────────────────────────────────────────

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname IN (
    'trg_reset_lesson_completion_on_content_change',
    'trg_lesson_content_items_change',
    'trg_module_content_items_change',
    'trg_modules_content_change'
  );
  
  RAISE NOTICE 'Fixed triggers created: % triggers active', trigger_count;
END $$;

COMMENT ON FUNCTION public.reset_lesson_completion_on_content_change() IS 'Resets lesson completion when content items change - simplified to prevent recursion';
COMMENT ON FUNCTION public.update_course_verification_status_on_content_change() IS 'Updates course verification status on content changes - simplified to prevent recursion';
