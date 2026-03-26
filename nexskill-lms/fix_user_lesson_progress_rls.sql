-- FIX: Add RLS policies for user_lesson_progress table
-- This allows students to track their progress and the system to update it

-- Enable RLS
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_lesson_progress;

-- Allow users to SELECT their own progress
CREATE POLICY "Users can view own progress"
ON public.user_lesson_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to INSERT their own progress
CREATE POLICY "Users can insert own progress"
ON public.user_lesson_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own progress
CREATE POLICY "Users can update own progress"
ON public.user_lesson_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow system/admin to manage all progress (for migrations/admin tools)
DROP POLICY IF EXISTS "Admins can manage all progress" ON public.user_lesson_progress;
CREATE POLICY "Admins can manage all progress"
ON public.user_lesson_progress
FOR ALL
TO authenticated
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'platform_owner')
)
WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'platform_owner')
);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_lesson_progress'
ORDER BY policyname;
