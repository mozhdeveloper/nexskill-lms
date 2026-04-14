-- Diagnostic script for Quiz ID: 3918a3b8-a14d-483d-b206-43ddf85c8eda
-- Run this in Supabase SQL Editor to find the quiz

-- 1. Check if the quiz exists in the database
SELECT 
    id,
    title,
    lesson_id,
    is_published,
    created_at,
    passing_score,
    max_attempts,
    requires_coach_approval
FROM quizzes
WHERE id = '3918a3b8-a14d-483d-b206-43ddf85c8eda';

-- 2. If quiz doesn't exist, check if it exists in module_content_items
SELECT 
    mci.id,
    mci.module_id,
    mci.content_id,
    mci.content_type,
    mci.position,
    m.course_id
FROM module_content_items mci
LEFT JOIN modules m ON mci.module_id = m.id
WHERE mci.content_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
AND mci.content_type = 'quiz';

-- 3. Check if the quiz exists in lesson_content_items
SELECT 
    lci.id,
    lci.lesson_id,
    lci.content_id,
    lci.content_type,
    lci.position,
    l.course_id
FROM lesson_content_items lci
LEFT JOIN lessons l ON lci.lesson_id = l.id
WHERE lci.content_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
AND lci.content_type = 'quiz';

-- 4. Check all quizzes in the database to see what IDs exist
SELECT 
    id,
    title,
    lesson_id,
    is_published,
    created_at
FROM quizzes
ORDER BY created_at DESC
LIMIT 20;

-- 5. Check RLS policies for quizzes table
SELECT
    policyname,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'quizzes'
AND schemaname = 'public';

-- 6. If you found the quiz in step 1, check its questions
SELECT 
    qq.id,
    qq.question_type,
    qq.position,
    qq.points,
    qq.quiz_id
FROM quiz_questions qq
WHERE qq.quiz_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
ORDER BY qq.position;

-- 7. Check if there are any attempts for this quiz
SELECT 
    qa.id,
    qa.user_id,
    qa.attempt_number,
    qa.status,
    qa.score,
    qa.max_score,
    qa.passed,
    qa.started_at,
    qa.submitted_at
FROM quiz_attempts qa
WHERE qa.quiz_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
ORDER BY qa.started_at DESC
LIMIT 10;
