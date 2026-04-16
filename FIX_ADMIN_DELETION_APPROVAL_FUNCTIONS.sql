-- Fix admin deletion approval/rejection functions for course versioning soft-delete workflow.
-- Root cause: the original functions mixed up module_content_items IDs with lesson_content_items IDs
-- and used the wrong relationship path for lessons, so approval could succeed without actually
-- removing pending-deletion lesson rows.
-- Run this in Supabase SQL Editor.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_approve_deletion(p_course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_module_ids uuid[];
  v_lesson_ids uuid[];
  v_quiz_ids uuid[];
  v_module_content_item_ids uuid[];
  v_lesson_content_item_ids uuid[];
  v_quiz_question_ids uuid[];
  v_count integer;
  v_has_remaining boolean;
BEGIN
  PERFORM set_config('app.is_delete_action', 'true', false);

  -- Modules directly in this course
  SELECT ARRAY_AGG(m.id) INTO v_module_ids
  FROM public.modules m
  WHERE m.course_id = p_course_id
    AND m.content_status = 'pending_deletion';

  -- Lessons belong directly to the course
  SELECT ARRAY_AGG(l.id) INTO v_lesson_ids
  FROM public.lessons l
  WHERE l.course_id = p_course_id
    AND l.content_status = 'pending_deletion';

  -- Top-level module content items pending deletion
  SELECT ARRAY_AGG(mci.id) INTO v_module_content_item_ids
  FROM public.module_content_items mci
  JOIN public.modules m ON m.id = mci.module_id
  WHERE m.course_id = p_course_id
    AND mci.content_status = 'pending_deletion';

  -- Lesson content items pending deletion inside lessons of this course
  SELECT ARRAY_AGG(lci.id) INTO v_lesson_content_item_ids
  FROM public.lesson_content_items lci
  WHERE lci.course_id = p_course_id
    AND lci.content_status = 'pending_deletion';

  -- Quizzes pending deletion, regardless of whether they are top-level or inside lessons
  SELECT ARRAY_AGG(DISTINCT q.id) INTO v_quiz_ids
  FROM public.quizzes q
  WHERE q.content_status = 'pending_deletion'
    AND (
      EXISTS (
        SELECT 1
        FROM public.module_content_items mci
        JOIN public.modules m ON m.id = mci.module_id
        WHERE mci.content_id = q.id
          AND mci.content_type = 'quiz'
          AND m.course_id = p_course_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.lesson_content_items lci
        WHERE lci.content_id = q.id
          AND lci.content_type = 'quiz'
          AND lci.course_id = p_course_id
      )
    );

  IF v_quiz_ids IS NOT NULL AND array_length(v_quiz_ids, 1) > 0 THEN
    SELECT ARRAY_AGG(qq.id) INTO v_quiz_question_ids
    FROM public.quiz_questions qq
    WHERE qq.quiz_id = ANY(v_quiz_ids);
  END IF;

  -- Progress cleanup for pending-deletion lesson content items
  IF v_lesson_content_item_ids IS NOT NULL AND array_length(v_lesson_content_item_ids, 1) > 0 THEN
    DELETE FROM public.student_content_progress
    WHERE content_item_id = ANY(v_lesson_content_item_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % student_content_progress rows', v_count;
  END IF;

  -- Quiz-related cleanup
  IF v_quiz_ids IS NOT NULL AND array_length(v_quiz_ids, 1) > 0 THEN
    DELETE FROM public.quiz_feedback
    WHERE quiz_submission_id IN (
      SELECT qs.id
      FROM public.quiz_submissions qs
      WHERE qs.quiz_id = ANY(v_quiz_ids)
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_feedback rows', v_count;

    DELETE FROM public.quiz_submissions
    WHERE quiz_id = ANY(v_quiz_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_submissions rows', v_count;

    DELETE FROM public.quiz_responses
    WHERE attempt_id IN (
      SELECT qa.id
      FROM public.quiz_attempts qa
      WHERE qa.quiz_id = ANY(v_quiz_ids)
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_responses rows', v_count;

    DELETE FROM public.quiz_attempts
    WHERE quiz_id = ANY(v_quiz_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_attempts rows', v_count;
  END IF;

  -- Lesson-related learner progress cleanup
  IF v_lesson_ids IS NOT NULL AND array_length(v_lesson_ids, 1) > 0 THEN
    DELETE FROM public.lesson_content_item_progress
    WHERE lesson_id = ANY(v_lesson_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % lesson_content_item_progress rows', v_count;

    DELETE FROM public.user_lesson_progress
    WHERE lesson_id = ANY(v_lesson_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % user_lesson_progress rows', v_count;

    DELETE FROM public.lesson_access_status
    WHERE lesson_id = ANY(v_lesson_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % lesson_access_status rows', v_count;
  END IF;

  -- Delete dependent content rows first
  IF v_quiz_question_ids IS NOT NULL AND array_length(v_quiz_question_ids, 1) > 0 THEN
    DELETE FROM public.quiz_questions
    WHERE id = ANY(v_quiz_question_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quiz_questions rows', v_count;
  END IF;

  IF v_lesson_content_item_ids IS NOT NULL AND array_length(v_lesson_content_item_ids, 1) > 0 THEN
    DELETE FROM public.lesson_content_items
    WHERE id = ANY(v_lesson_content_item_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % lesson_content_items rows', v_count;
  END IF;

  IF v_quiz_ids IS NOT NULL AND array_length(v_quiz_ids, 1) > 0 THEN
    DELETE FROM public.quizzes
    WHERE id = ANY(v_quiz_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % quizzes rows', v_count;
  END IF;

  IF v_lesson_ids IS NOT NULL AND array_length(v_lesson_ids, 1) > 0 THEN
    DELETE FROM public.lessons
    WHERE id = ANY(v_lesson_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % lessons rows', v_count;
  END IF;

  IF v_module_content_item_ids IS NOT NULL AND array_length(v_module_content_item_ids, 1) > 0 THEN
    DELETE FROM public.module_content_items
    WHERE id = ANY(v_module_content_item_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % module_content_items rows', v_count;
  END IF;

  IF v_module_ids IS NOT NULL AND array_length(v_module_ids, 1) > 0 THEN
    DELETE FROM public.user_module_progress
    WHERE module_id = ANY(v_module_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % user_module_progress rows', v_count;

    DELETE FROM public.modules
    WHERE id = ANY(v_module_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % modules rows', v_count;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.modules m
    WHERE m.course_id = p_course_id
      AND m.content_status IN ('pending_addition', 'pending_deletion')
    UNION ALL
    SELECT 1
    FROM public.module_content_items mci
    JOIN public.modules m ON m.id = mci.module_id
    WHERE m.course_id = p_course_id
      AND mci.content_status IN ('pending_addition', 'pending_deletion')
    UNION ALL
    SELECT 1
    FROM public.lessons l
    WHERE l.course_id = p_course_id
      AND l.content_status IN ('pending_addition', 'pending_deletion')
    UNION ALL
    SELECT 1
    FROM public.lesson_content_items lci
    WHERE lci.course_id = p_course_id
      AND lci.content_status IN ('pending_addition', 'pending_deletion')
    UNION ALL
    SELECT 1
    FROM public.quizzes q
    WHERE q.content_status IN ('pending_addition', 'pending_deletion')
      AND (
        EXISTS (
          SELECT 1
          FROM public.module_content_items mci
          JOIN public.modules m ON m.id = mci.module_id
          WHERE mci.content_id = q.id
            AND mci.content_type = 'quiz'
            AND m.course_id = p_course_id
        )
        OR EXISTS (
          SELECT 1
          FROM public.lesson_content_items lci
          WHERE lci.content_id = q.id
            AND lci.content_type = 'quiz'
            AND lci.course_id = p_course_id
        )
      )
  ) INTO v_has_remaining;

  IF NOT v_has_remaining THEN
    UPDATE public.courses
    SET pending_content = false,
        updated_at = timezone('utc'::text, NOW())
    WHERE id = p_course_id;
  END IF;

  PERFORM set_config('app.is_delete_action', 'false', false);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Deletion approved and content removed',
    'modules_deleted', COALESCE(array_length(v_module_ids, 1), 0),
    'lessons_deleted', COALESCE(array_length(v_lesson_ids, 1), 0),
    'lesson_content_items_deleted', COALESCE(array_length(v_lesson_content_item_ids, 1), 0),
    'module_content_items_deleted', COALESCE(array_length(v_module_content_item_ids, 1), 0),
    'quizzes_deleted', COALESCE(array_length(v_quiz_ids, 1), 0),
    'quiz_questions_deleted', COALESCE(array_length(v_quiz_question_ids, 1), 0)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_reject_deletion(p_course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_count integer;
  v_has_remaining boolean;
BEGIN
  PERFORM set_config('app.is_delete_action', 'true', false);

  UPDATE public.modules
  SET content_status = 'published',
      deleted_at = NULL,
      updated_at = timezone('utc'::text, NOW())
  WHERE course_id = p_course_id
    AND content_status = 'pending_deletion';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Restored % modules', v_count;

  UPDATE public.lessons
  SET content_status = 'published',
      deleted_at = NULL,
      updated_at = timezone('utc'::text, NOW())
  WHERE course_id = p_course_id
    AND content_status = 'pending_deletion';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Restored % lessons', v_count;

  UPDATE public.module_content_items mci
  SET content_status = 'published',
      deleted_at = NULL,
      updated_at = timezone('utc'::text, NOW())
  WHERE mci.content_status = 'pending_deletion'
    AND EXISTS (
      SELECT 1
      FROM public.modules m
      WHERE m.id = mci.module_id
        AND m.course_id = p_course_id
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Restored % module_content_items', v_count;

  UPDATE public.lesson_content_items
  SET content_status = 'published',
      deleted_at = NULL,
      updated_at = timezone('utc'::text, NOW())
  WHERE course_id = p_course_id
    AND content_status = 'pending_deletion';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Restored % lesson_content_items', v_count;

  UPDATE public.quizzes q
  SET content_status = 'published',
      deleted_at = NULL,
      updated_at = timezone('utc'::text, NOW())
  WHERE q.content_status = 'pending_deletion'
    AND (
      EXISTS (
        SELECT 1
        FROM public.module_content_items mci
        JOIN public.modules m ON m.id = mci.module_id
        WHERE mci.content_id = q.id
          AND mci.content_type = 'quiz'
          AND m.course_id = p_course_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.lesson_content_items lci
        WHERE lci.content_id = q.id
          AND lci.content_type = 'quiz'
          AND lci.course_id = p_course_id
      )
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Restored % quizzes', v_count;

  UPDATE public.quiz_questions qq
  SET deleted_at = NULL
  WHERE qq.deleted_at IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.quizzes q
      WHERE q.id = qq.quiz_id
        AND q.content_status = 'published'
        AND (
          EXISTS (
            SELECT 1
            FROM public.module_content_items mci
            JOIN public.modules m ON m.id = mci.module_id
            WHERE mci.content_id = q.id
              AND mci.content_type = 'quiz'
              AND m.course_id = p_course_id
          )
          OR EXISTS (
            SELECT 1
            FROM public.lesson_content_items lci
            WHERE lci.content_id = q.id
              AND lci.content_type = 'quiz'
              AND lci.course_id = p_course_id
          )
        )
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Restored % quiz_questions', v_count;

  SELECT EXISTS (
    SELECT 1
    FROM public.modules m
    WHERE m.course_id = p_course_id
      AND m.content_status IN ('pending_addition', 'pending_deletion')
    UNION ALL
    SELECT 1
    FROM public.module_content_items mci
    JOIN public.modules m ON m.id = mci.module_id
    WHERE m.course_id = p_course_id
      AND mci.content_status IN ('pending_addition', 'pending_deletion')
    UNION ALL
    SELECT 1
    FROM public.lessons l
    WHERE l.course_id = p_course_id
      AND l.content_status IN ('pending_addition', 'pending_deletion')
    UNION ALL
    SELECT 1
    FROM public.lesson_content_items lci
    WHERE lci.course_id = p_course_id
      AND lci.content_status IN ('pending_addition', 'pending_deletion')
  ) INTO v_has_remaining;

  IF NOT v_has_remaining THEN
    UPDATE public.courses
    SET pending_content = false,
        updated_at = timezone('utc'::text, NOW())
    WHERE id = p_course_id;
  END IF;

  PERFORM set_config('app.is_delete_action', 'false', false);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Deletion rejected, content restored to published'
  );
END;
$function$;

COMMIT;

SELECT routine_schema, routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('admin_approve_deletion', 'admin_reject_deletion')
ORDER BY routine_name;
