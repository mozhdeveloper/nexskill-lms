-- ============================================
-- Feature: Delete Student Progress on Course Leave
-- ============================================
-- This function deletes ALL student progress for a specific course:
-- - Quiz responses
-- - Quiz submissions  
-- - Quiz feedback
-- - Quiz attempts
-- - Lesson progress
-- - Module progress
-- - Lesson access status
-- - Enrollment
-- ============================================

-- STEP 1: Create the cleanup function
-- ============================================

CREATE OR REPLACE FUNCTION delete_student_course_progress(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz_responses_count INTEGER := 0;
  v_quiz_submissions_count INTEGER := 0;
  v_quiz_feedback_count INTEGER := 0;
  v_quiz_attempts_count INTEGER := 0;
  v_lesson_progress_count INTEGER := 0;
  v_module_progress_count INTEGER := 0;
  v_lesson_access_count INTEGER := 0;
  v_enrollment_deleted BOOLEAN := false;
BEGIN
  -- 1. Delete quiz responses (linked to quiz_attempts)
  WITH deleted_responses AS (
    DELETE FROM quiz_responses
    WHERE attempt_id IN (
      SELECT qa.id FROM quiz_attempts qa
      JOIN quizzes q ON q.id = qa.quiz_id
      JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
      JOIN modules m ON m.id = mci.module_id
      WHERE qa.user_id = p_user_id
        AND m.course_id = p_course_id
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_quiz_responses_count FROM deleted_responses;

  -- 2. Delete quiz feedback (linked to quiz_submissions)
  WITH deleted_feedback AS (
    DELETE FROM quiz_feedback
    WHERE quiz_submission_id IN (
      SELECT qs.id FROM quiz_submissions qs
      JOIN quizzes q ON q.id = qs.quiz_id
      JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
      JOIN modules m ON m.id = mci.module_id
      WHERE qs.user_id = p_user_id
        AND m.course_id = p_course_id
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_quiz_feedback_count FROM deleted_feedback;

  -- 3. Delete quiz submissions
  WITH deleted_submissions AS (
    DELETE FROM quiz_submissions
    WHERE id IN (
      SELECT qs.id FROM quiz_submissions qs
      JOIN quizzes q ON q.id = qs.quiz_id
      JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
      JOIN modules m ON m.id = mci.module_id
      WHERE qs.user_id = p_user_id
        AND m.course_id = p_course_id
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_quiz_submissions_count FROM deleted_submissions;

  -- 4. Delete quiz attempts
  WITH deleted_attempts AS (
    DELETE FROM quiz_attempts
    WHERE id IN (
      SELECT qa.id FROM quiz_attempts qa
      JOIN quizzes q ON q.id = qa.quiz_id
      JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
      JOIN modules m ON m.id = mci.module_id
      WHERE qa.user_id = p_user_id
        AND m.course_id = p_course_id
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_quiz_attempts_count FROM deleted_attempts;

  -- 5. Delete lesson progress
  WITH deleted_lesson_progress AS (
    DELETE FROM user_lesson_progress
    WHERE user_id = p_user_id
    AND lesson_id IN (
      SELECT mci.content_id FROM module_content_items mci
      JOIN modules m ON m.id = mci.module_id
      WHERE mci.content_type = 'lesson'
        AND m.course_id = p_course_id
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_lesson_progress_count FROM deleted_lesson_progress;

  -- 6. Delete module progress
  WITH deleted_module_progress AS (
    DELETE FROM user_module_progress
    WHERE user_id = p_user_id
    AND module_id IN (
      SELECT m.id FROM modules m
      WHERE m.course_id = p_course_id
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_module_progress_count FROM deleted_module_progress;

  -- 7. Delete lesson access status
  WITH deleted_lesson_access AS (
    DELETE FROM lesson_access_status
    WHERE user_id = p_user_id
    AND lesson_id IN (
      SELECT mci.content_id FROM module_content_items mci
      JOIN modules m ON m.id = mci.module_id
      WHERE mci.content_type = 'lesson'
        AND m.course_id = p_course_id
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_lesson_access_count FROM deleted_lesson_access;

  -- 8. Delete enrollment
  DELETE FROM enrollments
  WHERE profile_id = p_user_id
    AND course_id = p_course_id;
  
  IF FOUND THEN
    v_enrollment_deleted := true;
  END IF;

  -- Return summary of what was deleted
  RETURN jsonb_build_object(
    'success', true,
    'quiz_responses_deleted', v_quiz_responses_count,
    'quiz_feedback_deleted', v_quiz_feedback_count,
    'quiz_submissions_deleted', v_quiz_submissions_count,
    'quiz_attempts_deleted', v_quiz_attempts_count,
    'lesson_progress_deleted', v_lesson_progress_count,
    'module_progress_deleted', v_module_progress_count,
    'lesson_access_deleted', v_lesson_access_count,
    'enrollment_deleted', v_enrollment_deleted
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- STEP 2: Test the function (optional - uncomment to test)
-- ============================================
-- Replace 'YOUR_USER_ID' and 'YOUR_COURSE_ID' with actual UUIDs
/*
SELECT delete_student_course_progress(
  'YOUR_USER_ID'::uuid,
  'YOUR_COURSE_ID'::uuid
);
*/

-- STEP 3: Verify function exists
-- ============================================
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'delete_student_course_progress';
