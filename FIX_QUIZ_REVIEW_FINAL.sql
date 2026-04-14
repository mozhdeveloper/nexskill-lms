-- ============================================
-- FIX: Quiz Review Not Showing - Complete Solution
-- Run this in your Supabase SQL Editor in order
-- ============================================

-- STEP 1: Check where your "ceaaeac" quiz is stored
-- This will tell us if it's in module_content_items or lesson_content_items
SELECT 
    'module_content_items' as location,
    mci.content_id as quiz_id,
    mci.module_id,
    mci.content_type,
    m.title as module_title,
    c.id as course_id,
    c.title as course_title,
    c.coach_id
FROM module_content_items mci
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
WHERE mci.content_type = 'quiz'
  AND c.coach_id = auth.uid() -- Your coach ID

UNION ALL

SELECT 
    'lesson_content_items' as location,
    lci.content_id as quiz_id,
    lci.lesson_id,
    lci.content_type,
    l.title as lesson_title,
    c.id as course_id,
    c.title as course_title,
    c.coach_id
FROM lesson_content_items lci
JOIN lessons l ON l.id = lci.lesson_id
JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
WHERE lci.content_type = 'quiz'
  AND c.coach_id = auth.uid(); -- Your coach ID

-- STEP 2: Update quiz_type to ensure consistency
UPDATE quizzes
SET 
    quiz_type = CASE 
        WHEN requires_coach_approval = true THEN 'coach_reviewed'
        ELSE 'standard'
    END,
    updated_at = NOW()
WHERE id IN (
    SELECT content_id FROM module_content_items WHERE content_type = 'quiz'
    UNION
    SELECT content_id FROM lesson_content_items WHERE content_type = 'quiz'
);

-- STEP 3: Verify the quiz type was set correctly
SELECT 
    q.id,
    q.title,
    q.requires_coach_approval,
    q.quiz_type
FROM quizzes q
WHERE q.title = 'ceaaeac';

-- STEP 4: Check if quiz_submissions exist for this quiz
SELECT 
    qs.id as submission_id,
    qs.user_id as student_id,
    q.title as quiz_title,
    qs.status,
    qs.submitted_at,
    p.email as student_email
FROM quiz_submissions qs
JOIN quizzes q ON q.id = qs.quiz_id
JOIN profiles p ON p.id = qs.user_id
WHERE q.title = 'ceaaeac'
ORDER BY qs.submitted_at DESC;

-- STEP 5: Find the exact course_id for this quiz
-- Copy this course_id for STEP 7
SELECT DISTINCT
    c.id as course_id,
    c.title as course_title,
    c.coach_id,
    q.title as quiz_title
FROM quizzes q
JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
WHERE q.title = 'ceaaeac';

-- STEP 6: If STEP 5 returned nothing, check lesson_content_items path
-- (quizzes inside lessons)
SELECT DISTINCT
    c.id as course_id,
    c.title as course_title,
    c.coach_id,
    q.title as quiz_title
FROM quizzes q
JOIN lesson_content_items lci ON lci.content_id = q.id AND lci.content_type = 'quiz'
JOIN lessons l ON l.id = lci.lesson_id
JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
WHERE q.title = 'ceaaeac';

-- STEP 7: Test if coach can see the submissions
-- REPLACE 'YOUR_COURSE_ID_HERE' with the course_id from STEP 5 or 6
/*
SELECT 
    qs.id as submission_id,
    qs.user_id as student_id,
    q.title as quiz_title,
    qs.status,
    qs.submitted_at,
    c.title as course_title,
    p.email as student_email
FROM quiz_submissions qs
JOIN quizzes q ON q.id = qs.quiz_id
JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
JOIN profiles p ON p.id = qs.user_id
WHERE c.id = 'YOUR_COURSE_ID_HERE'
  AND qs.status IN ('pending_review', 'failed', 'resubmission_required')
ORDER BY qs.submitted_at DESC;
*/

-- STEP 8: If STEP 7 returned nothing but STEP 4 showed submissions,
-- the quiz might be in lesson_content_items instead. Try this:
/*
SELECT 
    qs.id as submission_id,
    qs.user_id as student_id,
    q.title as quiz_title,
    qs.status,
    qs.submitted_at,
    c.title as course_title,
    p.email as student_email
FROM quiz_submissions qs
JOIN quizzes q ON q.id = qs.quiz_id
JOIN lesson_content_items lci ON lci.content_id = q.id AND lci.content_type = 'quiz'
JOIN lessons l ON l.id = lci.lesson_id
JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
JOIN profiles p ON p.id = qs.user_id
WHERE c.id = 'YOUR_COURSE_ID_HERE'
  AND qs.status IN ('pending_review', 'failed', 'resubmission_required')
ORDER BY qs.submitted_at DESC;
*/
