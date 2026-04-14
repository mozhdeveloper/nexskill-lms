-- ============================================
-- TRACE: Find where the link is broken
-- Run this in Supabase SQL Editor
-- ============================================

-- We know:
-- Quiz ID: bcd97a6b-219c-424a-b133-4c983a2014f6
-- Lesson ID: 5a31d53c-62df-4f4e-b9fc-30c28d77a3e5
-- Module ID: 765c8631-b200-43ed-8fb1-5aa7c0ec84fc
-- Course ID: 472d0bb4-084e-4654-8718-5083b9f0acbf

-- STEP 1: Verify the lesson -> module -> course path
SELECT 
    l.id as lesson_id,
    l.title as lesson_title,
    mci.module_id,
    m.title as module_title,
    m.course_id,
    c.title as course_title,
    c.coach_id
FROM lessons l
JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
WHERE l.id = '5a31d53c-62df-4f4e-b9fc-30c28d77a3e5';

-- STEP 2: Verify the quiz is in lesson_content_items for this lesson
SELECT 
    lci.lesson_id,
    lci.content_id as quiz_id,
    q.title as quiz_title
FROM lesson_content_items lci
JOIN quizzes q ON q.id = lci.content_id
WHERE lci.lesson_id = '5a31d53c-62df-4f4e-b9fc-30c28d77a3e5'
  AND lci.content_type = 'quiz';

-- STEP 3: Check if the submission's quiz_attempt links correctly
SELECT 
    qs.id as submission_id,
    qs.quiz_id,
    qs.quiz_attempt_id,
    qa.id as attempt_id,
    qa.quiz_id as attempt_quiz_id,
    qa.user_id,
    qa.status as attempt_status
FROM quiz_submissions qs
LEFT JOIN quiz_attempts qa ON qa.id = qs.quiz_attempt_id
WHERE qs.quiz_id = 'bcd97a6b-219c-424a-b133-4c983a2014f6';

-- STEP 4: Full trace from submission to course (the exact path the hook uses)
SELECT 
    'submission' as step,
    qs.id as id,
    qs.quiz_id,
    NULL::uuid as attempt_id,
    NULL::uuid as lesson_id,
    NULL::uuid as module_id,
    NULL::uuid as course_id
FROM quiz_submissions qs
WHERE qs.quiz_id = 'bcd97a6b-219c-424a-b133-4c983a2014f6'

UNION ALL

SELECT 
    'quiz' as step,
    q.id,
    q.id,
    NULL,
    q.lesson_id,
    NULL,
    NULL
FROM quizzes q
WHERE q.id = 'bcd97a6b-219c-424a-b133-4c983a2014f6'

UNION ALL

SELECT 
    'lesson_content_items' as step,
    lci.id,
    lci.content_id,
    NULL,
    lci.lesson_id,
    NULL,
    NULL
FROM lesson_content_items lci
WHERE lci.content_id = 'bcd97a6b-219c-424a-b133-4c983a2014f6'
  AND lci.content_type = 'quiz'

UNION ALL

SELECT 
    'module_content_items' as step,
    mci.id,
    mci.content_id,
    NULL,
    NULL,
    mci.module_id,
    NULL
FROM module_content_items mci
WHERE mci.content_id = '5a31d53c-62df-4f4e-b9fc-30c28d77a3e5'
  AND mci.content_type = 'lesson'

UNION ALL

SELECT 
    'module' as step,
    m.id,
    NULL,
    NULL,
    NULL,
    m.id,
    m.course_id
FROM modules m
WHERE m.id = '765c8631-b200-43ed-8fb1-5aa7c0ec84fc';
