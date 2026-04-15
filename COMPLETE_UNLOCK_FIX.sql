-- ============================================
-- COMPLETE FIX: Coach approval unlocks next lesson
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- STEP 1: Drop old trigger and function
DROP TRIGGER IF EXISTS trg_unlock_next_lesson ON quiz_submissions;
DROP FUNCTION IF EXISTS unlock_next_lesson_on_approval();
DROP FUNCTION IF EXISTS unlock_next_lesson(UUID, UUID);

-- STEP 2: Create the fixed function
CREATE OR REPLACE FUNCTION unlock_next_lesson(
  p_user_id UUID,
  p_quiz_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_content_item RECORD;
  v_next_content_item RECORD;
  v_current_lesson_id UUID;
BEGIN
  -- Path 1: Quiz in module_content_items
  SELECT mci.id, mci.module_id, mci.position, NULL::uuid as lesson_id
  INTO v_content_item
  FROM module_content_items mci
  WHERE mci.content_id = p_quiz_id AND mci.content_type = 'quiz'
  LIMIT 1;

  -- Path 2: Quiz in lesson_content_items
  IF v_content_item IS NULL THEN
    SELECT mci.id, mci.module_id, mci.position, l.id as lesson_id
    INTO v_content_item
    FROM lesson_content_items lci
    JOIN lessons l ON l.id = lci.lesson_id
    JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
    WHERE lci.content_id = p_quiz_id AND lci.content_type = 'quiz'
    LIMIT 1;
  END IF;

  IF v_content_item IS NULL THEN
    RAISE WARNING 'Quiz % not found', p_quiz_id;
    RETURN;
  END IF;

  -- Mark current lesson as complete
  IF v_content_item.lesson_id IS NOT NULL THEN
    INSERT INTO user_lesson_progress (user_id, lesson_id, is_completed, completed_at)
    VALUES (p_user_id, v_content_item.lesson_id, true, NOW())
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET
      is_completed = true,
      completed_at = NOW(),
      updated_at = NOW();
  END IF;

  -- Get next content item
  SELECT mci.id, mci.content_id, mci.content_type
  INTO v_next_content_item
  FROM module_content_items mci
  WHERE mci.module_id = v_content_item.module_id
    AND mci.position > v_content_item.position
    AND mci.is_published = true
  ORDER BY mci.position ASC
  LIMIT 1;

  -- Unlock next lesson
  IF v_next_content_item IS NOT NULL AND v_next_content_item.content_type = 'lesson' THEN
    INSERT INTO lesson_access_status (user_id, lesson_id, content_item_id, is_locked, unlock_reason, unlocked_at, unlocked_by)
    VALUES (p_user_id, v_next_content_item.content_id, v_content_item.id, false, 'coach_approved', NOW(), p_user_id)
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET
      is_locked = false,
      unlock_reason = 'coach_approved',
      unlocked_at = NOW(),
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Create trigger function
CREATE OR REPLACE FUNCTION unlock_next_lesson_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'passed' AND (OLD.status IS NULL OR OLD.status != 'passed') THEN
    PERFORM unlock_next_lesson(NEW.user_id, NEW.quiz_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Create trigger
CREATE TRIGGER trg_unlock_next_lesson
  AFTER UPDATE OF status ON quiz_submissions
  FOR EACH ROW
  EXECUTE FUNCTION unlock_next_lesson_on_approval();

-- STEP 5: Manually fix existing approved quizzes
-- This updates all currently 'passed' submissions
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT qs.user_id, qs.quiz_id
    FROM quiz_submissions qs
    WHERE qs.status = 'passed'
  LOOP
    RAISE NOTICE 'Processing user % quiz %', r.user_id, r.quiz_id;
    PERFORM unlock_next_lesson(r.user_id, r.quiz_id);
  END LOOP;
END $$;

-- STEP 6: Verify the fix worked
-- Check if lessons are now marked complete
SELECT 
    ulp.lesson_id,
    ulp.is_completed,
    ulp.completed_at,
    q.title as quiz_title,
    qs.status
FROM user_lesson_progress ulp
JOIN quizzes q ON q.lesson_id = ulp.lesson_id
LEFT JOIN quiz_submissions qs ON qs.user_id = ulp.user_id AND qs.quiz_id = q.id
WHERE ulp.is_completed = true
  AND qs.status = 'passed'
ORDER BY ulp.completed_at DESC
LIMIT 10;

-- STEP 7: Verify trigger exists
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'trg_unlock_next_lesson';
