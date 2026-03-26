-- FIX: Allow admins to update quizzes, modules, lessons (for course approval)
-- Run this in Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_content_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins to update quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Allow admins to update modules" ON public.modules;
DROP POLICY IF EXISTS "Allow admins to update lessons" ON public.lessons;
DROP POLICY IF EXISTS "Allow admins to update module_content_items" ON public.module_content_items;

-- Allow admins to update quizzes
CREATE POLICY "Allow admins to update quizzes"
ON public.quizzes
FOR UPDATE
TO authenticated
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'platform_owner')
)
WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'platform_owner')
);

-- Allow admins to update modules
CREATE POLICY "Allow admins to update modules"
ON public.modules
FOR UPDATE
TO authenticated
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'platform_owner')
)
WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'platform_owner')
);

-- Allow admins to update lessons
CREATE POLICY "Allow admins to update lessons"
ON public.lessons
FOR UPDATE
TO authenticated
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'platform_owner')
)
WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'platform_owner')
);

-- Allow admins to update module_content_items
CREATE POLICY "Allow admins to update module_content_items"
ON public.module_content_items
FOR UPDATE
TO authenticated
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'platform_owner')
)
WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'platform_owner')
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('quizzes', 'modules', 'lessons', 'module_content_items')
AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;
