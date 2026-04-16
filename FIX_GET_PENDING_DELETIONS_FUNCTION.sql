-- Fix get_pending_deletions() so admin moderation detects ALL deletion requests,
-- including lesson_content_items and quizzes linked either directly or inside lessons.
-- Run this in Supabase SQL Editor.

BEGIN;

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
  -- Modules pending deletion
  SELECT m.course_id, c.title, 'module'::text, m.id, m.title, m.deleted_at, c.coach_id
  FROM public.modules m
  JOIN public.courses c ON c.id = m.course_id
  WHERE m.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR m.course_id = p_course_id)

  UNION ALL

  -- Lessons pending deletion
  SELECT l.course_id, c.title, 'lesson'::text, l.id, l.title, l.deleted_at, c.coach_id
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  WHERE l.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR l.course_id = p_course_id)

  UNION ALL

  -- Module content items pending deletion
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

  -- Lesson content items pending deletion
  SELECT lci.course_id,
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
  JOIN public.courses c ON c.id = lci.course_id
  WHERE lci.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR lci.course_id = p_course_id)

  UNION ALL

  -- Quizzes pending deletion linked directly in module_content_items
  SELECT m.course_id, c.title, 'quiz'::text, q.id, q.title, q.deleted_at, c.coach_id
  FROM public.quizzes q
  JOIN public.module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
  JOIN public.modules m ON m.id = mci.module_id
  JOIN public.courses c ON c.id = m.course_id
  WHERE q.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR m.course_id = p_course_id)

  UNION ALL

  -- Quizzes pending deletion inside lesson_content_items
  SELECT lci.course_id, c.title, 'quiz'::text, q.id, q.title, q.deleted_at, c.coach_id
  FROM public.quizzes q
  JOIN public.lesson_content_items lci ON lci.content_id = q.id AND lci.content_type = 'quiz'
  JOIN public.courses c ON c.id = lci.course_id
  WHERE q.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR lci.course_id = p_course_id)

  UNION ALL

  -- Quiz questions pending deletion via any quiz linked to the course
  SELECT DISTINCT
         COALESCE(m.course_id, lci.course_id) AS course_id,
         c.title,
         'quiz_question'::text,
         qq.id,
         qq.question_text,
         qq.deleted_at,
         c.coach_id
  FROM public.quiz_questions qq
  JOIN public.quizzes q ON q.id = qq.quiz_id
  LEFT JOIN public.module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
  LEFT JOIN public.modules m ON m.id = mci.module_id
  LEFT JOIN public.lesson_content_items lci ON lci.content_id = q.id AND lci.content_type = 'quiz'
  JOIN public.courses c ON c.id = COALESCE(m.course_id, lci.course_id)
  WHERE qq.deleted_at IS NOT NULL
    AND (p_course_id IS NULL OR COALESCE(m.course_id, lci.course_id) = p_course_id);
END;
$function$;

COMMIT;

SELECT routine_schema, routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_pending_deletions';
