-- Resync courses.pending_content for courses that still have pending additions/deletions.
-- Use this if a course disappeared from the admin moderation queue even though rows are still pending.
-- Run this in Supabase SQL Editor.

BEGIN;

UPDATE public.courses c
SET pending_content = EXISTS (
  SELECT 1
  FROM public.modules m
  WHERE m.course_id = c.id
    AND m.content_status IN ('pending_addition', 'pending_deletion')
  UNION ALL
  SELECT 1
  FROM public.module_content_items mci
  JOIN public.modules m ON m.id = mci.module_id
  WHERE m.course_id = c.id
    AND mci.content_status IN ('pending_addition', 'pending_deletion')
  UNION ALL
  SELECT 1
  FROM public.lessons l
  WHERE l.course_id = c.id
    AND l.content_status IN ('pending_addition', 'pending_deletion')
  UNION ALL
  SELECT 1
  FROM public.lesson_content_items lci
  WHERE lci.course_id = c.id
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
          AND m.course_id = c.id
      )
      OR EXISTS (
        SELECT 1
        FROM public.lesson_content_items lci
        WHERE lci.content_id = q.id
          AND lci.content_type = 'quiz'
          AND lci.course_id = c.id
      )
    )
),
updated_at = timezone('utc'::text, NOW())
WHERE c.verification_status = 'approved';

COMMIT;

SELECT id, title, verification_status, pending_content
FROM public.courses
WHERE verification_status = 'approved'
ORDER BY updated_at DESC
LIMIT 50;
