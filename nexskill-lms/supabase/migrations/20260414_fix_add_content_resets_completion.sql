-- =====================================================
-- Migration: Reset lesson completion when new content is added
-- =====================================================
-- ISSUE: When a coach adds new content to a lesson the student already
-- completed, the trigger skips resetting progress because the new content
-- has content_status = 'pending_addition'. But it SHOULD reset — the student
-- hasn't completed the new content yet, so the lesson is no longer complete.
--
-- FIX: Always reset progress when new REQUIRED content is added (INSERT),
-- regardless of content_status. Only skip for text/notes (no tracking).
-- =====================================================

CREATE OR REPLACE FUNCTION public.reset_lesson_completion_on_content_change()
RETURNS TRIGGER AS $$
DECLARE
  target_lesson_id UUID;
  v_is_publish_action BOOLEAN;
  v_content_status TEXT;
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
    v_content_status := COALESCE(NEW.content_status, 'published');
  END IF;

  IF target_lesson_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- ONLY reset progress when NEW content is ADDED (INSERT)
  IF TG_OP = 'INSERT' THEN
    -- Get the content_type to skip text/notes (no progress tracking)
    v_content_type := COALESCE(NEW.content_type, '');

    -- Skip reset for content types that have no progress tracking
    IF v_content_type IN ('text', 'notes') THEN
      RETURN NEW;
    END IF;

    -- Reset lesson-level completion
    DELETE FROM user_lesson_progress
    WHERE lesson_id = target_lesson_id;

    -- Reset item-level progress for this specific item only
    -- (Don't wipe ALL item progress, just the new one shouldn't exist yet)
    -- Actually, wipe all item progress to force fresh start
    DELETE FROM lesson_content_item_progress
    WHERE lesson_id = target_lesson_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- DO NOT reset progress when content is deleted
    -- Student already completed the lesson, removing a requirement
    -- doesn't invalidate their completion
    NULL;

  ELSIF TG_OP = 'UPDATE' THEN
    -- DO NOT reset progress on UPDATE
    -- Metadata changes, content_status changes, etc. should never
    -- invalidate student completion. Only INSERT (new content) should.
    NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.reset_lesson_completion_on_content_change() IS
  'FIXED: Resets lesson completion when ANY new required content is added (INSERT). Only skips for text/notes. DELETE and UPDATE never reset progress.';
