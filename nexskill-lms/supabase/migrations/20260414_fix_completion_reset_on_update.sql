-- =====================================================
-- Migration: Fix lesson completion reset on UPDATE
-- =====================================================
-- ISSUE: The UPDATE branch in reset_lesson_completion_on_content_change
-- resets student progress when content_status is set to 'published',
-- even if it was already published. This causes completed lessons
-- to lose their completion status after navigation/refresh.
--
-- FIX: Remove the UPDATE branch entirely. Only INSERT should reset
-- progress (new content added). Updates should NEVER reset progress.
-- =====================================================

CREATE OR REPLACE FUNCTION public.reset_lesson_completion_on_content_change()
RETURNS TRIGGER AS $$
DECLARE
  target_lesson_id UUID;
  v_is_publish_action BOOLEAN;
  v_content_status TEXT;
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
  -- This ensures students must complete new content
  IF TG_OP = 'INSERT' THEN
    -- Skip reset for unpublished content (pending admin approval)
    IF v_content_status = 'pending_addition' OR v_content_status = 'draft' THEN
      RETURN NEW;
    END IF;

    -- Reset lesson-level completion
    DELETE FROM user_lesson_progress
    WHERE lesson_id = target_lesson_id;

    -- Reset item-level progress
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
  'FIXED: Only resets lesson completion when content is ADDED (INSERT). DELETE and UPDATE never reset progress.';
