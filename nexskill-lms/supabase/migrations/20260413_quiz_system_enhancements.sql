-- ============================================
-- Quiz System Enhancement - Attempt Control, Sequential Progression & Quiz Types
-- Created: 2026-04-13
-- Purpose: 
--   1. Add attempt control (default 1, custom limits when enabled)
--   2. Implement quiz type system (standard vs coach-reviewed)
--   3. Enforce sequential lesson progression
--   4. Add quiz completion validation (no skipped questions)
--   5. Enhanced feedback visibility for students
-- ============================================

-- ============================================
-- STEP 1: Update Quizzes Table - Add Attempt Control & Quiz Type Fields
-- ============================================

-- Add attempt_control_enabled field (toggle for custom attempts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'attempt_control_enabled'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN attempt_control_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add quiz_type field to explicitly define quiz behavior
-- 'standard' = auto-graded with attempt limits
-- 'coach_reviewed' = requires manual review, retake until pass
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'quiz_type'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN quiz_type TEXT CHECK (quiz_type IN ('standard', 'coach_reviewed')) DEFAULT 'standard';
  END IF;
END $$;

-- Add allow_skipped_questions field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'allow_skipped_questions'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN allow_skipped_questions BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add module_id reference for sequential progression (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modules' AND column_name = 'enforce_sequential'
  ) THEN
    ALTER TABLE modules ADD COLUMN enforce_sequential BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================
-- STEP 2: Update Existing Data
-- ============================================

-- Migrate existing quizzes based on requires_coach_approval flag
-- If requires_coach_approval = true, set quiz_type = 'coach_reviewed'
-- Otherwise, set quiz_type = 'standard'
UPDATE quizzes
SET quiz_type = CASE
  WHEN requires_coach_approval = true THEN 'coach_reviewed'
  ELSE 'standard'
END
WHERE quiz_type IS NULL OR quiz_type = 'standard';

-- Set attempt_control_enabled based on max_attempts
-- If max_attempts is set and > 1, enable attempt control
UPDATE quizzes
SET attempt_control_enabled = (max_attempts IS NOT NULL AND max_attempts > 1)
WHERE attempt_control_enabled = false;

-- Set allow_skipped_questions to true by default for backward compatibility
UPDATE quizzes
SET allow_skipped_questions = true
WHERE allow_skipped_questions IS NULL;

-- ============================================
-- STEP 3: Create Quiz Attempt Validation Function
-- ============================================

-- Function to check if a student can attempt a quiz
CREATE OR REPLACE FUNCTION can_attempt_quiz(
  p_user_id UUID,
  p_quiz_id UUID
)
RETURNS TABLE (
  can_attempt BOOLEAN,
  reason TEXT,
  attempts_used INTEGER,
  max_attempts INTEGER,
  has_pending_submission BOOLEAN
) AS $$
DECLARE
  v_quiz_record RECORD;
  v_attempts_count INTEGER;
  v_pending_submission BOOLEAN;
BEGIN
  -- Get quiz configuration
  SELECT * INTO v_quiz_record
  FROM quizzes
  WHERE id = p_quiz_id;

  IF v_quiz_record IS NULL THEN
    RETURN QUERY SELECT false, 'Quiz not found', 0, NULL, false;
    RETURN;
  END IF;

  -- Count previous attempts
  SELECT COUNT(*) INTO v_attempts_count
  FROM quiz_attempts
  WHERE user_id = p_user_id
    AND quiz_id = p_quiz_id
    AND status IN ('submitted', 'graded');

  -- Check for pending review submission
  SELECT EXISTS(
    SELECT 1 FROM quiz_submissions qs
    WHERE qs.user_id = p_user_id
      AND qs.quiz_id = p_quiz_id
      AND qs.status = 'pending_review'
  ) INTO v_pending_submission;

  -- If there's a pending submission, block new attempts
  IF v_pending_submission THEN
    RETURN QUERY SELECT 
      false, 
      'Waiting for coach review - cannot attempt while pending',
      v_attempts_count,
      NULL,
      true;
    RETURN;
  END IF;

  -- For coach_reviewed quizzes, allow unlimited attempts
  IF v_quiz_record.quiz_type = 'coach_reviewed' THEN
    RETURN QUERY SELECT 
      true, 
      'Unlimited attempts for coach-reviewed quizzes',
      v_attempts_count,
      NULL,
      false;
    RETURN;
  END IF;

  -- For standard quizzes, check attempt limits
  IF v_quiz_record.quiz_type = 'standard' THEN
    -- If attempt_control_enabled is false, default to 1 attempt
    IF v_quiz_record.attempt_control_enabled = false THEN
      IF v_attempts_count >= 1 THEN
        RETURN QUERY SELECT 
          false, 
          'Only 1 attempt allowed for this quiz',
          v_attempts_count,
          1,
          false;
        RETURN;
      END IF;
    ELSE
      -- attempt_control_enabled is true, check custom max_attempts
      IF v_quiz_record.max_attempts IS NOT NULL THEN
        IF v_attempts_count >= v_quiz_record.max_attempts THEN
          RETURN QUERY SELECT 
            false, 
            'Maximum attempts reached',
            v_attempts_count,
            v_quiz_record.max_attempts,
            false;
          RETURN;
        END IF;
      END IF;
    END IF;

    -- All checks passed
    RETURN QUERY SELECT 
      true, 
      'Can attempt',
      v_attempts_count,
      v_quiz_record.max_attempts,
      false;
    RETURN;
  END IF;

  -- Fallback
  RETURN QUERY SELECT 
    false, 
    'Unknown quiz type',
    v_attempts_count,
    NULL,
    false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: Create Quiz Completion Validation Function
-- ============================================

-- Function to validate quiz submission (check for skipped questions)
CREATE OR REPLACE FUNCTION validate_quiz_submission(
  p_attempt_id UUID
)
RETURNS TABLE (
  is_valid BOOLEAN,
  validation_errors TEXT[],
  answered_count INTEGER,
  total_questions INTEGER,
  skipped_questions UUID[]
) AS $$
DECLARE
  v_attempt RECORD;
  v_total_questions INTEGER;
  v_answered_count INTEGER;
  v_skipped UUID[];
  v_errors TEXT[];
BEGIN
  -- Get attempt info
  SELECT * INTO v_attempt
  FROM quiz_attempts
  WHERE id = p_attempt_id;

  IF v_attempt IS NULL THEN
    RETURN QUERY SELECT false, ARRAY['Attempt not found'], 0, 0, ARRAY[]::UUID[];
    RETURN;
  END IF;

  -- Count total questions
  SELECT COUNT(*) INTO v_total_questions
  FROM quiz_questions
  WHERE quiz_id = v_attempt.quiz_id;

  -- Count answered questions
  SELECT COUNT(*) INTO v_answered_count
  FROM quiz_responses
  WHERE attempt_id = p_attempt_id;

  -- Find skipped questions (questions without responses)
  SELECT ARRAY_AGG(qq.id) INTO v_skipped
  FROM quiz_questions qq
  LEFT JOIN quiz_responses qr ON qq.id = qr.question_id AND qr.attempt_id = p_attempt_id
  WHERE qq.quiz_id = v_attempt.quiz_id
    AND qr.id IS NULL;

  -- Check if there are skipped questions
  v_errors := ARRAY[]::TEXT[];
  
  IF v_skipped IS NOT NULL AND array_length(v_skipped, 1) > 0 THEN
    v_errors := array_append(v_errors, 'Quiz has unanswered questions');
  END IF;

  -- Return validation result
  RETURN QUERY SELECT 
    (v_skipped IS NULL OR array_length(v_skipped, 1) = 0),
    v_errors,
    v_answered_count,
    v_total_questions,
    COALESCE(v_skipped, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Create Sequential Lesson Progression Check
-- ============================================

-- Function to check if a student can access a lesson
CREATE OR REPLACE FUNCTION can_access_lesson(
  p_user_id UUID,
  p_lesson_id UUID
)
RETURNS TABLE (
  can_access BOOLEAN,
  is_locked BOOLEAN,
  lock_reason TEXT,
  previous_lesson_id UUID
) AS $$
DECLARE
  v_lesson_access RECORD;
  v_content_item RECORD;
  v_prev_content_item RECORD;
  v_module RECORD;
BEGIN
  -- Check lesson access status
  SELECT * INTO v_lesson_access
  FROM lesson_access_status
  WHERE user_id = p_user_id
    AND lesson_id = p_lesson_id;

  -- If explicit access status exists, use it
  IF v_lesson_access IS NOT NULL THEN
    RETURN QUERY SELECT 
      NOT v_lesson_access.is_locked,
      v_lesson_access.is_locked,
      CASE 
        WHEN v_lesson_access.is_locked THEN 'Lesson locked - complete previous lessons first'
        ELSE 'Unlocked by coach'
      END,
      NULL;
    RETURN;
  END IF;

  -- Get content item for this lesson
  SELECT mci.* INTO v_content_item
  FROM module_content_items mci
  WHERE mci.content_id = p_lesson_id
    AND mci.content_type = 'lesson'
  LIMIT 1;

  IF v_content_item IS NULL THEN
    RETURN QUERY SELECT true, false, 'Lesson not found in module', NULL;
    RETURN;
  END IF;

  -- Get module info
  SELECT * INTO v_module
  FROM modules m
  WHERE m.id = v_content_item.module_id;

  -- Check if module enforces sequential progression
  IF v_module.enforce_sequential = false THEN
    RETURN QUERY SELECT true, false, 'Module does not enforce sequential progression', NULL;
    RETURN;
  END IF;

  -- Find previous content item
  SELECT mci.* INTO v_prev_content_item
  FROM module_content_items mci
  WHERE mci.module_id = v_content_item.module_id
    AND mci.position < v_content_item.position
    AND mci.is_published = true
  ORDER BY mci.position DESC
  LIMIT 1;

  -- If no previous item, it's the first lesson - allow access
  IF v_prev_content_item IS NULL THEN
    -- Create access record for first lesson
    INSERT INTO lesson_access_status (user_id, lesson_id, content_item_id, is_locked, unlock_reason, unlocked_at)
    VALUES (p_user_id, p_lesson_id, v_content_item.id, false, 'first_lesson', NOW())
    ON CONFLICT (user_id, lesson_id) DO NOTHING;
    
    RETURN QUERY SELECT true, false, 'First lesson in module', NULL;
    RETURN;
  END IF;

  -- Check if previous lesson is completed
  IF v_prev_content_item.content_type = 'lesson' THEN
    DECLARE
      v_prev_completed BOOLEAN;
    BEGIN
      SELECT is_completed INTO v_prev_completed
      FROM user_lesson_progress
      WHERE user_id = p_user_id
        AND lesson_id = v_prev_content_item.content_id;

      IF COALESCE(v_prev_completed, false) THEN
        -- Previous lesson completed, allow access
        INSERT INTO lesson_access_status (user_id, lesson_id, content_item_id, is_locked, unlock_reason, unlocked_at)
        VALUES (p_user_id, p_lesson_id, v_content_item.id, false, 'sequential_complete', NOW())
        ON CONFLICT (user_id, lesson_id) DO NOTHING;
        
        RETURN QUERY SELECT true, false, 'Previous lesson completed', v_prev_content_item.content_id;
        RETURN;
      ELSE
        -- Previous lesson not completed, block access
        RETURN QUERY SELECT false, true, 'Complete previous lesson first', v_prev_content_item.content_id;
        RETURN;
      END IF;
    END;
  ELSE
    -- Previous item is a quiz - check if it's completed
    DECLARE
      v_quiz_completed BOOLEAN;
    BEGIN
      SELECT EXISTS(
        SELECT 1 FROM quiz_attempts qa
        WHERE qa.user_id = p_user_id
          AND qa.quiz_id = v_prev_content_item.content_id
          AND qa.status IN ('submitted', 'graded')
          AND qa.passed = true
      ) INTO v_quiz_completed;

      IF v_quiz_completed THEN
        -- Previous quiz completed and passed, allow access
        INSERT INTO lesson_access_status (user_id, lesson_id, content_item_id, is_locked, unlock_reason, unlocked_at)
        VALUES (p_user_id, p_lesson_id, v_content_item.id, false, 'sequential_complete', NOW())
        ON CONFLICT (user_id, lesson_id) DO NOTHING;
        
        RETURN QUERY SELECT true, false, 'Previous quiz completed', v_prev_content_item.content_id;
        RETURN;
      ELSE
        -- Previous quiz not completed, block access
        RETURN QUERY SELECT false, true, 'Complete previous quiz first', v_prev_content_item.content_id;
        RETURN;
      END IF;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 6: Enhanced Quiz Submission Trigger with Validation
-- ============================================

-- Enhanced trigger function that validates quiz submission before creating quiz_submission
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

  -- Determine if this is a coach review quiz
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

-- Replace the old trigger with enhanced version
DROP TRIGGER IF EXISTS trg_create_quiz_submission ON quiz_attempts;
CREATE TRIGGER trg_create_quiz_submission_enhanced
  AFTER UPDATE OF status ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION create_quiz_submission_on_submit_enhanced();

-- ============================================
-- STEP 7: Add Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_type ON quizzes(quiz_type);
CREATE INDEX IF NOT EXISTS idx_quizzes_attempt_control ON quizzes(attempt_control_enabled);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id, status);
CREATE INDEX IF NOT EXISTS idx_lesson_access_user_lesson ON lesson_access_status(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_modules_enforce_sequential ON modules(enforce_sequential);

-- ============================================
-- STEP 8: Update RLS Policies
-- ============================================

-- Add policy for can_attempt_quiz function (SECURITY DEFINER already handles access)
-- Add policy for validate_quiz_submission function
-- No additional policies needed - functions use SECURITY DEFINER

-- ============================================
-- STEP 9: Verification & Logging
-- ============================================

DO $$
DECLARE
  v_standard_count INTEGER;
  v_coach_reviewed_count INTEGER;
  v_attempt_control_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_standard_count FROM quizzes WHERE quiz_type = 'standard';
  SELECT COUNT(*) INTO v_coach_reviewed_count FROM quizzes WHERE quiz_type = 'coach_reviewed';
  SELECT COUNT(*) INTO v_attempt_control_count FROM quizzes WHERE attempt_control_enabled = true;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Quiz System Enhancement Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Standard quizzes: %', v_standard_count;
  RAISE NOTICE 'Coach-reviewed quizzes: %', v_coach_reviewed_count;
  RAISE NOTICE 'Quizzes with custom attempt control: %', v_attempt_control_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN quizzes.attempt_control_enabled IS 'When false, default is 1 attempt. When true, uses max_attempts value';
COMMENT ON COLUMN quizzes.quiz_type IS 'standard = auto-graded with attempt limits; coach_reviewed = manual review required';
COMMENT ON COLUMN quizzes.allow_skipped_questions IS 'Whether students can skip questions during quiz attempt';
COMMENT ON COLUMN modules.enforce_sequential IS 'Whether module requires sequential lesson completion';
COMMENT ON FUNCTION can_attempt_quiz IS 'Validates if a student can attempt a quiz based on configuration and previous attempts';
COMMENT ON FUNCTION validate_quiz_submission IS 'Validates quiz submission for completeness (checks for unanswered questions)';
COMMENT ON FUNCTION can_access_lesson IS 'Checks if a student can access a lesson based on sequential progression rules';
