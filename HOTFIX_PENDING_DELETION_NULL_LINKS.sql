-- HOTFIX: Pending-deletion rows stuck due to NULL course_id/module_id on lesson_content_items
-- This script:
-- 1) Backfills missing links on lesson_content_items
-- 2) Replaces get_pending_deletions() with NULL-safe course resolution
-- 3) Replaces admin_approve_deletion()/admin_reject_deletion() with NULL-safe matching
--
-- Run in Supabase SQL Editor.

BEGIN;

-- ============================================================================
-- 1) Backfill missing linkage on lesson_content_items
-- ============================================================================

-- Fill missing module_id from module_content_items (lesson container row)
UPDATE public.lesson_content_items lci
SET module_id = mci.module_id
FROM public.module_content_items mci
WHERE lci.module_id IS NULL
  AND mci.content_type = 'lesson'
  AND mci.content_id = lci.lesson_id;

-- Fill missing course_id from lessons or modules
UPDATE public.lesson_content_items lci
SET course_id = COALESCE(
  lci.course_id,
  l.course_id,
  (
    SELECT m.course_id
    FROM public.modules m
    WHERE m.id = lci.module_id
  )
)
FROM public.lessons l
WHERE lci.course_id IS NULL
  AND l.id = lci.lesson_id;

-- ============================================================================
-- 2) NULL-safe get_pending_deletions()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_pending_deletions(p_course_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  course_id uuid,
  course_title text,
  entity_type text,
  entity_id uuid,
  entity_title text,
  deleted_at timestamp with time zone,
  coach_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  -- Modules
  SELECT m.course_id, c.title, 'module'::text, m.id, m.title, m.deleted_at, c.coach_id
  FROM public.modules m
  JOIN public.courses c ON c.id = m.course_id
  WHERE m.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR m.course_id = p_course_id)

  UNION ALL

  -- Lessons
  SELECT l.course_id, c.title, 'lesson'::text, l.id, l.title, l.deleted_at, c.coach_id
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  WHERE l.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR l.course_id = p_course_id)

  UNION ALL

  -- Module content items
  SELECT m.course_id,
         c.title,
         ('module_' || mci.content_type)::text,
         mci.id,
         COALESCE(mci.content_type || ' item', 'module content item'),
         mci.deleted_at,
         c.coach_id
  FROM public.module_content_items mci
  JOIN public.modules m ON m.id = mci.module_id
  JOIN public.courses c ON c.id = m.course_id
  WHERE mci.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR m.course_id = p_course_id)

  UNION ALL

  -- Lesson content items (NULL-safe course resolution)
  SELECT COALESCE(lci.course_id, l.course_id, m.course_id) AS course_id,
         c.title,
         ('lesson_' || lci.content_type)::text,
         lci.id,
         COALESCE(
           lci.metadata->>'title',
           lci.metadata->>'file_name',
           CASE WHEN lci.content_type = 'text' THEN 'Text content'
                WHEN lci.content_type = 'notes' THEN 'Notes'
                WHEN lci.content_type = 'video' THEN 'Video'
                WHEN lci.content_type = 'document' THEN 'Document'
                WHEN lci.content_type = 'quiz' THEN 'Quiz'
                ELSE 'Lesson content item'
           END
         ),
         lci.deleted_at,
         c.coach_id
  FROM public.lesson_content_items lci
  LEFT JOIN public.lessons l ON l.id = lci.lesson_id
  LEFT JOIN public.modules m ON m.id = lci.module_id
  JOIN public.courses c ON c.id = COALESCE(lci.course_id, l.course_id, m.course_id)
  WHERE lci.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR COALESCE(lci.course_id, l.course_id, m.course_id) = p_course_id)

  UNION ALL

  -- Quizzes via module content items
  SELECT m.course_id, c.title, 'quiz'::text, q.id, q.title, q.deleted_at, c.coach_id
  FROM public.quizzes q
  JOIN public.module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
  JOIN public.modules m ON m.id = mci.module_id
  JOIN public.courses c ON c.id = m.course_id
  WHERE q.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR m.course_id = p_course_id)

  UNION ALL

  -- Quizzes via lesson content items (NULL-safe)
  SELECT COALESCE(lci.course_id, l.course_id, m.course_id) AS course_id,
         c.title,
         'quiz'::text,
         q.id,
         q.title,
         q.deleted_at,
         c.coach_id
  FROM public.quizzes q
  JOIN public.lesson_content_items lci ON lci.content_id = q.id AND lci.content_type = 'quiz'
  LEFT JOIN public.lessons l ON l.id = lci.lesson_id
  LEFT JOIN public.modules m ON m.id = lci.module_id
  JOIN public.courses c ON c.id = COALESCE(lci.course_id, l.course_id, m.course_id)
  WHERE q.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR COALESCE(lci.course_id, l.course_id, m.course_id) = p_course_id);
END;
$function$;

