-- ============================================
-- LEAVE COURSE FIX: Guaranteed cleanup
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- STEP 1: Drop everything old
DROP TRIGGER IF EXISTS trg_cleanup_on_unenroll ON enrollments;
DROP FUNCTION IF EXISTS cleanup_student_progress_on_unenroll();
DROP FUNCTION IF EXISTS delete_student_course_progress(UUID, UUID);

-- STEP 2: Create bulletproof cleanup function
CREATE OR REPLACE FUNCTION delete_student_course_progress(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_module_ids UUID[];
  v_lesson_ids UUID[];
  v_quiz_ids UUID[];
  v_attempt_ids UUID[];
  v_count INTEGER;
BEGIN
  -- Get modules for this course
  SELECT ARRAY_AGG(id) INTO v_module_ids
  FROM modules WHERE course_id = p_course_id;

  IF v_module_ids IS NULL OR array_length(v_module_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'No modules found');
  END IF;

  -- Get lessons
  SELECT ARRAY_AGG(DISTINCT l.id) INTO v_lesson_ids
  FROM lessons l
  JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
  WHERE mci.module_id = ANY(v_module_ids);

  -- Get quizzes (from BOTH module and lesson content items)
  SELECT ARRAY_AGG(DISTINCT q.id) INTO v_quiz_ids
  FROM quizzes q
  WHERE EXISTS (
    SELECT 1 FROM module_content_items mci 
    WHERE mci.content_id = q.id AND mci.content_type = 'quiz' AND mci.module_id = ANY(v_module_ids)
  )
  OR EXISTS (
    SELECT 1 FROM lesson_content_items lci 
    JOIN module_content_items mci ON mci.content_id = lci.lesson_id AND mci.content_type = 'lesson'
    WHERE lci.content_id = q.id AND lci.content_type = 'quiz' AND mci.module_id = ANY(v_module_ids)
  );

  -- Get attempts for this student
  IF v_quiz_ids IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO v_attempt_ids
    FROM quiz_attempts
    WHERE user_id = p_user_id AND quiz_id = ANY(v_quiz_ids);
  END IF;

  -- Delete in order (respecting FK constraints)
  
  -- 1. Quiz feedback
  IF v_attempt_ids IS NOT NULL THEN
    DELETE FROM quiz_feedback 
    WHERE quiz_submission_id IN (SELECT id FROM quiz_submissions WHERE quiz_attempt_id = ANY(v_attempt_ids));
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_feedback rows', v_count;
  END IF;

  -- 2. Quiz submissions
  IF v_attempt_ids IS NOT NULL THEN
    DELETE FROM quiz_submissions WHERE quiz_attempt_id = ANY(v_attempt_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_submissions rows', v_count;
  END IF;

  -- 3. Quiz responses
  IF v_attempt_ids IS NOT NULL THEN
    DELETE FROM quiz_responses WHERE attempt_id = ANY(v_attempt_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_responses rows', v_count;
  END IF;

  -- 4. Quiz attempts
  IF v_attempt_ids IS NOT NULL THEN
    DELETE FROM quiz_attempts WHERE id = ANY(v_attempt_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_attempts rows', v_count;
  END IF;

  -- 5. Lesson progress (CRITICAL: this controls checkmarks)
  IF v_lesson_ids IS NOT NULL THEN
    DELETE FROM user_lesson_progress WHERE user_id = p_user_id AND lesson_id = ANY(v_lesson_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % user_lesson_progress rows', v_count;
  END IF;

  -- 6. Lesson access status
  IF v_lesson_ids IS NOT NULL THEN
    DELETE FROM lesson_access_status WHERE user_id = p_user_id AND lesson_id = ANY(v_lesson_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % lesson_access_status rows', v_count;
  END IF;

  -- 7. Module progress
  BEGIN
    IF v_module_ids IS NOT NULL THEN
      DELETE FROM user_module_progress WHERE user_id = p_user_id AND module_id = ANY(v_module_ids);
    END IF;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'user_module_progress table does not exist, skipping';
  END;

  RETURN jsonb_build_object('success', true, 'message', 'Progress deleted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Grant permissions
GRANT EXECUTE ON FUNCTION delete_student_course_progress(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_student_course_progress(UUID, UUID) TO service_role;

-- STEP 4: Verify
SELECT proname FROM pg_proc WHERE proname = 'delete_student_course_progress';

-- STEP 5: Test manually (UNCOMMENT and replace IDs)
-- Run this to verify it works before testing from UI:
/*
SELECT delete_student_course_progress(
  'YOUR_STUDENT_ID_HERE'::UUID,
  'YOUR_COURSE_ID_HERE'::UUID
);
*/
