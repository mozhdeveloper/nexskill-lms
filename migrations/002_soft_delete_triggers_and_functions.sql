-- Migration: Triggers and functions for soft delete workflow
-- Purpose: Handle deletion requests, admin approval cascade, and trigger guards
-- Date: 2026-04-15

-- ============================================================================
-- 1. TRIGGER GUARD: Update course verification on content deletion
-- ============================================================================

CREATE OR REPLACE FUNCTION update_course_verification_on_content_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_current_status TEXT;
  v_is_delete_action BOOLEAN;
  v_is_publish_action BOOLEAN;
BEGIN
  -- Skip during admin approve/reject action to prevent trigger loops
  v_is_delete_action := (current_setting('app.is_delete_action', true) = 'true');
  v_is_publish_action := (current_setting('app.is_publish_action', true) = 'true');
  
  IF v_is_delete_action OR v_is_publish_action THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Determine course_id based on table
  IF TG_TABLE_NAME = 'modules' THEN
    v_course_id := COALESCE(NEW.course_id, OLD.course_id);
  ELSIF TG_TABLE_NAME = 'module_content_items' THEN
    SELECT course_id INTO v_course_id FROM modules WHERE id = COALESCE(NEW.module_id, OLD.module_id);
  ELSIF TG_TABLE_NAME = 'lessons' THEN
    v_course_id := COALESCE(NEW.course_id, OLD.course_id);
  ELSIF TG_TABLE_NAME = 'lesson_content_items' THEN
    SELECT course_id INTO v_course_id FROM modules WHERE id = COALESCE(NEW.module_id, OLD.module_id);
  ELSIF TG_TABLE_NAME = 'quizzes' THEN
    -- Find course via content items
    SELECT m.course_id INTO v_course_id
    FROM lesson_content_items lci
    JOIN modules m ON m.id = lci.module_id
    WHERE lci.content_id = COALESCE(NEW.id, OLD.id)
      AND lci.content_type = 'quiz'
    LIMIT 1;
  END IF;

  IF v_course_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  SELECT verification_status INTO v_current_status FROM courses WHERE id = v_course_id;

  -- If course is approved and content is being marked for deletion, set pending_content flag
  IF v_current_status = 'approved' THEN
    -- Check if this is a deletion request (content_status changed to pending_deletion)
    IF TG_OP = 'UPDATE' AND NEW.content_status = 'pending_deletion' AND OLD.content_status != 'pending_deletion' THEN
      UPDATE courses 
      SET pending_content = true, updated_at = timezone('utc'::text, NOW())
      WHERE id = v_course_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to tables
DROP TRIGGER IF EXISTS trg_update_course_on_module_delete ON modules;
CREATE TRIGGER trg_update_course_on_module_delete
  AFTER UPDATE OR DELETE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION update_course_verification_on_content_delete();

DROP TRIGGER IF EXISTS trg_update_course_on_mci_delete ON module_content_items;
CREATE TRIGGER trg_update_course_on_mci_delete
  AFTER UPDATE OR DELETE ON module_content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_course_verification_on_content_delete();

DROP TRIGGER IF EXISTS trg_update_course_on_lesson_delete ON lessons;
CREATE TRIGGER trg_update_course_on_lesson_delete
  AFTER UPDATE OR DELETE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_course_verification_on_content_delete();

DROP TRIGGER IF EXISTS trg_update_course_on_lci_delete ON lesson_content_items;
CREATE TRIGGER trg_update_course_on_lci_delete
  AFTER UPDATE OR DELETE ON lesson_content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_course_verification_on_content_delete();

DROP TRIGGER IF EXISTS trg_update_course_on_quiz_delete ON quizzes;
CREATE TRIGGER trg_update_course_on_quiz_delete
  AFTER UPDATE OR DELETE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_course_verification_on_content_delete();


