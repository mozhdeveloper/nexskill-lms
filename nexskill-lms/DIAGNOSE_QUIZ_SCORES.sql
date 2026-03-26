-- DIAGNOSTIC QUERY FOR QUIZ SCORES
-- Run this in Supabase SQL Editor to debug why scores aren't showing
-- Replace 'YOUR_COURSE_ID_HERE' with your actual course ID

-- Step 1: Check if course exists and get its details
SELECT 
    id,
    title,
    is_published,
    verification_status,
    visibility
FROM courses
WHERE id = 'YOUR_COURSE_ID_HERE';

-- Step 2: Check modules for this course
SELECT 
    m.id as module_id,
    m.title as module_title,
    m.position,
    m.is_published
FROM modules m
WHERE m.course_id = 'YOUR_COURSE_ID_HERE'
ORDER BY m.position;

-- Step 3: Check quiz content items linked to modules
SELECT 
    mci.id as content_item_id,
    mci.module_id,
    mci.content_type,
    mci.content_id as quiz_id,
    mci.is_published,
    mci.position,
    q.title as quiz_title,
    q.is_published as quiz_published
FROM module_content_items mci
LEFT JOIN quizzes q ON mci.content_id = q.id
INNER JOIN modules m ON mci.module_id = m.id
WHERE m.course_id = 'YOUR_COURSE_ID_HERE'
AND mci.content_type = 'quiz';

-- Step 4: Check enrollments for this course
SELECT 
    e.id as enrollment_id,
    e.profile_id,
    e.enrolled_at,
    p.first_name,
    p.last_name,
    p.email
FROM enrollments e
LEFT JOIN profiles p ON e.profile_id = p.id
WHERE e.course_id = 'YOUR_COURSE_ID_HERE';

-- Step 5: Check quiz attempts for enrolled students
SELECT 
    qa.id as attempt_id,
    qa.quiz_id,
    qa.user_id,
    qa.score,
    qa.max_score,
    qa.status,
    qa.created_at,
    q.title as quiz_title,
    p.first_name,
    p.last_name
FROM quiz_attempts qa
LEFT JOIN quizzes q ON qa.quiz_id = q.id
LEFT JOIN profiles p ON qa.user_id = p.id
WHERE qa.quiz_id IN (
    SELECT mci.content_id 
    FROM module_content_items mci
    INNER JOIN modules m ON mci.module_id = m.id
    WHERE m.course_id = 'YOUR_COURSE_ID_HERE'
    AND mci.content_type = 'quiz'
)
AND qa.user_id IN (
    SELECT e.profile_id
    FROM enrollments e
    WHERE e.course_id = 'YOUR_COURSE_ID_HERE'
);

-- Step 6: Check quiz responses
SELECT 
    qr.id as response_id,
    qr.attempt_id,
    qr.question_id,
    qr.points_earned,
    qr.points_possible,
    qr.is_correct,
    qa.quiz_id,
    qa.user_id,
    qa.status
FROM quiz_responses qr
INNER JOIN quiz_attempts qa ON qr.attempt_id = qa.id
WHERE qa.quiz_id IN (
    SELECT mci.content_id 
    FROM module_content_items mci
    INNER JOIN modules m ON mci.module_id = m.id
    WHERE m.course_id = 'YOUR_COURSE_ID_HERE'
    AND mci.content_type = 'quiz'
);

-- Step 7: Summary - Count everything
SELECT 
    'Course' as entity,
    COUNT(*) as count
FROM courses WHERE id = 'YOUR_COURSE_ID_HERE'
UNION ALL
SELECT 
    'Modules',
    COUNT(*)
FROM modules WHERE course_id = 'YOUR_COURSE_ID_HERE'
UNION ALL
SELECT 
    'Quizzes (in modules)',
    COUNT(*)
FROM module_content_items mci
INNER JOIN modules m ON mci.module_id = m.id
WHERE m.course_id = 'YOUR_COURSE_ID_HERE' AND mci.content_type = 'quiz'
UNION ALL
SELECT 
    'Enrolled Students',
    COUNT(*)
FROM enrollments WHERE course_id = 'YOUR_COURSE_ID_HERE'
UNION ALL
SELECT 
    'Quiz Attempts (enrolled students)',
    COUNT(*)
FROM quiz_attempts qa
WHERE qa.quiz_id IN (
    SELECT mci.content_id 
    FROM module_content_items mci
    INNER JOIN modules m ON mci.module_id = m.id
    WHERE m.course_id = 'YOUR_COURSE_ID_HERE'
    AND mci.content_type = 'quiz'
)
AND qa.user_id IN (
    SELECT e.profile_id
    FROM enrollments e
    WHERE e.course_id = 'YOUR_COURSE_ID_HERE'
)
UNION ALL
SELECT 
    'Quiz Responses',
    COUNT(*)
FROM quiz_responses qr
INNER JOIN quiz_attempts qa ON qr.attempt_id = qa.id
WHERE qa.quiz_id IN (
    SELECT mci.content_id 
    FROM module_content_items mci
    INNER JOIN modules m ON mci.module_id = m.id
    WHERE m.course_id = 'YOUR_COURSE_ID_HERE'
    AND mci.content_type = 'quiz'
);

-- Step 8: Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual IS NOT NULL as has_qual,
    with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE tablename IN ('quiz_attempts', 'quiz_responses', 'quizzes', 'module_content_items')
ORDER BY tablename, policyname;
