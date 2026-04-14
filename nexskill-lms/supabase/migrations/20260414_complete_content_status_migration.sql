-- =====================================================
-- Migration: Complete content_status Migration (CORRECTED)
-- =====================================================
-- This is the COMPLETE migration that fixes ALL functions,
-- backfills existing data, and adds indexes.
--
-- Run this AFTER the column addition migration.
-- =====================================================

-- ─────────────────────────────────────────────────────────
-- 0. BACKFILL: Set content_status from is_published
--    This ensures existing data has correct status
-- ─────────────────────────────────────────────────────────
-- For modules
UPDATE modules SET content_status = CASE
  WHEN is_published = true THEN 'published'
  ELSE 'draft'
END WHERE content_status IS NULL;

-- For lessons
UPDATE lessons SET content_status = CASE
  WHEN is_published = true THEN 'published'
  ELSE 'draft'
END WHERE content_status IS NULL;

-- For quizzes
UPDATE quizzes SET content_status = CASE
  WHEN is_published = true THEN 'published'
  ELSE 'draft'
END WHERE content_status IS NULL;

-- For module_content_items
UPDATE module_content_items SET content_status = CASE
  WHEN is_published = true THEN 'published'
  ELSE 'draft'
END WHERE content_status IS NULL;

-- For lesson_content_items
UPDATE lesson_content_items SET content_status = CASE
  WHEN is_published = true THEN 'published'
  ELSE 'draft'
END WHERE content_status IS NULL;

