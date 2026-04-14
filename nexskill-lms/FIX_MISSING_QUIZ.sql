-- ============================================
-- FIX: Create Missing Quiz from Content Item
-- Quiz ID: 3918a3b8-a14d-483d-b206-43ddf85c8eda
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Check if the content item exists but quiz doesn't
SELECT 
    lci.id as content_item_id,
    lci.content_id as quiz_id,
    lci.lesson_id,
    lci.course_id,
    lci.module_id,
    lci.metadata,
    lci.position,
    lci.is_published,
    lci.created_at,
    l.title as lesson_title,
    c.title as course_title,
    -- Check if quiz exists
    CASE 
        WHEN q.id IS NOT NULL THEN 'Quiz EXISTS'
        ELSE 'Quiz MISSING'
    END as quiz_status
FROM lesson_content_items lci
LEFT JOIN lessons l ON lci.lesson_id = l.id
LEFT JOIN courses c ON lci.course_id = c.id
LEFT JOIN quizzes q ON lci.content_id = q.id
WHERE lci.content_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
AND lci.content_type = 'quiz';

-- STEP 2: Check module_content_items as well
SELECT 
    mci.id as content_item_id,
    mci.content_id as quiz_id,
    mci.module_id,
    mci.position,
    m.title as module_title,
    c.title as course_title,
    -- Check if quiz exists
    CASE 
        WHEN q.id IS NOT NULL THEN 'Quiz EXISTS'
        ELSE 'Quiz MISSING'
    END as quiz_status
FROM module_content_items mci
LEFT JOIN modules m ON mci.module_id = m.id
LEFT JOIN courses c ON m.course_id = c.id
LEFT JOIN quizzes q ON mci.content_id = q.id
WHERE mci.content_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
AND mci.content_type = 'quiz';

-- STEP 3: Find ALL orphaned content items (quiz type but no quiz row)
SELECT 
    lci.id as content_item_id,
    lci.content_id as quiz_id,
    lci.lesson_id,
    lci.course_id,
    lci.metadata,
    l.title as lesson_title,
    c.title as course_title,
    lci.created_at
FROM lesson_content_items lci
LEFT JOIN quizzes q ON lci.content_id = q.id
LEFT JOIN lessons l ON lci.lesson_id = l.id
LEFT JOIN courses c ON lci.course_id = c.id
WHERE lci.content_type = 'quiz'
AND q.id IS NULL
ORDER BY lci.created_at DESC;

-- STEP 4: Create the missing quiz
-- This will create the quiz with the same ID as the content_item references
-- Only run this if STEP 1 showed "Quiz MISSING"

INSERT INTO quizzes (
    id,
    title,
    description,
    instructions,
    lesson_id,
    passing_score,
    time_limit_minutes,
    max_attempts,
    is_published,
    requires_coach_approval,
    requires_manual_grading,
    late_submission_allowed,
    late_penalty_percent,
    created_at,
    updated_at
)
SELECT 
    lci.content_id,  -- Use the content_id as the quiz ID
    COALESCE(lci.metadata->>'title', 'Quiz') as title,
    '' as description,
    '' as instructions,
    lci.lesson_id,
    70 as passing_score,
    NULL as time_limit_minutes,  -- No time limit by default
    NULL as max_attempts,  -- Unlimited attempts by default
    lci.is_published,  -- Match the content item's published status
    true as requires_coach_approval,
    false as requires_manual_grading,
    false as late_submission_allowed,
    0 as late_penalty_percent,
    lci.created_at,
    NOW() as updated_at
FROM lesson_content_items lci
WHERE lci.content_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
AND lci.content_type = 'quiz'
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    lesson_id = EXCLUDED.lesson_id,
    updated_at = NOW()
RETURNING id, title, lesson_id, is_published;

