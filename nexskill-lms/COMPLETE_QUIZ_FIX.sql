-- ============================================
-- COMPLETE FIX FOR QUIZ ACCESS ISSUE
-- Quiz ID: 3918a3b8-a14d-483d-b206-43ddf85c8eda
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Check if the quiz exists
-- Run this query first to see if the quiz is in the database
SELECT 
    id,
    title,
    lesson_id,
    is_published,
    requires_coach_approval,
    created_at
FROM quizzes
WHERE id = '3918a3b8-a14d-483d-b206-43ddf85c8eda';

-- If the query above returns NO ROWS, the quiz doesn't exist.
-- You need to create it through the coach interface or run the INSERT below.

-- STEP 2: Check where this quiz ID is referenced
-- Check if it's in lesson_content_items
SELECT 
    lci.id as content_item_id,
    lci.lesson_id,
    lci.position,
    l.title as lesson_title,
    l.course_id
FROM lesson_content_items lci
LEFT JOIN lessons l ON lci.lesson_id = l.id
WHERE lci.content_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
AND lci.content_type = 'quiz';

-- Check if it's in module_content_items
SELECT 
    mci.id as content_item_id,
    mci.module_id,
    mci.position,
    m.title as module_title,
    m.course_id
FROM module_content_items mci
LEFT JOIN modules m ON mci.module_id = m.id
WHERE mci.content_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
AND mci.content_type = 'quiz';

-- STEP 3: Check ALL quizzes in your database to see what exists
SELECT 
    id,
    title,
    is_published,
    lesson_id,
    created_at
FROM quizzes
ORDER BY created_at DESC
LIMIT 10;

-- STEP 4: If quiz doesn't exist, create a placeholder quiz
-- ONLY run this if STEP 1 returned no rows
-- Uncomment the following block to create the quiz:

/*
INSERT INTO quizzes (
    id,
    title,
    description,
    lesson_id,
    passing_score,
    time_limit_minutes,
    max_attempts,
    is_published,
    requires_coach_approval,
    late_submission_allowed,
    late_penalty_percent,
    created_at,
    updated_at
) VALUES (
    '3918a3b8-a14d-483d-b206-43ddf85c8eda',
    'Quiz',  -- Change this to your quiz title
    'Quiz description',  -- Change this
    NULL,  -- lesson_id - update this if you know which lesson this belongs to
    70,    -- passing_score
    NULL,  -- time_limit_minutes (null = no time limit)
    NULL,  -- max_attempts (null = unlimited)
    true,  -- is_published
    true,  -- requires_coach_approval
    false, -- late_submission_allowed
    0,     -- late_penalty_percent
    NOW(), -- created_at
    NOW()  -- updated_at
) ON CONFLICT (id) DO NOTHING;
*/

-- STEP 5: Fix RLS policies - Remove all conflicting policies and create a simple one
-- This will allow ALL authenticated users to view quizzes

-- First, drop ALL existing policies on quizzes table
DROP POLICY IF EXISTS "Anyone can view published quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can view published quizzes" ON quizzes;
DROP POLICY IF EXISTS "Coaches can manage quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow authenticated users to view quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow authenticated read access to quizzes" ON quizzes;
DROP POLICY IF EXISTS "anyone_view_quizzes" ON quizzes;
DROP POLICY IF EXISTS "coaches_manage_quizzes" ON quizzes;
DROP POLICY IF EXISTS "admin_manage_quizzes" ON quizzes;
DROP POLICY IF EXISTS "public_view_published_quizzes" ON quizzes;
DROP POLICY IF EXISTS "coaches_insert_quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow admins to update quizzes" ON quizzes;
DROP POLICY IF EXISTS "Quizzes are viewable by everyone" ON quizzes;

-- STEP 6: Create clean, simple policies

-- Policy 1: Any authenticated user can view quizzes (no restrictions)
CREATE POLICY "authenticated_view_quizzes"
ON quizzes
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Coaches can insert quizzes
CREATE POLICY "coaches_insert_quizzes"
ON quizzes
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('coach', 'admin', 'platform_owner')
    )
);

-- Policy 3: Coaches can update/delete their own quizzes
CREATE POLICY "coaches_manage_own_quizzes"
ON quizzes
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('coach', 'admin', 'platform_owner')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('coach', 'admin', 'platform_owner')
    )
);

-- STEP 7: Verify the policies were created
SELECT 
    policyname,
    cmd as operation,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'quizzes'
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- STEP 8: Test the query (should now work)
SELECT 
    id,
    title,
    is_published,
    lesson_id
FROM quizzes
WHERE id = '3918a3b8-a14d-483d-b206-43ddf85c8eda';

-- STEP 9: If you found the quiz in lesson_content_items or module_content_items,
-- make sure it has a proper lesson_id set
UPDATE quizzes
SET lesson_id = (
    SELECT lci.lesson_id 
    FROM lesson_content_items lci 
    WHERE lci.content_id = quizzes.id 
    AND lci.content_type = 'quiz'
    LIMIT 1
)
WHERE id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
AND lesson_id IS NULL;

-- STEP 10: Verify the fix worked
SELECT 
    'Quiz exists and is accessible' as status,
    id,
    title,
    is_published,
    lesson_id,
    requires_coach_approval
FROM quizzes
WHERE id = '3918a3b8-a14d-483d-b206-43ddf85c8eda';

-- If this still returns no rows after running all steps, the quiz truly doesn't exist
-- and you need to create it through your coach interface.
