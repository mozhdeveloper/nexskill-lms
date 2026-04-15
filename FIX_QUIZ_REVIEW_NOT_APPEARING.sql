-- ============================================
-- FIX: Quiz Review Not Appearing in Coach Dashboard
-- Run this in your Supabase SQL Editor
-- ============================================

-- STEP 1: Update quiz_type for all quizzes that have requires_coach_approval=true
-- This ensures consistency between the two fields
UPDATE quizzes
SET 
    quiz_type = CASE 
        WHEN requires_coach_approval = true THEN 'coach_reviewed'
        ELSE 'standard'
    END,
    updated_at = NOW()
WHERE quiz_type IS NULL 
   OR (requires_coach_approval = true AND quiz_type != 'coach_reviewed')
   OR (requires_coach_approval = false AND quiz_type != 'standard');

-- STEP 2: Verify the update worked
SELECT 
    id,
    title,
    requires_coach_approval,
    quiz_type,
    updated_at
FROM quizzes
ORDER BY updated_at DESC
LIMIT 20;

-- STEP 3: Check if the trigger function exists
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE proname = 'create_quiz_submission_on_submit_enhanced';

-- STEP 4: Recreate the trigger function if needed
-- Run this entire block if STEP 3 shows no results

/*
CREATE OR REPLACE FUNCTION create_quiz_submission_on_submit_enhanced()
RETURNS TRIGGER AS $$
DECLARE
  v_quiz_config RECORD;
  v_validation_result RECORD;
  v_coach_review_quiz BOOLEAN;
BEGIN
  -- Only fire when status changes to 'submitted'
  IF NEW.status != 'submitted' OR (OLD.status IS NOT NULL AND OLD.status = 'submitted') THEN
    RETURN NEW;
  END IF;

  -- Get quiz configuration
  SELECT * INTO v_quiz_config
  FROM quizzes
  WHERE id = NEW.quiz_id;

  IF v_quiz_config IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine if this is a coach review quiz (check BOTH fields)
  v_coach_review_quiz := v_quiz_config.quiz_type = 'coach_reviewed'
                         OR v_quiz_config.requires_coach_approval = true;

  -- For standard quizzes without coach approval, auto-pass based on score
  IF NOT v_coach_review_quiz THEN
    -- Check if quiz has a passing score defined
    IF v_quiz_config.passing_score IS NOT NULL AND NEW.score IS NOT NULL AND NEW.max_score IS NOT NULL THEN
      DECLARE
        v_score_percent INTEGER;
      BEGIN
        v_score_percent := ROUND((NEW.score::NUMERIC / NEW.max_score::NUMERIC) * 100);

        IF v_score_percent >= v_quiz_config.passing_score THEN
          NEW.passed := true;
          NEW.status := 'graded';
          NEW.graded_at := NOW();
        ELSE
          NEW.passed := false;
          NEW.status := 'graded';
          NEW.graded_at := NOW();
        END IF;

        -- Unlock next lesson if passed
        IF NEW.passed THEN
          PERFORM unlock_next_lesson(NEW.user_id, NEW.quiz_id);
        END IF;
      END;
    END IF;

    -- Don't create quiz_submissions for standard quizzes (only for coach_reviewed)
    RETURN NEW;
  END IF;

  -- For coach_reviewed quizzes, create submission record
  IF v_coach_review_quiz THEN
    -- Create quiz submission record for coach review
    INSERT INTO quiz_submissions (user_id, quiz_id, quiz_attempt_id, status, submitted_at)
    VALUES (NEW.user_id, NEW.quiz_id, NEW.id, 'pending_review', NEW.submitted_at)
    ON CONFLICT (user_id, quiz_id, quiz_attempt_id)
    DO UPDATE SET
      status = 'pending_review',
      submitted_at = NEW.submitted_at,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- STEP 5: Drop old triggers and create the enhanced one
/*
DROP TRIGGER IF EXISTS trg_create_quiz_submission ON quiz_attempts;
DROP TRIGGER IF EXISTS trg_create_quiz_submission_enhanced ON quiz_attempts;

CREATE TRIGGER trg_create_quiz_submission_enhanced
  AFTER UPDATE OF status ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION create_quiz_submission_on_submit_enhanced();
*/

-- STEP 6: Manually create missing quiz_submissions for existing attempts
-- This fixes any quiz attempts that should have created submissions but didn't
-- CRITICAL: This includes attempts with status='graded' for coach-reviewed quizzes
-- (which was a bug that has now been fixed in the frontend code)

/*
-- First, update any 'graded' attempts to 'submitted' for coach-reviewed quizzes
-- This ensures the trigger logic will work correctly
UPDATE quiz_attempts qa
SET status = 'submitted'
FROM quizzes q
WHERE qa.quiz_id = q.id
  AND qa.status = 'graded'
  AND (q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed');

-- Now create missing quiz_submissions
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
WHERE qa.status IN ('submitted', 'graded')  -- Check both statuses to catch all
  AND qs.id IS NULL  -- Only create if submission doesn't exist
  AND (q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed')
ON CONFLICT (user_id, quiz_id, quiz_attempt_id) 
DO UPDATE SET
  status = 'pending_review',
  submitted_at = EXCLUDED.submitted_at,
  updated_at = NOW();
*/

-- STEP 7: Verify submissions were created
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
ORDER BY qs.submitted_at DESC
LIMIT 20;

-- STEP 8: Verify coach can see the submissions (replace YOUR_COACH_USER_ID)
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
WHERE c.coach_id = 'YOUR_COACH_USER_ID'
  AND qs.status IN ('pending_review', 'failed', 'resubmission_required')
ORDER BY qs.submitted_at DESC;
*/