-- ─────────────────────────────────────────────────────────
-- 1. Update calculate_lesson_completion function
--    Uses content_status instead of is_published
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.calculate_lesson_completion(p_student_id uuid, p_lesson_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    total_items INTEGER;
    completed_items INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_items
    FROM lesson_content_items
    WHERE lesson_id = p_lesson_id AND content_status = 'published';
    
    SELECT COUNT(*) INTO completed_items
    FROM lesson_content_items lci
    INNER JOIN student_content_progress scp
        ON scp.content_item_id = lci.id
        AND scp.student_id = p_student_id
        AND scp.is_completed = true
    WHERE lci.lesson_id = p_lesson_id AND lci.content_status = 'published';
    
    IF total_items = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN (completed_items * 100) / total_items;
END;
$function$;

-- ─────────────────────────────────────────────────────────
-- 2. Update is_lesson_locked function
--    Uses content_status instead of is_published
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_lesson_locked(p_user_id uuid, p_lesson_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_is_locked BOOLEAN;
  v_content_item RECORD;
  v_prev_content_item RECORD;
BEGIN
  -- Check if there's an explicit access status
  SELECT las.is_locked INTO v_is_locked
  FROM lesson_access_status las
  WHERE las.user_id = p_user_id
    AND las.lesson_id = p_lesson_id;

  IF v_is_locked IS NOT NULL THEN
    RETURN v_is_locked;
  END IF;

  -- If no explicit status, check if it's the first lesson
  SELECT mci.id, mci.module_id, mci.position
  INTO v_content_item
  FROM module_content_items mci
  WHERE mci.content_id = p_lesson_id
    AND mci.content_type = 'lesson'
  LIMIT 1;

  IF v_content_item IS NULL THEN
    RETURN true; -- Default to locked if not found
  END IF;

  -- Check if there's any previous content item
  SELECT mci.id, mci.content_id, mci.content_type
  INTO v_prev_content_item
  FROM module_content_items mci
  WHERE mci.module_id = v_content_item.module_id
    AND mci.position < v_content_item.position
    AND mci.content_status = 'published'
  ORDER BY mci.position DESC
  LIMIT 1;

  -- If no previous item, it's the first lesson - should be unlocked
  IF v_prev_content_item IS NULL THEN
    -- Create access status for first lesson
    INSERT INTO lesson_access_status (user_id, lesson_id, content_item_id, is_locked, unlock_reason, unlocked_at)
    VALUES (p_user_id, p_lesson_id, v_content_item.id, false, 'first_lesson', NOW())
    ON CONFLICT (user_id, lesson_id) DO NOTHING;
    
    RETURN false;
  END IF;

  -- If there's a previous item, lesson is locked by default
  RETURN true;
END;
$function$;

-- ─────────────────────────────────────────────────────────
-- 3. Update unlock_next_lesson function
--    Uses content_status instead of is_published
--    Two-path lookup: checks both module_content_items and lesson_content_items
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unlock_next_lesson(p_user_id uuid, p_quiz_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_content_item RECORD;
  v_next_content_item RECORD;
  v_module_id UUID;
BEGIN
  -- Get the quiz's content item (try module_content_items first)
  SELECT mci.id, mci.module_id, mci.position
  INTO v_content_item
  FROM module_content_items mci
  WHERE mci.content_id = p_quiz_id
    AND mci.content_type = 'quiz'
  LIMIT 1;

  -- If not found in module_content_items, try lesson_content_items
  IF v_content_item IS NULL THEN
    SELECT lci.id, lci.module_id, lci.position
    INTO v_content_item
    FROM lesson_content_items lci
    WHERE lci.content_id = p_quiz_id
      AND lci.content_type = 'quiz'
    LIMIT 1;
  END IF;

  IF v_content_item IS NULL THEN
    RETURN;
  END IF;

  -- Get the next content item in the same module
  -- Try module_content_items first
  SELECT mci.id, mci.content_id, mci.content_type
  INTO v_next_content_item
  FROM module_content_items mci
  WHERE mci.module_id = v_content_item.module_id
    AND mci.position > v_content_item.position
    AND mci.content_status = 'published'
  ORDER BY mci.position ASC
  LIMIT 1;

  -- If not found, try lesson_content_items
  IF v_next_content_item IS NULL THEN
    SELECT lci.id, lci.content_id, lci.content_type
    INTO v_next_content_item
    FROM lesson_content_items lci
    WHERE lci.module_id = v_content_item.module_id
      AND lci.position > v_content_item.position
      AND lci.content_status = 'published'
    ORDER BY lci.position ASC
    LIMIT 1;
  END IF;

  -- If there's a next item and it's a lesson, unlock it
  IF v_next_content_item IS NOT NULL AND v_next_content_item.content_type = 'lesson' THEN
    -- Update or insert lesson access status
    INSERT INTO lesson_access_status (user_id, lesson_id, content_item_id, is_locked, unlock_reason, unlocked_at, unlocked_by)
    VALUES (
      p_user_id,
      v_next_content_item.content_id,
      v_content_item.id,
      false,
      'coach_approved',
      NOW(),
      p_user_id
    )
    ON CONFLICT (user_id, lesson_id)
    DO UPDATE SET
      is_locked = false,
      unlock_reason = 'coach_approved',
      unlocked_at = NOW(),
      unlocked_by = p_user_id,
      updated_at = NOW();
  END IF;
END;
$function$;

-- ─────────────────────────────────────────────────────────
-- 4. Update check_lesson_all_content_completed function
--    Uses content_status instead of is_published
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_lesson_all_content_completed(p_user_id uuid, p_lesson_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  total_items     integer;
  completed_items integer;
BEGIN
  -- Count only REQUIRED items — everything except notes
  SELECT COUNT(*) INTO total_items
  FROM public.lesson_content_items
  WHERE lesson_id    = p_lesson_id
    AND content_type != 'notes'
    AND content_status = 'published';          -- 'notes' plural, matches schema

  -- No required items (note-only lesson) → auto-complete
  IF total_items = 0 THEN
    RETURN true;
  END IF;

  -- Count completed non-note items for this user
  SELECT COUNT(*) INTO completed_items
  FROM public.lesson_content_item_progress lcip
  JOIN public.lesson_content_items lci
    ON lci.id           = lcip.content_item_id
   AND lci.lesson_id    = p_lesson_id
   AND lci.content_type != 'notes'
   AND lci.content_status = 'published'
  WHERE lcip.user_id      = p_user_id
    AND lcip.lesson_id    = p_lesson_id
    AND lcip.is_completed = true;

  RETURN total_items = completed_items;
END;
$function$;

-- ─────────────────────────────────────────────────────────
-- 5. Add indexes on content_status for performance
-- ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_modules_content_status ON modules(content_status);
CREATE INDEX IF NOT EXISTS idx_lessons_content_status ON lessons(content_status);
CREATE INDEX IF NOT EXISTS idx_quizzes_content_status ON quizzes(content_status);
CREATE INDEX IF NOT EXISTS idx_module_content_items_content_status ON module_content_items(content_status);
CREATE INDEX IF NOT EXISTS idx_lesson_content_items_content_status ON lesson_content_items(content_status);

-- ─────────────────────────────────────────────────────────
-- 6. Update comments
-- ─────────────────────────────────────────────────────────
COMMENT ON FUNCTION public.calculate_lesson_completion(uuid, uuid) IS
  'Calculates lesson completion percentage. Uses content_status instead of is_published.';

COMMENT ON FUNCTION public.is_lesson_locked(uuid, uuid) IS
  'Checks if a lesson is locked for a user. Uses content_status instead of is_published.';

COMMENT ON FUNCTION public.unlock_next_lesson(uuid, uuid) IS
  'Unlocks the next lesson after quiz approval. Uses content_status instead of is_published.';

COMMENT ON FUNCTION public.check_lesson_all_content_completed(uuid, uuid) IS
  'Checks if all content items in a lesson are completed. Uses content_status instead of is_published.';
