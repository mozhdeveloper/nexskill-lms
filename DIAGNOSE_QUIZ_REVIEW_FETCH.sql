-- ============================================
-- DIAGNOSTIC SCRIPT: Quiz Review Not Appearing
-- Run this in your Supabase SQL Editor
-- ============================================

-- STEP 1: Check if quiz has coach review enabled
SELECT 
    id,
    title,
    requires_coach_approval,
    quiz_type,
    lesson_id,
    created_at,
    updated_at
FROM quizzes
WHERE requires_coach_approval = true OR quiz_type = 'coach_reviewed'
ORDER BY updated_at DESC
LIMIT 10;

-- STEP 2: Check if student has attempted the quiz
SELECT 
    qa.id as attempt_id,
    qa.quiz_id,
    qa.user_id,
    qa.score,
    qa.max_score,
    qa.status,
    qa.submitted_at,
    q.title as quiz_title,
    q.requires_coach_approval,
    q.quiz_type
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
WHERE qa.status = 'submitted'
ORDER BY qa.submitted_at DESC
LIMIT 10;

-- STEP 3: Check if quiz_submissions were created
SELECT 
    qs.id as submission_id,
    qs.user_id,
    qs.quiz_id,
    qs.quiz_attempt_id,
    qs.status,
    qs.submitted_at,
    qs.reviewed_at,
    qs.review_notes,
    q.title as quiz_title,
    q.requires_coach_approval,
    q.quiz_type
FROM quiz_submissions qs
JOIN quizzes q ON q.id = qs.quiz_id
ORDER BY qs.submitted_at DESC
LIMIT 10;

-- STEP 4: Find missing submissions (attempts without submissions)
SELECT 
    qa.id as attempt_id,
    qa.user_id,
    qa.quiz_id,
    qa.status as attempt_status,
    q.title as quiz_title,
    q.requires_coach_approval,
    q.quiz_type,
    CASE 
        WHEN qs.id IS NULL THEN 'MISSING SUBMISSION'
        ELSE 'HAS SUBMISSION'
    END as submission_status
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
LEFT JOIN quiz_submissions qs ON qs.quiz_attempt_id = qa.id
WHERE qa.status = 'submitted'
  AND (q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed')
ORDER BY qa.submitted_at DESC;

-- STEP 5: Check if trigger exists and is active
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%quiz_submission%'
   OR trigger_name LIKE '%create_quiz_submission%';

-- STEP 6: Check which courses the quizzes belong to
SELECT 
    c.id as course_id,
    c.title as course_title,
    c.coach_id,
    m.id as module_id,
    m.title as module_title,
    mci.content_id as quiz_id,
    q.title as quiz_title,
    q.requires_coach_approval,
    q.quiz_type
FROM module_content_items mci
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
JOIN quizzes q ON q.id = mci.content_id
WHERE mci.content_type = 'quiz'
  AND (q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed')
ORDER BY c.created_at DESC;

-- STEP 7: Check RLS policy for a specific coach (replace with actual coach user_id)
-- Uncomment and replace 'YOUR_COACH_USER_ID' to test
/*
SELECT 
    qs.id as submission_id,
    qs.user_id as student_id,
    qs.status,
    q.title as quiz_title,
    c.title as course_title,
    c.coach_id
FROM quiz_submissions qs
JOIN quizzes q ON q.id = qs.quiz_id
JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
WHERE c.coach_id = 'YOUR_COACH_USER_ID'
ORDER BY qs.submitted_at DESC;
*/

-- STEP 8: Fix missing quiz_type for existing quizzes (if needed)
-- This updates any quiz that has requires_coach_approval=true but quiz_type is NULL or 'standard'
/*
UPDATE quizzes
SET quiz_type = 'coach_reviewed'
WHERE requires_coach_approval = true 
  AND (quiz_type IS NULL OR quiz_type != 'coach_reviewed');
*/

-- STEP 9: Recreate the trigger if it's missing or broken
/*
-- Run this if the trigger check in STEP 5 shows no results
DROP TRIGGER IF EXISTS trg_create_quiz_submission ON quiz_attempts;
DROP TRIGGER IF EXISTS trg_create_quiz_submission_enhanced ON quiz_attempts;

CREATE TRIGGER trg_create_quiz_submission_enhanced
  AFTER UPDATE OF status ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION create_quiz_submission_on_submit_enhanced();
*/