-- ============================================================================
-- 2. ADMIN APPROVE DELETION: Cascade hard delete when admin approves
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_approve_deletion(p_course_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_module_ids UUID[];
  v_lesson_ids UUID[];
  v_quiz_ids UUID[];
  v_content_item_ids UUID[];
  v_quiz_question_ids UUID[];
  v_attempt_ids UUID[];
  v_count INTEGER;
BEGIN
  -- Set session variable to prevent trigger loops
  PERFORM set_config('app.is_delete_action', 'true', false);

  -- Get modules pending deletion
  SELECT ARRAY_AGG(id) INTO v_module_ids
  FROM modules 
  WHERE course_id = p_course_id 
    AND content_status = 'pending_deletion';

  -- Get lessons pending deletion
  SELECT ARRAY_AGG(l.id) INTO v_lesson_ids
  FROM lessons l
  WHERE l.content_status = 'pending_deletion'
    AND EXISTS (
      SELECT 1 FROM lesson_content_items lci
      JOIN modules m ON m.id = lci.module_id
      WHERE lci.content_id = l.id 
        AND lci.content_type = 'lesson'
        AND m.course_id = p_course_id
    );

  -- Get quizzes pending deletion
  SELECT ARRAY_AGG(DISTINCT q.id) INTO v_quiz_ids
  FROM quizzes q
  WHERE q.content_status = 'pending_deletion'
    AND EXISTS (
      SELECT 1 FROM lesson_content_items lci
      JOIN modules m ON m.id = lci.module_id
      WHERE lci.content_id = q.id 
        AND lci.content_type = 'quiz'
        AND m.course_id = p_course_id
    );

  -- Get module_content_items pending deletion
  SELECT ARRAY_AGG(id) INTO v_content_item_ids
  FROM module_content_items
  WHERE module_id IN (SELECT id FROM modules WHERE course_id = p_course_id)
    AND content_status = 'pending_deletion';

  -- Get quiz questions for quizzes being deleted
  IF v_quiz_ids IS NOT NULL AND array_length(v_quiz_ids, 1) > 0 THEN
    SELECT ARRAY_AGG(id) INTO v_quiz_question_ids
    FROM quiz_questions
    WHERE quiz_id = ANY(v_quiz_ids);
  END IF;

  -- ========================================================================
  -- CASCADE DELETE in proper order (respecting FK constraints)
  -- ========================================================================

  -- 1. Quiz feedback for quizzes being deleted
  IF v_quiz_ids IS NOT NULL AND array_length(v_quiz_ids, 1) > 0 THEN
    DELETE FROM quiz_feedback 
    WHERE quiz_submission_id IN (
      SELECT qs.id 
      FROM quiz_submissions qs
      WHERE qs.quiz_id = ANY(v_quiz_ids)
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_feedback rows', v_count;
  END IF;

  -- 2. Quiz submissions for quizzes being deleted
  IF v_quiz_ids IS NOT NULL AND array_length(v_quiz_ids, 1) > 0 THEN
    DELETE FROM quiz_submissions 
    WHERE quiz_id = ANY(v_quiz_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_submissions rows', v_count;
  END IF;

  -- 3. Quiz responses for quiz attempts being deleted
  IF v_quiz_ids IS NOT NULL AND array_length(v_quiz_ids, 1) > 0 THEN
    DELETE FROM quiz_responses 
    WHERE attempt_id IN (
      SELECT qa.id 
      FROM quiz_attempts qa
      WHERE qa.quiz_id = ANY(v_quiz_ids)
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_responses rows', v_count;
  END IF;

  -- 4. Quiz attempts for quizzes being deleted
  IF v_quiz_ids IS NOT NULL AND array_length(v_quiz_ids, 1) > 0 THEN
    DELETE FROM quiz_attempts 
    WHERE quiz_id = ANY(v_quiz_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_attempts rows', v_count;
  END IF;

  -- 5. Student content progress for content items being deleted
  IF v_content_item_ids IS NOT NULL AND array_length(v_content_item_ids, 1) > 0 THEN
    DELETE FROM student_content_progress 
    WHERE content_item_id = ANY(v_content_item_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % student_content_progress rows', v_count;
  END IF;

  -- 6. Lesson content item progress for lessons being deleted
  IF v_lesson_ids IS NOT NULL AND array_length(v_lesson_ids, 1) > 0 THEN
    DELETE FROM lesson_content_item_progress 
    WHERE lesson_id = ANY(v_lesson_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % lesson_content_item_progress rows', v_count;
  END IF;

  -- 7. User lesson progress for lessons being deleted
  IF v_lesson_ids IS NOT NULL AND array_length(v_lesson_ids, 1) > 0 THEN
    DELETE FROM user_lesson_progress 
    WHERE lesson_id = ANY(v_lesson_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % user_lesson_progress rows', v_count;
  END IF;

  -- 8. Lesson access status for lessons being deleted
  IF v_lesson_ids IS NOT NULL AND array_length(v_lesson_ids, 1) > 0 THEN
    DELETE FROM lesson_access_status 
    WHERE lesson_id = ANY(v_lesson_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % lesson_access_status rows', v_count;
  END IF;

  -- 9. Quiz questions being deleted
  IF v_quiz_question_ids IS NOT NULL AND array_length(v_quiz_question_ids, 1) > 0 THEN
    DELETE FROM quiz_questions 
    WHERE id = ANY(v_quiz_question_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_questions rows', v_count;
  END IF;

  -- 10. Quizzes being deleted
  IF v_quiz_ids IS NOT NULL AND array_length(v_quiz_ids, 1) > 0 THEN
    DELETE FROM quizzes 
    WHERE id = ANY(v_quiz_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quizzes rows', v_count;
  END IF;

  -- 11. Lesson_content_items being deleted (includes lessons)
  IF v_content_item_ids IS NOT NULL AND array_length(v_content_item_ids, 1) > 0 THEN
    DELETE FROM lesson_content_items 
    WHERE id = ANY(v_content_item_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % lesson_content_items rows', v_count;
  END IF;

  -- 12. Lessons being deleted
  IF v_lesson_ids IS NOT NULL AND array_length(v_lesson_ids, 1) > 0 THEN
    DELETE FROM lessons 
    WHERE id = ANY(v_lesson_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % lessons rows', v_count;
  END IF;

  -- 13. Module_content_items being deleted
  IF v_content_item_ids IS NOT NULL AND array_length(v_content_item_ids, 1) > 0 THEN
    DELETE FROM module_content_items 
    WHERE id = ANY(v_content_item_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % module_content_items rows', v_count;
  END IF;

  -- 14. Modules being deleted
  IF v_module_ids IS NOT NULL AND array_length(v_module_ids, 1) > 0 THEN
    DELETE FROM modules 
    WHERE id = ANY(v_module_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % modules rows', v_count;
  END IF;

  -- 15. Update user_module_progress (remove progress for deleted modules)
  IF v_module_ids IS NOT NULL AND array_length(v_module_ids, 1) > 0 THEN
    DELETE FROM user_module_progress 
    WHERE module_id = ANY(v_module_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % user_module_progress rows', v_count;
  END IF;

  -- ========================================================================
  -- FINAL: Clear pending_content flag if no more pending changes
  -- ========================================================================
  
  -- Check if there are any remaining pending_addition or pending_deletion items
  DECLARE
    v_has_remaining BOOLEAN;
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM modules m 
      WHERE m.course_id = p_course_id 
        AND m.content_status IN ('pending_addition', 'pending_deletion')
      UNION ALL
      SELECT 1 FROM lesson_content_items lci
      JOIN modules m ON m.id = lci.module_id
      WHERE m.course_id = p_course_id 
        AND lci.content_status IN ('pending_addition', 'pending_deletion')
    ) INTO v_has_remaining;

    IF NOT v_has_remaining THEN
      UPDATE courses 
      SET pending_content = false, 
          updated_at = timezone('utc'::text, NOW())
      WHERE id = p_course_id;
    END IF;
  END;

  -- Clear session variable
  PERFORM set_config('app.is_delete_action', 'false', false);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Deletion approved and content removed',
    'modules_deleted', COALESCE(array_length(v_module_ids, 1), 0),
    'lessons_deleted', COALESCE(array_length(v_lesson_ids, 1), 0),
    'quizzes_deleted', COALESCE(array_length(v_quiz_ids, 1), 0),
    'quiz_questions_deleted', COALESCE(array_length(v_quiz_question_ids, 1), 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 3. ADMIN REJECT DELETION: Restore content to published status
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_reject_deletion(p_course_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Set session variable to prevent trigger loops
  PERFORM set_config('app.is_delete_action', 'true', false);

  -- Restore modules
  UPDATE modules 
  SET content_status = 'published', 
      deleted_at = NULL,
      updated_at = timezone('utc'::text, NOW())
  WHERE course_id = p_course_id 
    AND content_status = 'pending_deletion';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Restored % modules', v_count;

  -- Restore lessons
  UPDATE lessons l
  SET content_status = 'published', 
      deleted_at = NULL,
      updated_at = timezone('utc'::text, NOW())
  WHERE content_status = 'pending_deletion'
    AND EXISTS (
      SELECT 1 FROM lesson_content_items lci
      JOIN modules m ON m.id = lci.module_id
      WHERE lci.content_id = l.id 
        AND lci.content_type = 'lesson'
        AND m.course_id = p_course_id
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Restored % lessons', v_count;

  -- Restore lesson_content_items
  UPDATE lesson_content_items lci
  SET content_status = 'published', 
      deleted_at = NULL,
      updated_at = timezone('utc'::text, NOW())
  WHERE content_status = 'pending_deletion'
    AND module_id IN (
      SELECT id FROM modules WHERE course_id = p_course_id
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Restored % lesson_content_items', v_count;

  -- Restore quizzes
  UPDATE quizzes q
  SET content_status = 'published', 
      deleted_at = NULL,
      updated_at = timezone('utc'::text, NOW())
  WHERE content_status = 'pending_deletion'
    AND EXISTS (
      SELECT 1 FROM lesson_content_items lci
      JOIN modules m ON m.id = lci.module_id
      WHERE lci.content_id = q.id 
        AND lci.content_type = 'quiz'
        AND m.course_id = p_course_id
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Restored % quizzes', v_count;

  -- Restore quiz_questions
  UPDATE quiz_questions qq
  SET deleted_at = NULL
  WHERE quiz_id IN (
    SELECT q.id FROM quizzes q
    WHERE q.content_status = 'published'
      AND EXISTS (
        SELECT 1 FROM lesson_content_items lci
        JOIN modules m ON m.id = lci.module_id
        WHERE lci.content_id = q.id 
          AND lci.content_type = 'quiz'
          AND m.course_id = p_course_id
      )
  ) AND qq.deleted_at IS NOT NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Restored % quiz_questions', v_count;

  -- Check if there are any remaining pending items
  DECLARE
    v_has_remaining BOOLEAN;
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM modules m 
      WHERE m.course_id = p_course_id 
        AND m.content_status IN ('pending_addition', 'pending_deletion')
      UNION ALL
      SELECT 1 FROM lesson_content_items lci
      JOIN modules m ON m.id = lci.module_id
      WHERE m.course_id = p_course_id 
        AND lci.content_status IN ('pending_addition', 'pending_deletion')
    ) INTO v_has_remaining;

    IF NOT v_has_remaining THEN
      UPDATE courses 
      SET pending_content = false, 
          updated_at = timezone('utc'::text, NOW())
      WHERE id = p_course_id;
    END IF;
  END;

  -- Clear session variable
  PERFORM set_config('app.is_delete_action', 'false', false);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Deletion rejected, content restored to published'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
