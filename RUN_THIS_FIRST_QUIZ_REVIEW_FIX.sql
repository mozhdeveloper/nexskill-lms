-- ============================================
-- RUN THIS FIRST: Complete Quiz Review Setup
-- ============================================

-- STEP 1: Add missing columns to quizzes table
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'quiz_type'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN quiz_type TEXT CHECK (quiz_type IN ('standard', 'coach_reviewed')) DEFAULT 'standard';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'attempt_control_enabled'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN attempt_control_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'allow_skipped_questions'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN allow_skipped_questions BOOLEAN DEFAULT true;
  END IF;
END $$;

-- STEP 2: Update existing quizzes to set quiz_type
-- ============================================

UPDATE quizzes
SET 
  quiz_type = CASE
    WHEN requires_coach_approval = true THEN 'coach_reviewed'
    ELSE 'standard'
  END,
  attempt_control_enabled = (max_attempts IS NOT NULL AND max_attempts > 1)
WHERE quiz_type IS NULL;

-- STEP 3: Check if there's a trigger blocking updates to submitted attempts
-- ============================================
-- We need to temporarily disable it to fix the graded attempts

-- First, check what triggers exist on quiz_attempts
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'quiz_attempts'
ORDER BY trigger_name;

-- STEP 4: Temporarily disable the protection trigger
-- ============================================
-- This allows us to fix the status for coach-reviewed quizzes

DROP TRIGGER IF EXISTS trg_prevent_modify_submitted_attempt ON quiz_attempts;
DROP TRIGGER IF EXISTS prevent_modify_submitted_attempt ON quiz_attempts;

-- STEP 5: Now fix graded attempts to submitted for coach-reviewed quizzes
-- ============================================

UPDATE quiz_attempts qa
SET status = 'submitted'
FROM quizzes q
WHERE qa.quiz_id = q.id
  AND qa.status = 'graded'
  AND (q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed');

-- STEP 6: Create missing quiz_submissions for existing attempts
-- ============================================

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

-- STEP 7: Re-create the protection trigger
-- ============================================

CREATE OR REPLACE FUNCTION prevent_modify_submitted_attempt()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('submitted', 'graded') THEN
    RAISE EXCEPTION 'Cannot modify a submitted or graded quiz attempt.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_modify_submitted_attempt
  BEFORE UPDATE ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION prevent_modify_submitted_attempt();

-- STEP 8: Create or replace the enhanced trigger function for quiz submissions
-- ============================================

CREATE OR REPLACE FUNCTION create_quiz_submission_on_submit_enhanced()
RETURNS TRIGGER AS $$
DECLARE
  v_quiz_config RECORD;
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

  -- Determine if this is a coach review quiz
  v_coach_review_quiz := v_quiz_config.quiz_type = 'coach_reviewed'
                         OR v_quiz_config.requires_coach_approval = true;

  -- For standard quizzes without coach approval, auto-pass based on score
  IF NOT v_coach_review_quiz THEN
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
      END;
    END IF;

    -- Don't create quiz_submissions for standard quizzes
    RETURN NEW;
  END IF;

  -- For coach_reviewed quizzes, create submission record
  IF v_coach_review_quiz THEN
    INSERT INTO quiz_submissions (user_id, quiz_id, quiz_attempt_id, status, submitted_at)
    VALUES (NEW.user_id, NEW.quiz_id, NEW.id, 'pending_review', NEW.submitted_at)
    ON CONFLICT (user_id, quiz_id, quiz_attempt_id)
    DO UPDATE SET
      status = 'pending_review',
      submitted_at = EXCLUDED.submitted_at,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 9: Create the submission trigger
-- ============================================

DROP TRIGGER IF EXISTS trg_create_quiz_submission ON quiz_attempts;
DROP TRIGGER IF EXISTS trg_create_quiz_submission_enhanced ON quiz_attempts;

CREATE TRIGGER trg_create_quiz_submission_enhanced
  AFTER UPDATE OF status ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION create_quiz_submission_on_submit_enhanced();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check columns exist (should show quiz_type, attempt_control_enabled, etc.)
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'quizzes'
  AND column_name IN ('quiz_type', 'attempt_control_enabled', 'requires_coach_approval')
ORDER BY column_name;

-- Check triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'quiz_attempts'
ORDER BY trigger_name;

-- Show your quizzes (should show quiz_type values)
SELECT 
    id,
    title,
    requires_coach_approval,
    quiz_type,
    updated_at
FROM quizzes
ORDER BY updated_at DESC
LIMIT 20;

-- Show all quiz attempts with their statuses
SELECT 
    qa.id as attempt_id,
    q.title as quiz_title,
    qa.user_id,
    qa.status,
    qa.score,
    qa.max_score,
    qa.submitted_at,
    p.email as student_email
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
JOIN profiles p ON p.id = qa.user_id
WHERE q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed'
ORDER BY qa.submitted_at DESC
LIMIT 20;

-- Show submissions that were just created
SELECT 
    qs.id as submission_id,
    q.title as quiz_title,
    qs.status,
    qs.submitted_at,
    p.email as student_email
FROM quiz_submissions qs
JOIN quizzes q ON q.id = qs.quiz_id
JOIN profiles p ON p.id = qs.user_id
ORDER BY qs.submitted_at DESC
LIMIT 20;

-- Summary
SELECT 
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE qa.status = 'submitted') as submitted_attempts,
    COUNT(*) FILTER (WHERE qa.status = 'graded') as graded_attempts,
    COUNT(*) FILTER (WHERE qs.id IS NOT NULL) as attempts_with_submissions,
    COUNT(*) FILTER (WHERE qs.id IS NULL) as attempts_missing_submissions
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
LEFT JOIN quiz_submissions qs ON qs.quiz_attempt_id = qa.id
WHERE q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed';
