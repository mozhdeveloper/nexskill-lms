-- Fix lesson_content_items UPDATE RLS for soft-delete flow
-- Run this in Supabase SQL Editor

BEGIN;

ALTER TABLE public.lesson_content_items ENABLE ROW LEVEL SECURITY;

-- Remove conflicting update policies (old and new naming variants)
DROP POLICY IF EXISTS "Coaches can update their lesson content items" ON public.lesson_content_items;
DROP POLICY IF EXISTS "Coaches can update their content items" ON public.lesson_content_items;

-- Important: do NOT drop "coaches_manage_lesson_content_items" here.
-- In some environments that policy is FOR ALL and may back existing SELECT/INSERT/DELETE behavior.

-- Recreate a robust UPDATE policy that supports both legacy rows and new rows.
-- Some rows are linked by course_id, some only by module_id path.
CREATE POLICY "Coaches can update lesson content items for soft delete"
ON public.lesson_content_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.courses c
    WHERE c.id = lesson_content_items.course_id
      AND c.coach_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = lesson_content_items.module_id
      AND c.coach_id = auth.uid()
  )
)
WITH CHECK (
  (
    EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id = lesson_content_items.course_id
        AND c.coach_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = lesson_content_items.module_id
        AND c.coach_id = auth.uid()
    )
  )
  AND lesson_content_items.content_status IN ('draft', 'published', 'pending_addition', 'pending_deletion')
);

COMMIT;

-- Verify policy is present
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'lesson_content_items'
  AND cmd = 'UPDATE';