-- STEP 5: If quiz was in module_content_items instead, create it
INSERT INTO quizzes (
    id,
    title,
    description,
    instructions,
    lesson_id,
    passing_score,
    time_limit_minutes,
    max_attempts,
    is_published,
    requires_coach_approval,
    requires_manual_grading,
    late_submission_allowed,
    late_penalty_percent,
    created_at,
    updated_at
)
SELECT 
    mci.content_id,  -- Use the content_id as the quiz ID
    COALESCE(mci.metadata->>'title', 'Quiz') as title,
    '' as description,
    '' as instructions,
    NULL as lesson_id,  -- Module-based quizzes don't have lesson_id
    70 as passing_score,
    NULL as time_limit_minutes,
    NULL as max_attempts,
    true as is_published,
    true as requires_coach_approval,
    false as requires_manual_grading,
    false as late_submission_allowed,
    0 as late_penalty_percent,
    mci.created_at,
    NOW() as updated_at
FROM module_content_items mci
WHERE mci.content_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
AND mci.content_type = 'quiz'
AND NOT EXISTS (SELECT 1 FROM quizzes WHERE id = mci.content_id)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    updated_at = NOW()
RETURNING id, title, lesson_id, is_published;

-- STEP 6: Verify the quiz now exists
SELECT 
    'Quiz successfully created/found' as status,
    q.id,
    q.title,
    q.lesson_id,
    q.is_published,
    q.requires_coach_approval,
    q.created_at,
    -- Show associated content items
    (
        SELECT COUNT(*)
        FROM lesson_content_items lci
        WHERE lci.content_id = q.id
        AND lci.content_type = 'quiz'
    ) as lesson_content_items,
    (
        SELECT COUNT(*)
        FROM module_content_items mci
        WHERE mci.content_id = q.id
        AND mci.content_type = 'quiz'
    ) as module_content_items
FROM quizzes q
WHERE q.id = '3918a3b8-a14d-483d-b206-43ddf85c8eda';

-- STEP 7: Check if the quiz has questions
SELECT 
    q.id as quiz_id,
    q.title,
    COUNT(qq.id) as question_count,
    COUNT(qq.id) = 0 as has_no_questions
FROM quizzes q
LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
WHERE q.id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
GROUP BY q.id, q.title;

-- STEP 8: If quiz has no questions, you'll need to add them via the coach interface
-- This query just shows you the status
SELECT 
    CASE 
        WHEN COUNT(qq.id) = 0 THEN 
            '⚠️ Quiz has NO questions - Add questions through Coach Quiz Editor'
        ELSE 
            '✅ Quiz has ' || COUNT(qq.id) || ' questions'
    END as question_status
FROM quiz_questions qq
WHERE qq.quiz_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda';

-- STEP 9: Fix RLS policies (ensure authenticated users can view)
-- Drop old conflicting policies
DROP POLICY IF EXISTS "authenticated_view_quizzes" ON quizzes;
DROP POLICY IF EXISTS "coaches_insert_quizzes" ON quizzes;
DROP POLICY IF EXISTS "coaches_manage_own_quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow authenticated users to view quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow authenticated read access to quizzes" ON quizzes;
DROP POLICY IF EXISTS "anyone_view_quizzes" ON quizzes;
DROP POLICY IF EXISTS "coaches_manage_quizzes" ON quizzes;
DROP POLICY IF EXISTS "admin_manage_quizzes" ON quizzes;
DROP POLICY IF EXISTS "public_view_published_quizzes" ON quizzes;
DROP POLICY IF EXISTS "Quizzes are viewable by everyone" ON quizzes;

-- Create clean policies
-- 1. Anyone authenticated can view quizzes
CREATE POLICY "authenticated_view_quizzes"
ON quizzes
FOR SELECT
TO authenticated
USING (true);

-- 2. Coaches/admins can insert
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

-- 3. Coaches/admins can update/delete
CREATE POLICY "coaches_manage_quizzes"
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

-- STEP 10: Final verification
SELECT 
    '✅ COMPLETE - Quiz is ready' as final_status,
    q.id,
    q.title,
    q.is_published,
    q.lesson_id,
    COUNT(DISTINCT qq.id) as question_count,
    COUNT(DISTINCT qq.id) > 0 as has_questions
FROM quizzes q
LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
WHERE q.id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
GROUP BY q.id, q.title, q.is_published, q.lesson_id;
