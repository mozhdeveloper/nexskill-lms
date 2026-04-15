-- =====================================================
-- Migration: Fix reset trigger RLS bypass (SECURITY DEFINER)
-- =====================================================
-- ISSUE: The reset_lesson_completion trigger runs as the coach who
-- adds content, but coaches can't DELETE from user_lesson_progress
-- due to RLS. The trigger silently fails.
--
-- FIX: Add SECURITY DEFINER so trigger runs as superuser.
-- =====================================================

CREATE OR REPLACE FUNCTION public.reset_lesson_completion_on_content_change()
RETURNS TRIGGER AS $$
DECLARE
  target_lesson_id UUID;
  v_is_publish_action BOOLEAN;
  v_content_type TEXT;
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
  END IF;

  IF target_lesson_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Get the content_type to skip text/notes (no progress tracking)
    v_content_type := COALESCE(NEW.content_type, '');

    -- Skip reset for content types that have no progress tracking
    IF v_content_type IN ('text', 'notes') THEN
      RETURN NEW;
    END IF;

    -- Reset lesson-level completion (SECURITY DEFINER bypasses RLS)
    DELETE FROM user_lesson_progress
    WHERE lesson_id = target_lesson_id;

    -- Reset item-level progress
    DELETE FROM lesson_content_item_progress
    WHERE lesson_id = target_lesson_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- DO NOT reset progress when content is deleted
    NULL;

  ELSIF TG_OP = 'UPDATE' THEN
    -- DO NOT reset progress on UPDATE
    NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reset_lesson_completion_on_content_change() IS
  'FIXED: SECURITY DEFINER bypasses RLS. Resets lesson completion when new required content is added (INSERT). Only skips for text/notes.';
