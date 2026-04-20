-- Migration: Update existing trigger to handle pending_deletion AND pending_addition status
-- Purpose: Prevent lesson completion reset when content is marked for deletion OR pending approval
-- Date: 2026-04-15

-- ============================================================================
-- UPDATE: reset_lesson_completion_on_content_change
-- Add guard for pending_deletion and pending_addition status to preserve student progress
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_lesson_completion_on_content_change()
RETURNS TRIGGER AS $$
DECLARE
  target_lesson_id UUID;
  v_is_publish_action BOOLEAN;
  v_is_delete_action BOOLEAN;
  v_content_type TEXT;
BEGIN
  -- Skip during admin approval publish cycle
  v_is_publish_action := (current_setting('app.is_publish_action', true) = 'true');
  v_is_delete_action := (current_setting('app.is_delete_action', true) = 'true');

  IF v_is_publish_action OR v_is_delete_action THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Determine target lesson
  IF TG_OP = 'DELETE' THEN
    target_lesson_id := OLD.lesson_id;
  ELSE
    target_lesson_id := NEW.lesson_id;
  END IF;

  IF target_lesson_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- ========================================================================
  -- NEW: Skip reset if content is being soft-deleted (pending_deletion)
  -- This preserves student progress until admin approves the deletion
  -- ========================================================================
  IF TG_OP = 'UPDATE' AND NEW.content_status = 'pending_deletion' THEN
    -- Content is being marked for deletion, but not yet deleted
    -- DON'T reset progress - keep it visible to students until admin approves
    RETURN NEW;
  END IF;

  -- ========================================================================
  -- NEW: Skip reset if content is pending admin approval (pending_addition)
  -- This keeps the lesson completion checkmark visible until content is live
  -- ========================================================================
  IF TG_OP = 'INSERT' AND NEW.content_status = 'pending_addition' THEN
    -- Content is saved but not yet approved by admin
    -- DON'T reset progress - student hasn't seen the new content yet
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    -- Hard delete is happening (admin approved deletion via cascade)
    -- The admin_approve_deletion() function handles student progress cleanup
    -- So we can skip reset here
    RETURN OLD;
  END IF;

  -- ========================================================================
  -- EXISTING LOGIC: Handle content additions (only for published content)
  -- ========================================================================
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
    DELETE FROM user_lesson_progress
    WHERE lesson_id = target_lesson_id;

    -- DO NOT touch lesson_content_item_progress for video/quiz
    -- If student already watched a video, they keep that progress

  ELSIF TG_OP = 'UPDATE' THEN
    -- DO NOT reset progress on UPDATE
    NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;