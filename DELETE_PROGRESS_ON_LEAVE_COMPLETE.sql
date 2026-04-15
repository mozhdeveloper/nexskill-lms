-- ============================================
-- STEP 1: Check what tables actually exist
-- Run this FIRST to see your actual schema
-- ============================================

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%progress%'
ORDER BY table_name;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%quiz%' OR table_name LIKE '%lesson%' OR table_name LIKE '%content%')
ORDER BY table_name;

-- ============================================
-- STEP 2: Create bulletproof cleanup function
-- Run this in Supabase SQL Editor
-- ============================================

DROP FUNCTION IF EXISTS delete_student_course_progress(UUID, UUID);

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
  v_deleted_lessons INTEGER;
  v_deleted_attempts INTEGER;
  v_deleted_submissions INTEGER;
  v_deleted_responses INTEGER;
  v_deleted_feedback INTEGER;
  v_result JSONB;
BEGIN
  -- Get all module IDs for this course
  SELECT ARRAY_AGG(id) INTO v_module_ids
  FROM modules
  WHERE course_id = p_course_id;

  IF v_module_ids IS NULL OR array_length(v_module_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'No modules found');
  END IF;

  -- Get all lesson IDs in this course
  SELECT ARRAY_AGG(DISTINCT l.id) INTO v_lesson_ids
  FROM lessons l
  JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
  WHERE mci.module_id = ANY(v_module_ids);

  -- Get all quiz IDs in this course
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

  -- Get all quiz attempt IDs
  IF v_quiz_ids IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO v_attempt_ids
    FROM quiz_attempts
    WHERE user_id = p_user_id AND quiz_id = ANY(v_quiz_ids);
  END IF;

  -- Delete quiz feedback
  IF v_attempt_ids IS NOT NULL THEN
    DELETE FROM quiz_feedback
    WHERE quiz_submission_id IN (
      SELECT id FROM quiz_submissions WHERE quiz_attempt_id = ANY(v_attempt_ids)
    );
    GET DIAGNOSTICS v_deleted_feedback = ROW_COUNT;
  ELSE
    v_deleted_feedback := 0;
  END IF;

  -- Delete quiz submissions
  IF v_attempt_ids IS NOT NULL THEN
    DELETE FROM quiz_submissions
    WHERE quiz_attempt_id = ANY(v_attempt_ids);
    GET DIAGNOSTICS v_deleted_submissions = ROW_COUNT;
  ELSE
    v_deleted_submissions := 0;
  END IF;

  -- Delete quiz responses
  IF v_attempt_ids IS NOT NULL THEN
    DELETE FROM quiz_responses
    WHERE attempt_id = ANY(v_attempt_ids);
    GET DIAGNOSTICS v_deleted_responses = ROW_COUNT;
  ELSE
    v_deleted_responses := 0;
  END IF;

  -- Delete quiz attempts
  IF v_attempt_ids IS NOT NULL THEN
    DELETE FROM quiz_attempts
    WHERE id = ANY(v_attempt_ids);
    GET DIAGNOSTICS v_deleted_attempts = ROW_COUNT;
  ELSE
    v_deleted_attempts := 0;
  END IF;

  -- Delete lesson progress (CRITICAL: this controls the checkmarks)
  IF v_lesson_ids IS NOT NULL THEN
    DELETE FROM user_lesson_progress
    WHERE user_id = p_user_id AND lesson_id = ANY(v_lesson_ids);
    GET DIAGNOSTICS v_deleted_lessons = ROW_COUNT;
  ELSE
    v_deleted_lessons := 0;
  END IF;

  -- Delete lesson access status
  IF v_lesson_ids IS NOT NULL THEN
    DELETE FROM lesson_access_status
    WHERE user_id = p_user_id AND lesson_id = ANY(v_lesson_ids);
  END IF;

  -- Delete module progress (if table exists)
  BEGIN
    IF v_module_ids IS NOT NULL THEN
      DELETE FROM user_module_progress
      WHERE user_id = p_user_id AND module_id = ANY(v_module_ids);
    END IF;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  v_result := jsonb_build_object(
    'success', true,
    'deleted_lesson_progress', v_deleted_lessons,
    'deleted_attempts', v_deleted_attempts,
    'deleted_submissions', v_deleted_submissions,
    'deleted_responses', v_deleted_responses,
    'deleted_feedback', v_deleted_feedback
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify
SELECT proname FROM pg_proc WHERE proname = 'delete_student_course_progress';

-- ============================================
-- STEP 3: Test it manually for a specific user/course
-- Replace with your actual IDs
-- ============================================
/*
SELECT delete_student_course_progress(
  'YOUR_STUDENT_ID_HERE'::UUID,
  'YOUR_COURSE_ID_HERE'::UUID
);
*/
