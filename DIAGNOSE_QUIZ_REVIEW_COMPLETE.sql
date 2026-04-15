-- ============================================
-- COMPLETE QUIZ REVIEW DIAGNOSTIC
-- Run this after a student submits a quiz
-- ============================================

-- STEP 1: Find coach-reviewed quizzes
-- This shows which quizzes SHOULD create submissions
SELECT 
    q.id as quiz_id,
    q.title as quiz_title,
    q.requires_coach_approval,
    q.quiz_type,
    m.id as module_id,
    c.id as course_id,
    c.title as course_title,
    c.coach_id
FROM quizzes q
JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
WHERE q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed'
ORDER BY q.updated_at DESC
LIMIT 10;

-- STEP 2: Find quiz attempts that were submitted
-- This shows attempts that SHOULD have triggered the submission creation
SELECT 
    qa.id as attempt_id,
    qa.user_id,
    qa.quiz_id,
    qa.status,
    qa.score,
    qa.max_score,
    qa.passed,
    qa.submitted_at,
    q.title as quiz_title,
    q.requires_coach_approval,
    q.quiz_type,
    p.email as student_email
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
JOIN profiles p ON p.id = qa.user_id
WHERE q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed'
ORDER BY qa.submitted_at DESC
LIMIT 20;

-- STEP 3: Find quiz_submissions that exist
-- This shows what the coach SHOULD see
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
    p.email as student_email
FROM quiz_submissions qs
JOIN quizzes q ON q.id = qs.quiz_id
JOIN profiles p ON p.id = qs.user_id
ORDER BY qs.submitted_at DESC
LIMIT 20;

-- STEP 4: Find MISSING submissions
-- This is the CRITICAL query - shows attempts without submissions
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
    c.coach_id,
    CASE 
        WHEN qs.id IS NULL THEN '❌ MISSING - Should be in coach review!'
        ELSE '✅ Has submission'
    END as status
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
JOIN profiles p ON p.id = qa.user_id
LEFT JOIN quiz_submissions qs ON qs.quiz_attempt_id = qa.id
WHERE (q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed')
ORDER BY qa.submitted_at DESC;

-- STEP 5: Check if trigger exists and is active
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE '%quiz_submission%'
ORDER BY trigger_name;

-- STEP 6: Check the trigger function code
SELECT 
    proname as function_name,
    prosrc as function_code
FROM pg_proc
WHERE proname = 'create_quiz_submission_on_submit_enhanced';

-- STEP 7: Manually create missing submissions
-- Run this ONLY if STEP 4 shows missing submissions
-- Uncomment this block to fix the issue:

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

-- STEP 8: Verify coach can see the submissions (check RLS)
-- Replace 'YOUR_COACH_USER_ID' with the actual coach UUID
/*
SELECT 
    qs.id as submission_id,
    qs.user_id as student_id,
    qs.status,
    qs.submitted_at,
    q.title as quiz_title,
    c.title as course_title,
    p.email as student_email
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

-- STEP 9: Recreate the trigger if it's broken or missing
-- Run this if STEP 5 shows no trigger
/*
DROP TRIGGER IF EXISTS trg_create_quiz_submission ON quiz_attempts;
DROP TRIGGER IF EXISTS trg_create_quiz_submission_enhanced ON quiz_attempts;

CREATE TRIGGER trg_create_quiz_submission_enhanced
  AFTER UPDATE OF status ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION create_quiz_submission_on_submit_enhanced();
*/
