-- Fix script for Quiz access issues
-- This script ensures proper RLS policies for the quizzes table

-- 1. Ensure RLS is enabled on quizzes table
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can view published quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can view published quizzes" ON quizzes;
DROP POLICY IF EXISTS "Coaches can manage quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow authenticated users to view quizzes" ON quizzes;

-- 3. Create policy for authenticated users to view quizzes
-- This allows any logged-in user to view quizzes
CREATE POLICY "Allow authenticated users to view quizzes"
ON quizzes
FOR SELECT
TO authenticated
USING (true);

-- 4. If you want to restrict to only published quizzes, use this instead:
-- CREATE POLICY "Users can view published quizzes"
-- ON quizzes
-- FOR SELECT
-- TO authenticated
-- USING (is_published = true);

-- 5. Ensure coaches/admins can insert/update/delete quizzes
-- (You may already have this policy)
CREATE POLICY "Coaches can manage quizzes"
ON quizzes
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'coach'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'coach'
    )
);

-- 6. Verify the policies were created
SELECT 
    policyname,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'quizzes'
AND schemaname = 'public';

-- 7. Test: Try to query the quiz (run this after applying policies)
-- SELECT * FROM quizzes WHERE id = '3918a3b8-a14d-483d-b206-43ddf85c8eda';
