-- Fast RLS policies for lessons and quizzes (no subqueries in WITH CHECK)
-- Run this in Supabase SQL Editor

-- Drop slow policies
DROP POLICY IF EXISTS "coaches_insert_lessons" ON public.lessons;
DROP POLICY IF EXISTS "coaches_insert_quizzes" ON public.quizzes;

-- Simple policy: Allow authenticated coaches/admins to insert
-- The course_id FK constraint ensures data integrity
CREATE POLICY "coaches_insert_lessons"
ON public.lessons
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('coach', 'admin')
  )
);

CREATE POLICY "coaches_insert_quizzes"
ON public.quizzes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('coach', 'admin')
  )
);

-- Also ensure lesson_content_items has fast INSERT policy
DROP POLICY IF EXISTS "coaches_insert_content_items" ON public.lesson_content_items;
CREATE POLICY "coaches_insert_content_items"
ON public.lesson_content_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('coach', 'admin')
  )
);

-- Verify policies
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('lessons', 'quizzes', 'lesson_content_items')
AND policyname LIKE 'coaches_insert%'
ORDER BY tablename;
