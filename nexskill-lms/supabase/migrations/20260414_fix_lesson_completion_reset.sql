-- =====================================================
-- FIX: Lesson Completion Reset on Content Deletion
-- =====================================================
-- ISSUE: When a coach deletes a lesson_content_item that a student has
-- already completed, the trigger resets ALL student progress for that lesson,
-- causing completed lessons to show as incomplete.
--
-- FIX: Only reset student progress when content is ADDED (new requirements),
-- NOT when content is DELETED (removing requirements doesn't invalidate completion).
--
-- LOGIC: Adding work → invalidate completion (student hasn't seen new content)
--        Removing work → keep completion (student already finished all requirements)
-- =====================================================

-- ─────────────────────────────────────────────────────────
-- 1. Replace reset_lesson_completion_on_content_change()
--    with fixed logic that skips progress reset on DELETE
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reset_lesson_completion_on_content_change()
RETURNS TRIGGER AS $$
DECLARE
  target_lesson_id UUID;
  v_is_publish_action BOOLEAN;
  v_is_published BOOLEAN;
BEGIN
  -- Skip during admin approval publish cycle
  v_is_publish_action := (current_setting('app.is_publish_action', true) = 'true');
  IF v_is_publish_action THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    target_lesson_id := OLD.lesson_id;
  ELSE
    target_lesson_id := NEW.lesson_id;
    v_is_published := COALESCE(NEW.is_published, true);
  END IF;

  IF target_lesson_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- FIX: Only reset progress when content is ADDED (INSERT), not when DELETED
  -- Adding new content means students need to complete it → reset progress
  -- Removing content doesn't invalidate what student already completed → keep progress
  
  IF TG_OP = 'INSERT' THEN
    -- Only reset if the content is (or will be) visible to students
    -- Skip reset for unpublished content (pending admin approval)
    IF v_is_published = false THEN
      RETURN NEW;
    END IF;

    -- Reset lesson-level completion
    DELETE FROM user_lesson_progress
    WHERE lesson_id = target_lesson_id;

    -- Reset item-level progress so stale completions
    -- don't cause the lesson to instantly re-complete on next visit
    DELETE FROM lesson_content_item_progress
    WHERE lesson_id = target_lesson_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- DO NOT reset progress when content is deleted
    -- Student already completed the lesson, removing a requirement
    -- doesn't invalidate their completion
    NULL;

  ELSIF TG_OP = 'UPDATE' THEN
    -- On update, only reset if is_published changed from false to true
    -- (content is being published for the first time)
    IF OLD.is_published = false AND NEW.is_published = true THEN
      DELETE FROM user_lesson_progress
      WHERE lesson_id = target_lesson_id;

      DELETE FROM lesson_content_item_progress
      WHERE lesson_id = target_lesson_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 2. Update trigger comment
-- ─────────────────────────────────────────────────────────
COMMENT ON FUNCTION public.reset_lesson_completion_on_content_change() IS 
  'FIXED: Only resets lesson completion when content is ADDED (INSERT), not when deleted. Deleting content does not invalidate student completion.';
