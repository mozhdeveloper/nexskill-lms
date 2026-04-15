-- ============================================
-- AUTOMATIC: Delete progress when enrollment is deleted
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Create the cleanup function
CREATE OR REPLACE FUNCTION cleanup_student_progress_on_unenroll()
RETURNS TRIGGER AS $$
DECLARE
  v_module_ids UUID[];
  v_lesson_ids UUID[];
  v_quiz_ids UUID[];
  v_attempt_ids UUID[];
BEGIN
  -- Get module IDs for this course
  SELECT ARRAY_AGG(id) INTO v_module_ids
  FROM modules WHERE course_id = OLD.course_id;

  IF v_module_ids IS NULL THEN
    RETURN OLD;
  END IF;

  -- Get lesson IDs
  SELECT ARRAY_AGG(DISTINCT l.id) INTO v_lesson_ids
  FROM lessons l
  JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
  WHERE mci.module_id = ANY(v_module_ids);

  -- Get quiz IDs
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

  -- Get attempt IDs
  IF v_quiz_ids IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO v_attempt_ids
    FROM quiz_attempts
    WHERE user_id = OLD.profile_id AND quiz_id = ANY(v_quiz_ids);
  END IF;

  -- Delete in correct order (FK constraints)
  IF v_attempt_ids IS NOT NULL THEN
    DELETE FROM quiz_feedback WHERE quiz_submission_id IN (SELECT id FROM quiz_submissions WHERE quiz_attempt_id = ANY(v_attempt_ids));
    DELETE FROM quiz_submissions WHERE quiz_attempt_id = ANY(v_attempt_ids);
    DELETE FROM quiz_responses WHERE attempt_id = ANY(v_attempt_ids);
    DELETE FROM quiz_attempts WHERE id = ANY(v_attempt_ids);
  END IF;

  IF v_lesson_ids IS NOT NULL THEN
    DELETE FROM user_lesson_progress WHERE user_id = OLD.profile_id AND lesson_id = ANY(v_lesson_ids);
    DELETE FROM lesson_access_status WHERE user_id = OLD.profile_id AND lesson_id = ANY(v_lesson_ids);
  END IF;

  BEGIN
    IF v_module_ids IS NOT NULL THEN
      DELETE FROM user_module_progress WHERE user_id = OLD.profile_id AND module_id = ANY(v_module_ids);
    END IF;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  RAISE NOTICE 'Cleaned up progress for user % course %', OLD.profile_id, OLD.course_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Create trigger on enrollments table
DROP TRIGGER IF EXISTS trg_cleanup_on_unenroll ON enrollments;
CREATE TRIGGER trg_cleanup_on_unenroll
  BEFORE DELETE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_student_progress_on_unenroll();

-- STEP 3: Also fix the RPC function to be accessible
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
  v_lessons_deleted INTEGER;
  v_attempts_deleted INTEGER;
BEGIN
  SELECT ARRAY_AGG(id) INTO v_module_ids
  FROM modules WHERE course_id = p_course_id;

  IF v_module_ids IS NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'No modules');
  END IF;

  SELECT ARRAY_AGG(DISTINCT l.id) INTO v_lesson_ids
  FROM lessons l
  JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
  WHERE mci.module_id = ANY(v_module_ids);

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

  IF v_quiz_ids IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO v_attempt_ids
    FROM quiz_attempts
    WHERE user_id = p_user_id AND quiz_id = ANY(v_quiz_ids);
  END IF;

  -- Delete quiz data
  IF v_attempt_ids IS NOT NULL THEN
    DELETE FROM quiz_feedback WHERE quiz_submission_id IN (SELECT id FROM quiz_submissions WHERE quiz_attempt_id = ANY(v_attempt_ids));
    DELETE FROM quiz_submissions WHERE quiz_attempt_id = ANY(v_attempt_ids);
    DELETE FROM quiz_responses WHERE attempt_id = ANY(v_attempt_ids);
    DELETE FROM quiz_attempts WHERE id = ANY(v_attempt_ids);
    GET DIAGNOSTICS v_attempts_deleted = ROW_COUNT;
  END IF;

  -- Delete lesson progress
  IF v_lesson_ids IS NOT NULL THEN
    DELETE FROM user_lesson_progress WHERE user_id = p_user_id AND lesson_id = ANY(v_lesson_ids);
    GET DIAGNOSTICS v_lessons_deleted = ROW_COUNT;
    DELETE FROM lesson_access_status WHERE user_id = p_user_id AND lesson_id = ANY(v_lesson_ids);
  END IF;

  -- Delete module progress
  BEGIN
    IF v_module_ids IS NOT NULL THEN
      DELETE FROM user_module_progress WHERE user_id = p_user_id AND module_id = ANY(v_module_ids);
    END IF;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'lessons_deleted', v_lessons_deleted,
    'attempts_deleted', v_attempts_deleted
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Grant execute permission
GRANT EXECUTE ON FUNCTION delete_student_course_progress(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_student_progress_on_unenroll() TO authenticated;

-- Verify
SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_name = 'trg_cleanup_on_unenroll';
SELECT proname FROM pg_proc WHERE proname = 'delete_student_course_progress';
