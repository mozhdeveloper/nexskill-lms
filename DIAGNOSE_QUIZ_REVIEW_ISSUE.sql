-- ============================================
-- DIAGNOSE: Quiz Review Not Showing Submissions
-- Run this in your Supabase SQL Editor
-- ============================================

-- STEP 1: Quick Diagnostic Summary
-- This will tell you exactly what's wrong
SELECT
    qa.id as attempt_id,
    qa.user_id,
    qa.quiz_id,
    qa.status as attempt_status,
    qa.score,
    qa.max_score,
    qa.submitted_at,
    q.title as quiz_title,
    q.requires_coach_approval,
    q.quiz_type,
    p.email as student_email,
    CASE 
        WHEN qs.id IS NULL THEN '❌ MISSING - No quiz_submission record!'
        ELSE '✅ Has submission (status: ' || qs.status || ')'
    END as submission_status,
    m.id as module_id,
    c.id as course_id,
    c.title as course_title,
    c.coach_id
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
JOIN profiles p ON p.id = qa.user_id
LEFT JOIN quiz_submissions qs ON qs.quiz_attempt_id = qa.id
LEFT JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
LEFT JOIN modules m ON m.id = mci.module_id
LEFT JOIN courses c ON c.id = m.course_id
WHERE qa.status IN ('submitted', 'graded')
  AND (q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed')
ORDER BY qa.submitted_at DESC
LIMIT 20;

-- STEP 2: Check if the trigger function exists
SELECT
    proname as function_name,
    prosrc as function_code
FROM pg_proc
WHERE proname = 'create_quiz_submission_on_submit_enhanced';

-- STEP 3: Check if the trigger is active
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE '%quiz_submission%';

-- STEP 4: Check all recent quiz attempts (regardless of type)
SELECT
    qa.id as attempt_id,
    qa.user_id,
    qa.quiz_id,
    qa.status as attempt_status,
    qa.submitted_at,
    q.title as quiz_title,
    q.requires_coach_approval,
    q.quiz_type,
    p.email as student_email,
    CASE 
        WHEN qs.id IS NULL THEN '❌ NO SUBMISSION'
        ELSE '✅ Has submission (' || qs.status || ')'
    END as has_submission
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
JOIN profiles p ON p.id = qa.user_id
LEFT JOIN quiz_submissions qs ON qs.quiz_attempt_id = qa.id
ORDER BY qa.submitted_at DESC
LIMIT 30;

-- ============================================
-- FIXES (Run based on what you found above)
-- ============================================

-- FIX A: If STEP 1 shows "MISSING" submissions, run this to create them:
/*
INSERT INTO quiz_submissions (user_id, quiz_id, quiz_attempt_id, status, submitted_at)
SELECT
    qa.user_id,
    qa.quiz_id,
    qa.id as quiz_attempt_id,
    'pending_review' as status,
    qa.submitted_at
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
LEFT JOIN quiz_submissions qs ON qs.quiz_attempt_id = qa.id
WHERE qa.status IN ('submitted', 'graded')
  AND qs.id IS NULL
  AND (q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed')
ON CONFLICT (user_id, quiz_id, quiz_attempt_id)
DO UPDATE SET
  status = 'pending_review',
  submitted_at = EXCLUDED.submitted_at,
  updated_at = NOW();
*/

-- FIX B: If STEP 2 shows no trigger function, run the entire block from FIX_QUIZ_REVIEW_NOT_APPEARING.sql

-- FIX C: If STEP 3 shows no trigger, recreate it:
/*
DROP TRIGGER IF EXISTS trg_create_quiz_submission ON quiz_attempts;
DROP TRIGGER IF EXISTS trg_create_quiz_submission_enhanced ON quiz_attempts;

CREATE TRIGGER trg_create_quiz_submission_enhanced
  AFTER UPDATE OF status ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION create_quiz_submission_on_submit_enhanced();
*/

-- STEP 5: Verify your coach can see submissions (replace YOUR_COACH_USER_ID with actual UUID)
/*
SELECT
    qs.id as submission_id,
    qs.user_id as student_id,
    qs.quiz_id,
    qs.status,
    qs.submitted_at,
    q.title as quiz_title,
    c.title as course_title,
    p.email as student_email,
    c.coach_id
FROM quiz_submissions qs
JOIN quizzes q ON q.id = qs.quiz_id
JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
JOIN profiles p ON p.id = qs.user_id
WHERE c.coach_id = 'YOUR_COACH_USER_ID'
  AND qs.status IN ('pending_review', 'failed', 'resubmission_required')
ORDER BY qs.submitted_at DESC;
*/
