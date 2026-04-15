-- ============================================
-- SIMPLE DIAGNOSIS: Where is the "ceaaeac" quiz?
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Does the quiz even exist?
SELECT 
    q.id,
    q.title,
    q.requires_coach_approval,
    q.quiz_type,
    q.lesson_id,
    q.created_at
FROM quizzes q
WHERE q.title = 'ceaaeac';

-- STEP 2: If STEP 1 found it, use its ID to trace connections
-- Replace 'QUIZ_ID_FROM_STEP_1' with the actual UUID from STEP 1
/*
-- Check module_content_items
SELECT 'module_content_items' as found_in, *
FROM module_content_items
WHERE content_id = 'QUIZ_ID_FROM_STEP_1' AND content_type = 'quiz';

-- Check lesson_content_items
SELECT 'lesson_content_items' as found_in, *
FROM lesson_content_items
WHERE content_id = 'QUIZ_ID_FROM_STEP_1' AND content_type = 'quiz';
*/

-- STEP 3: Show ALL quizzes and where they're stored
SELECT 
    q.id,
    q.title,
    q.requires_coach_approval,
    q.quiz_type,
    CASE 
        WHEN mci.id IS NOT NULL THEN 'module_content_items (module: ' || m.title || ')'
        WHEN lci.id IS NOT NULL THEN 'lesson_content_items (lesson: ' || l.title || ')'
        ELSE '❌ NOT LINKED TO ANY COURSE!'
    END as location,
    c.id as course_id,
    c.title as course_title,
    c.coach_id
FROM quizzes q
LEFT JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
LEFT JOIN modules m ON m.id = mci.module_id
LEFT JOIN courses c ON c.id = m.course_id
LEFT JOIN lesson_content_items lci ON lci.content_id = q.id AND lci.content_type = 'quiz'
LEFT JOIN lessons l ON l.id = lci.lesson_id
WHERE q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed'
ORDER BY q.created_at DESC;

-- STEP 4: Check quiz_submissions without any joins
SELECT 
    qs.id,
    qs.user_id,
    qs.quiz_id,
    qs.quiz_attempt_id,
    qs.status,
    qs.submitted_at
FROM quiz_submissions qs
WHERE qs.status = 'pending_review'
ORDER BY qs.submitted_at DESC;

-- STEP 5: Match submissions to quizzes (no course filtering)
SELECT 
    qs.id as submission_id,
    qs.user_id,
    q.id as quiz_id,
    q.title as quiz_title,
    q.requires_coach_approval,
    q.quiz_type,
    q.lesson_id,
    qs.status
FROM quiz_submissions qs
JOIN quizzes q ON q.id = qs.quiz_id
WHERE qs.status = 'pending_review'
ORDER BY qs.submitted_at DESC;
