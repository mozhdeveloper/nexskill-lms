-- ============================================
-- FIX: unlock_next_lesson for quizzes in lesson_content_items
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop old trigger first
DROP TRIGGER IF EXISTS trg_unlock_next_lesson ON quiz_submissions;

-- Drop old function
DROP FUNCTION IF EXISTS unlock_next_lesson_on_approval();
DROP FUNCTION IF EXISTS unlock_next_lesson(UUID, UUID);

-- Create the fixed function that handles BOTH paths
CREATE OR REPLACE FUNCTION unlock_next_lesson(
  p_user_id UUID,
  p_quiz_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_content_item RECORD;
  v_next_content_item RECORD;
  v_module_id UUID;
  v_lesson_id UUID;
  v_current_lesson_id UUID;
BEGIN
  -- Try Path 1: Quiz is directly in module_content_items
  SELECT mci.id, mci.module_id, mci.position, NULL::uuid as lesson_id
  INTO v_content_item
  FROM module_content_items mci
  WHERE mci.content_id = p_quiz_id
    AND mci.content_type = 'quiz'
  LIMIT 1;

  -- Try Path 2: Quiz is in lesson_content_items (inside a lesson)
  IF v_content_item IS NULL THEN
    SELECT mci.id, mci.module_id, mci.position, l.id as lesson_id
    INTO v_content_item
    FROM lesson_content_items lci
    JOIN lessons l ON l.id = lci.lesson_id
    JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
    WHERE lci.content_id = p_quiz_id
      AND lci.content_type = 'quiz'
    LIMIT 1;
  END IF;

  -- If still NULL, quiz not found in either path
  IF v_content_item IS NULL THEN
    RAISE NOTICE 'unlock_next_lesson: Quiz % not found in module_content_items or lesson_content_items', p_quiz_id;
    RETURN;
  END IF;

  -- If quiz is inside a lesson, mark that lesson as complete in user_lesson_progress
  IF v_content_item.lesson_id IS NOT NULL THEN
    v_current_lesson_id := v_content_item.lesson_id;
    
    RAISE NOTICE 'unlock_next_lesson: Marking lesson % as complete for user %', v_current_lesson_id, p_user_id;
    
    -- Mark current lesson as complete in user_lesson_progress
    INSERT INTO user_lesson_progress (user_id, lesson_id, is_completed, completed_at)
    VALUES (p_user_id, v_current_lesson_id, true, NOW())
    ON CONFLICT (user_id, lesson_id)
    DO UPDATE SET
      is_completed = true,
      completed_at = NOW(),
      updated_at = NOW();
      
    RAISE NOTICE 'unlock_next_lesson: Lesson % marked as complete', v_current_lesson_id;
  END IF;

  RAISE NOTICE 'unlock_next_lesson: Found quiz in module %, position %, lesson_id %', 
    v_content_item.module_id, v_content_item.position, v_content_item.lesson_id;

  -- Get the next content item in the same module
  SELECT mci.id, mci.content_id, mci.content_type
  INTO v_next_content_item
  FROM module_content_items mci
  WHERE mci.module_id = v_content_item.module_id
    AND mci.position > v_content_item.position
    AND mci.is_published = true
  ORDER BY mci.position ASC
  LIMIT 1;

  -- If there's a next item and it's a lesson, unlock it
  IF v_next_content_item IS NOT NULL AND v_next_content_item.content_type = 'lesson' THEN
    RAISE NOTICE 'unlock_next_lesson: Unlocking next lesson %', v_next_content_item.content_id;
    
    -- Update lesson_access_status for the next lesson
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
      
    RAISE NOTICE 'unlock_next_lesson: Successfully unlocked lesson %', v_next_content_item.content_id;
  ELSE
    RAISE NOTICE 'unlock_next_lesson: No next lesson found or next item is not a lesson';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger function
CREATE OR REPLACE FUNCTION unlock_next_lesson_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when status changes to 'passed'
  IF NEW.status = 'passed' AND (OLD.status IS NULL OR OLD.status != 'passed') THEN
    PERFORM unlock_next_lesson(NEW.user_id, NEW.quiz_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on quiz_submissions
CREATE TRIGGER trg_unlock_next_lesson
  AFTER UPDATE OF status ON quiz_submissions
  FOR EACH ROW
  EXECUTE FUNCTION unlock_next_lesson_on_approval();

-- ============================================
-- TEST: Verify the fix
-- ============================================

-- Check if the function exists
SELECT 
    proname as function_name,
    prosrc as function_code
FROM pg_proc
WHERE proname = 'unlock_next_lesson';

-- Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trg_unlock_next_lesson';
