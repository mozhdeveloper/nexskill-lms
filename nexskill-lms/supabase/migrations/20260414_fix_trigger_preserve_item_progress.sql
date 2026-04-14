-- =====================================================
-- Migration: Preserve video/quiz progress, but fully reset notes-only lessons
-- =====================================================
-- ISSUE: When new content is added, the trigger should:
--   - For notes/text: Reset ALL progress (lesson + items) because they have no tracking
--   - For video/quiz: Reset only lesson completion, KEEP item progress
--
-- FIX: Conditional reset based on content_type.
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
    -- Get the content_type
    v_content_type := COALESCE(NEW.content_type, '');

    -- For notes/text: Reset ALL progress (lesson + items)
    IF v_content_type IN ('text', 'notes') THEN
      DELETE FROM user_lesson_progress
      WHERE lesson_id = target_lesson_id;

      DELETE FROM lesson_content_item_progress
      WHERE lesson_id = target_lesson_id;

      RETURN NEW;
    END IF;

    -- For video/quiz: Reset ONLY lesson completion, KEEP item progress
    -- Student hasn't seen new content → lesson no longer complete
    DELETE FROM user_lesson_progress
    WHERE lesson_id = target_lesson_id;

    -- DO NOT touch lesson_content_item_progress for video/quiz
    -- If student already watched a video, they keep that progress

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
  'FIXED: For notes/text → reset ALL progress. For video/quiz → reset only lesson completion, preserve item progress.';
