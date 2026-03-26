-- Debug script to check quiz attempts and data integrity
-- Run this in your Supabase SQL Editor to diagnose the issue

-- 1. Check if quizzes exist in your course
SELECT 
    q.id AS quiz_id,
    q.title AS quiz_title,
    q.is_published,
    mci.module_id,
    mci.is_published AS item_published
FROM quizzes q
LEFT JOIN module_content_items mci ON q.id = mci.content_id AND mci.content_type = 'quiz'
WHERE q.is_published = true
ORDER BY q.created_at DESC;

-- 2. Check all quiz attempts (regardless of status)
SELECT 
    qa.id AS attempt_id,
    qa.quiz_id,
    q.title AS quiz_title,
    qa.user_id,
    p.first_name,
    p.last_name,
    qa.status,
    qa.score,
    qa.max_score,
    CASE 
        WHEN qa.max_score > 0 THEN ROUND((qa.score::numeric / qa.max_score::numeric) * 100, 2)
        ELSE 0 
    END AS score_percentage,
    qa.created_at
FROM quiz_attempts qa
LEFT JOIN quizzes q ON qa.quiz_id = q.id
LEFT JOIN profiles p ON qa.user_id = p.id
ORDER BY qa.created_at DESC;

-- 3. Check quiz responses
SELECT 
    qr.attempt_id,
    qa.quiz_id,
    q.title AS quiz_title,
    qr.question_id,
    qq.question_text,
    qr.points_earned,
    qr.points_possible,
    qr.is_correct
FROM quiz_responses qr
LEFT JOIN quiz_attempts qa ON qr.attempt_id = qa.id
LEFT JOIN quizzes q ON qa.quiz_id = q.id
LEFT JOIN quiz_questions qq ON qr.question_id = qq.id
ORDER BY qa.created_at DESC;

-- 4. Check enrollments for your course (replace with your course ID)
-- SELECT 
--     e.profile_id,
--     p.first_name,
--     p.last_name,
--     p.email,
--     e.enrolled_at,
--     e.course_id
-- FROM enrollments e
-- LEFT JOIN profiles p ON e.profile_id = p.id
-- WHERE e.course_id = 'YOUR_COURSE_ID_HERE'
-- ORDER BY e.enrolled_at DESC;

-- 5. Check module_content_items for your course (replace with your course ID)
-- SELECT 
--     mci.id,
--     mci.module_id,
--     m.content_title AS module_title,
--     mci.content_type,
--     mci.content_id,
--     mci.position,
--     mci.is_published
-- FROM module_content_items mci
-- LEFT JOIN modules m ON mci.module_id = m.id
-- WHERE m.course_id = 'YOUR_COURSE_ID_HERE'
-- AND mci.content_type = 'quiz'
-- ORDER BY m.position, mci.position;
