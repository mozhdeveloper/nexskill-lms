-- ============================================
-- CHECK: Is the coach looking at the right course?
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Verify the coach owns this course
-- The course_id should be: 472d0bb4-084e-4654-8718-5083b9f0acbf
SELECT 
    c.id as course_id,
    c.title as course_title,
    c.coach_id,
    p.email as coach_email,
    p.first_name,
    p.last_name
FROM courses c
JOIN profiles p ON p.id = c.coach_id
WHERE c.id = '472d0bb4-084e-4654-8718-5083b9f0acbf';

-- STEP 2: Check if the submissions are visible to the coach
-- This mimics what the frontend hook does
SELECT 
    qs.id as submission_id,
    qs.user_id as student_id,
    qs.quiz_id,
    qs.status,
    qs.submitted_at,
    q.title as quiz_title,
    c.id as course_id,
    c.title as course_title,
    c.coach_id
FROM quiz_submissions qs
JOIN quizzes q ON q.id = qs.quiz_id
JOIN lesson_content_items lci ON lci.content_id = q.id AND lci.content_type = 'quiz'
JOIN lessons l ON l.id = lci.lesson_id
JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
JOIN profiles p ON p.id = qs.user_id
WHERE c.id = '472d0bb4-084e-4654-8718-5083b9f0acbf'
  AND qs.status IN ('pending_review', 'failed', 'resubmission_required')
  AND q.title = 'ceaaeac'
ORDER BY qs.submitted_at DESC;

-- STEP 3: Check RLS policies on quiz_submissions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'quiz_submissions';

-- STEP 4: Check if there are any RLS policies blocking the coach
-- This tests if the coach can actually query the submissions
/*
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "YOUR_COACH_USER_ID"}';

SELECT 
    qs.id,
    qs.user_id,
    qs.quiz_id,
    qs.status
FROM quiz_submissions qs
WHERE qs.status = 'pending_review';
*/