-- ============================================================================
-- 3) NULL-safe admin_approve_deletion / admin_reject_deletion
-- ============================================================================

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

  SELECT ARRAY_AGG(m.id) INTO v_module_ids
  FROM public.modules m
  WHERE m.course_id = p_course_id
    AND m.content_status = 'pending_deletion';

  SELECT ARRAY_AGG(l.id) INTO v_lesson_ids
  FROM public.lessons l
  WHERE l.course_id = p_course_id
    AND l.content_status = 'pending_deletion';

  SELECT ARRAY_AGG(mci.id) INTO v_module_content_item_ids
  FROM public.module_content_items mci
  JOIN public.modules m ON m.id = mci.module_id
  WHERE m.course_id = p_course_id
    AND mci.content_status = 'pending_deletion';

  SELECT ARRAY_AGG(lci.id) INTO v_lesson_content_item_ids
  FROM public.lesson_content_items lci
  LEFT JOIN public.lessons l ON l.id = lci.lesson_id
  LEFT JOIN public.modules m ON m.id = lci.module_id
  WHERE lci.content_status = 'pending_deletion'
    AND COALESCE(lci.course_id, l.course_id, m.course_id) = p_course_id;

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
        LEFT JOIN public.lessons l ON l.id = lci.lesson_id
        LEFT JOIN public.modules m ON m.id = lci.module_id
        WHERE lci.content_id = q.id
          AND lci.content_type = 'quiz'
          AND COALESCE(lci.course_id, l.course_id, m.course_id) = p_course_id
      )
    );

  IF v_quiz_ids IS NOT NULL AND array_length(v_quiz_ids, 1) > 0 THEN
    SELECT ARRAY_AGG(qq.id) INTO v_quiz_question_ids
    FROM public.quiz_questions qq
    WHERE qq.quiz_id = ANY(v_quiz_ids);
  END IF;

  IF v_lesson_content_item_ids IS NOT NULL AND array_length(v_lesson_content_item_ids, 1) > 0 THEN
    DELETE FROM public.student_content_progress
    WHERE content_item_id = ANY(v_lesson_content_item_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % student_content_progress rows', v_count;
  END IF;

  IF v_quiz_ids IS NOT NULL AND array_length(v_quiz_ids, 1) > 0 THEN
    DELETE FROM public.quiz_feedback
    WHERE quiz_submission_id IN (
      SELECT qs.id FROM public.quiz_submissions qs WHERE qs.quiz_id = ANY(v_quiz_ids)
    );
    DELETE FROM public.quiz_submissions WHERE quiz_id = ANY(v_quiz_ids);
    DELETE FROM public.quiz_responses
    WHERE attempt_id IN (
      SELECT qa.id FROM public.quiz_attempts qa WHERE qa.quiz_id = ANY(v_quiz_ids)
    );
    DELETE FROM public.quiz_attempts WHERE quiz_id = ANY(v_quiz_ids);
  END IF;

  IF v_lesson_ids IS NOT NULL AND array_length(v_lesson_ids, 1) > 0 THEN
    DELETE FROM public.lesson_content_item_progress WHERE lesson_id = ANY(v_lesson_ids);
    DELETE FROM public.user_lesson_progress WHERE lesson_id = ANY(v_lesson_ids);
    DELETE FROM public.lesson_access_status WHERE lesson_id = ANY(v_lesson_ids);
  END IF;

  IF v_quiz_question_ids IS NOT NULL AND array_length(v_quiz_question_ids, 1) > 0 THEN
    DELETE FROM public.quiz_questions WHERE id = ANY(v_quiz_question_ids);
  END IF;

  IF v_lesson_content_item_ids IS NOT NULL AND array_length(v_lesson_content_item_ids, 1) > 0 THEN
    DELETE FROM public.lesson_content_items WHERE id = ANY(v_lesson_content_item_ids);
  END IF;

  IF v_quiz_ids IS NOT NULL AND array_length(v_quiz_ids, 1) > 0 THEN
    DELETE FROM public.quizzes WHERE id = ANY(v_quiz_ids);
  END IF;

  IF v_lesson_ids IS NOT NULL AND array_length(v_lesson_ids, 1) > 0 THEN
    DELETE FROM public.lessons WHERE id = ANY(v_lesson_ids);
  END IF;

  IF v_module_content_item_ids IS NOT NULL AND array_length(v_module_content_item_ids, 1) > 0 THEN
    DELETE FROM public.module_content_items WHERE id = ANY(v_module_content_item_ids);
  END IF;

  IF v_module_ids IS NOT NULL AND array_length(v_module_ids, 1) > 0 THEN
    DELETE FROM public.user_module_progress WHERE module_id = ANY(v_module_ids);
    DELETE FROM public.modules WHERE id = ANY(v_module_ids);
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.modules m WHERE m.course_id = p_course_id AND m.content_status IN ('pending_addition','pending_deletion')
    UNION ALL
    SELECT 1 FROM public.module_content_items mci JOIN public.modules m ON m.id = mci.module_id
    WHERE m.course_id = p_course_id AND mci.content_status IN ('pending_addition','pending_deletion')
    UNION ALL
    SELECT 1 FROM public.lessons l WHERE l.course_id = p_course_id AND l.content_status IN ('pending_addition','pending_deletion')
    UNION ALL
    SELECT 1
    FROM public.lesson_content_items lci
    LEFT JOIN public.lessons l ON l.id = lci.lesson_id
    LEFT JOIN public.modules m ON m.id = lci.module_id
    WHERE COALESCE(lci.course_id, l.course_id, m.course_id) = p_course_id
      AND lci.content_status IN ('pending_addition','pending_deletion')
  ) INTO v_has_remaining;

  IF NOT v_has_remaining THEN
    UPDATE public.courses
    SET pending_content = false,
        updated_at = timezone('utc'::text, NOW())
    WHERE id = p_course_id;
  END IF;

  PERFORM set_config('app.is_delete_action', 'false', false);

  RETURN jsonb_build_object('success', true, 'message', 'Deletion approved and content removed');
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_reject_deletion(p_course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_has_remaining boolean;
BEGIN
  PERFORM set_config('app.is_delete_action', 'true', false);

  UPDATE public.modules
  SET content_status = 'published', deleted_at = NULL, updated_at = timezone('utc'::text, NOW())
  WHERE course_id = p_course_id AND content_status = 'pending_deletion';

  UPDATE public.lessons
  SET content_status = 'published', deleted_at = NULL, updated_at = timezone('utc'::text, NOW())
  WHERE course_id = p_course_id AND content_status = 'pending_deletion';

  UPDATE public.module_content_items mci
  SET content_status = 'published', deleted_at = NULL, updated_at = timezone('utc'::text, NOW())
  WHERE mci.content_status = 'pending_deletion'
    AND EXISTS (SELECT 1 FROM public.modules m WHERE m.id = mci.module_id AND m.course_id = p_course_id);

  UPDATE public.lesson_content_items lci
  SET content_status = 'published', deleted_at = NULL, updated_at = timezone('utc'::text, NOW())
  WHERE lci.content_status = 'pending_deletion'
    AND (
      lci.course_id = p_course_id
      OR EXISTS (
        SELECT 1
        FROM public.lessons l
        WHERE l.id = lci.lesson_id
          AND l.course_id = p_course_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.modules m
        WHERE m.id = lci.module_id
          AND m.course_id = p_course_id
      )
    );

  UPDATE public.quizzes q
  SET content_status = 'published', deleted_at = NULL, updated_at = timezone('utc'::text, NOW())
  WHERE q.content_status = 'pending_deletion'
    AND (
      EXISTS (
        SELECT 1
        FROM public.module_content_items mci
        JOIN public.modules m ON m.id = mci.module_id
        WHERE mci.content_id = q.id AND mci.content_type = 'quiz' AND m.course_id = p_course_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.lesson_content_items lci
        LEFT JOIN public.lessons l ON l.id = lci.lesson_id
        LEFT JOIN public.modules m ON m.id = lci.module_id
        WHERE lci.content_id = q.id
          AND lci.content_type = 'quiz'
          AND COALESCE(lci.course_id, l.course_id, m.course_id) = p_course_id
      )
    );

  UPDATE public.quiz_questions qq
  SET deleted_at = NULL
  WHERE qq.deleted_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = qq.quiz_id AND q.content_status = 'published'
    );

  SELECT EXISTS (
    SELECT 1 FROM public.modules m WHERE m.course_id = p_course_id AND m.content_status IN ('pending_addition','pending_deletion')
    UNION ALL
    SELECT 1 FROM public.module_content_items mci JOIN public.modules m ON m.id = mci.module_id
    WHERE m.course_id = p_course_id AND mci.content_status IN ('pending_addition','pending_deletion')
    UNION ALL
    SELECT 1 FROM public.lessons l WHERE l.course_id = p_course_id AND l.content_status IN ('pending_addition','pending_deletion')
    UNION ALL
    SELECT 1
    FROM public.lesson_content_items lci
    LEFT JOIN public.lessons l ON l.id = lci.lesson_id
    LEFT JOIN public.modules m ON m.id = lci.module_id
    WHERE COALESCE(lci.course_id, l.course_id, m.course_id) = p_course_id
      AND lci.content_status IN ('pending_addition','pending_deletion')
  ) INTO v_has_remaining;

  IF NOT v_has_remaining THEN
    UPDATE public.courses
    SET pending_content = false,
        updated_at = timezone('utc'::text, NOW())
    WHERE id = p_course_id;
  END IF;

  PERFORM set_config('app.is_delete_action', 'false', false);

  RETURN jsonb_build_object('success', true, 'message', 'Deletion rejected, content restored to published');
END;
$function$;

COMMIT;

-- Quick verification output
SELECT 'null_link_lci' AS check_name, count(*) AS count_rows
FROM public.lesson_content_items
WHERE course_id IS NULL OR module_id IS NULL
UNION ALL
SELECT 'pending_lci', count(*)
FROM public.lesson_content_items
WHERE content_status = 'pending_deletion';
