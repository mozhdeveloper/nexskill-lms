-- ============================================
-- FIX: Allow approval even if unlock fails
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop old trigger
DROP TRIGGER IF EXISTS trg_unlock_next_lesson ON quiz_submissions;
DROP FUNCTION IF EXISTS unlock_next_lesson_on_approval();
DROP FUNCTION IF EXISTS unlock_next_lesson(UUID, UUID);

-- Create function with better error handling
CREATE OR REPLACE FUNCTION unlock_next_lesson(
  p_user_id UUID,
  p_quiz_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_module_content_id UUID;
  v_module_id UUID;
  v_position INTEGER;
  v_lesson_id UUID;
  v_next_content_item RECORD;
  v_next_lesson_id UUID;
BEGIN
  -- Path 1: Quiz directly in module_content_items
  SELECT mci.id, mci.module_id, mci.position, NULL::uuid
  INTO v_module_content_id, v_module_id, v_position, v_lesson_id
  FROM module_content_items mci
  WHERE mci.content_id = p_quiz_id AND mci.content_type = 'quiz'
  LIMIT 1;

  -- Path 2: Quiz inside a lesson (lesson_content_items)
  IF v_module_content_id IS NULL THEN
    SELECT mci.id, mci.module_id, mci.position, l.id
    INTO v_module_content_id, v_module_id, v_position, v_lesson_id
    FROM lesson_content_items lci
    JOIN lessons l ON l.id = lci.lesson_id
    JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
    WHERE lci.content_id = p_quiz_id AND lci.content_type = 'quiz'
    LIMIT 1;
  END IF;

  IF v_module_content_id IS NULL THEN
    RAISE WARNING 'Quiz % not found in content items', p_quiz_id;
    RETURN;
  END IF;

  -- Mark lesson complete in user_lesson_progress
  IF v_lesson_id IS NOT NULL THEN
    INSERT INTO user_lesson_progress (user_id, lesson_id, is_completed, completed_at)
    VALUES (p_user_id, v_lesson_id, true, NOW())
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET
      is_completed = true,
      completed_at = NOW(),
      updated_at = NOW();
  END IF;

  -- Get next content item
  SELECT mci.id, mci.content_id, mci.content_type
  INTO v_next_content_item
  FROM module_content_items mci
  WHERE mci.module_id = v_module_id
    AND mci.position > v_position
    AND mci.is_published = true
  ORDER BY mci.position ASC
  LIMIT 1;

  -- Unlock next lesson
  IF v_next_content_item IS NOT NULL AND v_next_content_item.content_type = 'lesson' THEN
    v_next_lesson_id := v_next_content_item.content_id;
    
    INSERT INTO lesson_access_status (user_id, lesson_id, content_item_id, is_locked, unlock_reason, unlocked_at, unlocked_by)
    VALUES (p_user_id, v_next_lesson_id, v_module_content_id, false, 'coach_approved', NOW(), p_user_id)
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET
      is_locked = false,
      unlock_reason = 'coach_approved',
      unlocked_at = NOW(),
      updated_at = NOW();
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail
  RAISE WARNING 'unlock_next_lesson failed for quiz %: %', p_quiz_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function with exception handling
CREATE OR REPLACE FUNCTION unlock_next_lesson_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'passed' AND (OLD.status IS NULL OR OLD.status != 'passed') THEN
    BEGIN
      PERFORM unlock_next_lesson(NEW.user_id, NEW.quiz_id);
    EXCEPTION WHEN OTHERS THEN
      -- Log warning but don't fail the quiz_submissions update
      RAISE WARNING 'Trigger: unlock_next_lesson failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trg_unlock_next_lesson
  AFTER UPDATE OF status ON quiz_submissions
  FOR EACH ROW
  EXECUTE FUNCTION unlock_next_lesson_on_approval();

-- Manually fix existing passed submissions (ignore errors)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT qs.user_id, qs.quiz_id
    FROM quiz_submissions qs
    WHERE qs.status = 'passed'
  LOOP
    BEGIN
      PERFORM unlock_next_lesson(r.user_id, r.quiz_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to process % %: %', r.user_id, r.quiz_id, SQLERRM;
    END;
  END LOOP;
END $$;

-- Verify
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'trg_unlock_next_lesson';
