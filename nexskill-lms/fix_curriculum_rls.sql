-- FIX: Add RLS policies for curriculum tables
-- Run this in Supabase SQL Editor

-- Enable RLS on these tables if not already enabled
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to published courses" ON public.courses;
DROP POLICY IF EXISTS "Allow read access to published modules" ON public.modules;
DROP POLICY IF EXISTS "Allow read access to module content items" ON public.module_content_items;
DROP POLICY IF EXISTS "Allow read access to published lessons" ON public.lessons;
DROP POLICY IF EXISTS "Allow read access to published quizzes" ON public.quizzes;

-- Create new policies - Allow authenticated users to read published content

-- Courses: Allow anyone to read published/verified courses
CREATE POLICY "Allow authenticated read access to courses"
ON public.courses
FOR SELECT
TO authenticated
USING (true);

-- Modules: Allow read access to modules for published courses
CREATE POLICY "Allow authenticated read access to modules"
ON public.modules
FOR SELECT
TO authenticated
USING (true);

-- Module Content Items: Allow read access
CREATE POLICY "Allow authenticated read access to module content items"
ON public.module_content_items
FOR SELECT
TO authenticated
USING (true);

-- Lessons: Allow read access to published lessons
CREATE POLICY "Allow authenticated read access to lessons"
ON public.lessons
FOR SELECT
TO authenticated
USING (true);

-- Quizzes: Allow read access to published quizzes
CREATE POLICY "Allow authenticated read access to quizzes"
ON public.quizzes
FOR SELECT
TO authenticated
USING (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('courses', 'modules', 'module_content_items', 'lessons', 'quizzes')
ORDER BY tablename, policyname;
