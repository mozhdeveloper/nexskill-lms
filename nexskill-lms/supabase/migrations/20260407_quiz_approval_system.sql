-- ============================================
-- Quiz Approval & Sequential Lesson Lock System
-- Created: 2026-04-07
-- SAFE MIGRATION - Won't break existing functionality
-- ============================================

-- STEP 1: Add column to quizzes table for coach approval requirement
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'requires_coach_approval'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN requires_coach_approval BOOLEAN DEFAULT false;
  END IF;
END $$;

-- STEP 2: Add column to module_content_items for sequential access control
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'module_content_items' AND column_name = 'is_sequential'
  ) THEN
    ALTER TABLE module_content_items ADD COLUMN is_sequential BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================
-- Quiz Submissions Table
-- Tracks the approval status of quiz attempts by coaches
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  quiz_attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending_review', 'passed', 'failed', 'resubmission_required')) DEFAULT 'pending_review',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quiz_id, quiz_attempt_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user ON quiz_submissions(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_status ON quiz_submissions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_attempt ON quiz_submissions(quiz_attempt_id);

-- ============================================
-- Quiz Feedback Table
-- Stores coach feedback with optional media attachments
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_submission_id UUID NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]', -- Array of {url, type, filename, size}
  is_resubmission_feedback BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_feedback_submission ON quiz_feedback(quiz_submission_id);
CREATE INDEX IF NOT EXISTS idx_quiz_feedback_coach ON quiz_feedback(coach_id);

-- ============================================
-- Lesson Access Status Table
-- Tracks which lessons are locked/unlocked for each student
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_access_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES module_content_items(id),
  is_locked BOOLEAN DEFAULT true,
  unlock_reason TEXT, -- 'coach_approved', 'first_lesson', 'no_prerequisite'
  unlocked_at TIMESTAMPTZ,
  unlocked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_access_user ON lesson_access_status(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_access_lesson ON lesson_access_status(lesson_id);

-- ============================================
-- Database Functions
-- ============================================

-- Function to check if a quiz requires coach approval
CREATE OR REPLACE FUNCTION check_quiz_requires_approval(p_quiz_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_requires_approval BOOLEAN;
BEGIN
  SELECT requires_coach_approval INTO v_requires_approval
  FROM quizzes
  WHERE id = p_quiz_id;
  
  RETURN COALESCE(v_requires_approval, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get latest submission status for a student's quiz attempt
CREATE OR REPLACE FUNCTION get_student_quiz_submission_status(
  p_user_id UUID,
  p_quiz_id UUID
)
RETURNS TABLE (
  submission_id UUID,
  status TEXT,
  latest_attempt_id UUID,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  has_feedback BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qs.id,
    qs.status,
    qs.quiz_attempt_id,
    qs.submitted_at,
    qs.reviewed_at,
    qs.review_notes,
    EXISTS(
      SELECT 1 FROM quiz_feedback qf 
      WHERE qf.quiz_submission_id = qs.id
    ) as has_feedback
  FROM quiz_submissions qs
  WHERE qs.user_id = p_user_id
    AND qs.quiz_id = p_quiz_id
  ORDER BY qs.submitted_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock next lesson after quiz approval
CREATE OR REPLACE FUNCTION unlock_next_lesson(
  p_user_id UUID,
  p_quiz_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_content_item RECORD;
  v_next_content_item RECORD;
  v_module_id UUID;
BEGIN
  -- Get the quiz's content item
  SELECT mci.id, mci.module_id, mci.position
  INTO v_content_item
  FROM module_content_items mci
  WHERE mci.content_id = p_quiz_id
    AND mci.content_type = 'quiz'
  LIMIT 1;

  IF v_content_item IS NULL THEN
    RETURN;
  END IF;

  -- Get the next content item in the same module
  SELECT mci.id, mci.content_id, mci.content_type
  INTO v_next_content_item
  FROM module_content_items mci
  WHERE mci.module_id = v_content_item.module_id
    AND mci.position > v_content_item.position
    AND mci.is_published = true
  ORDER BY mci.position ASC
  LIMIT 1;

  -- If there's a next item and it's a lesson, unlock it
  IF v_next_content_item IS NOT NULL AND v_next_content_item.content_type = 'lesson' THEN
    -- Update or insert lesson access status
    INSERT INTO lesson_access_status (user_id, lesson_id, content_item_id, is_locked, unlock_reason, unlocked_at, unlocked_by)
    VALUES (
      p_user_id,
      v_next_content_item.content_id,
      v_content_item.id,
      false,
      'coach_approved',
      NOW(),
      p_user_id
    )
    ON CONFLICT (user_id, lesson_id)
    DO UPDATE SET
      is_locked = false,
      unlock_reason = 'coach_approved',
      unlocked_at = NOW(),
      unlocked_by = p_user_id,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a lesson is locked for a student
CREATE OR REPLACE FUNCTION is_lesson_locked(
  p_user_id UUID,
  p_lesson_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_locked BOOLEAN;
  v_content_item RECORD;
  v_prev_content_item RECORD;
BEGIN
  -- Check if there's an explicit access status
  SELECT las.is_locked INTO v_is_locked
  FROM lesson_access_status las
  WHERE las.user_id = p_user_id
    AND las.lesson_id = p_lesson_id;

  IF v_is_locked IS NOT NULL THEN
    RETURN v_is_locked;
  END IF;

  -- If no explicit status, check if it's the first lesson
  SELECT mci.id, mci.module_id, mci.position
  INTO v_content_item
  FROM module_content_items mci
  WHERE mci.content_id = p_lesson_id
    AND mci.content_type = 'lesson'
  LIMIT 1;

  IF v_content_item IS NULL THEN
    RETURN true; -- Default to locked if not found
  END IF;

  -- Check if there's any previous content item
  SELECT mci.id, mci.content_id, mci.content_type
  INTO v_prev_content_item
  FROM module_content_items mci
  WHERE mci.module_id = v_content_item.module_id
    AND mci.position < v_content_item.position
    AND mci.is_published = true
  ORDER BY mci.position DESC
  LIMIT 1;

  -- If no previous item, it's the first lesson - should be unlocked
  IF v_prev_content_item IS NULL THEN
    -- Create access status for first lesson
    INSERT INTO lesson_access_status (user_id, lesson_id, content_item_id, is_locked, unlock_reason, unlocked_at)
    VALUES (p_user_id, p_lesson_id, v_content_item.id, false, 'first_lesson', NOW())
    ON CONFLICT (user_id, lesson_id) DO NOTHING;
    
    RETURN false;
  END IF;

  -- If there's a previous item, lesson is locked by default
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all locked/unlocked lessons for a student in a course
CREATE OR REPLACE FUNCTION get_course_lesson_access_status(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS TABLE (
  lesson_id UUID,
  is_locked BOOLEAN,
  unlock_reason TEXT,
  unlocked_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    las.lesson_id,
    las.is_locked,
    las.unlock_reason,
    las.unlocked_at
  FROM lesson_access_status las
  INNER JOIN lessons l ON l.id = las.lesson_id
  INNER JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
  INNER JOIN modules m ON m.id = mci.module_id
  WHERE las.user_id = p_user_id
    AND m.course_id = p_course_id
  ORDER BY mci.position ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SAFE TRIGGER: Only fires on status change to 'submitted'
-- This won't interfere with quiz creation/updates
-- ============================================
CREATE OR REPLACE FUNCTION create_quiz_submission_on_submit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create submission when quiz attempt status changes to 'submitted'
  -- AND the quiz requires coach approval
  IF NEW.status = 'submitted' 
     AND (OLD.status IS NULL OR OLD.status != 'submitted')
     AND EXISTS (
       SELECT 1 FROM quizzes q 
       WHERE q.id = NEW.quiz_id 
         AND q.requires_coach_approval = true
     ) THEN
    -- Create quiz submission record
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

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_create_quiz_submission ON quiz_attempts;
CREATE TRIGGER trg_create_quiz_submission
  AFTER UPDATE OF status ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION create_quiz_submission_on_submit();

-- ============================================
-- Trigger to unlock next lesson on quiz approval
-- ============================================
CREATE OR REPLACE FUNCTION unlock_next_lesson_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- When submission status changes to 'passed', unlock next lesson
  IF NEW.status = 'passed' AND (OLD.status IS NULL OR OLD.status != 'passed') THEN
    PERFORM unlock_next_lesson(NEW.user_id, NEW.quiz_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_unlock_next_lesson ON quiz_submissions;
CREATE TRIGGER trg_unlock_next_lesson
  AFTER UPDATE OF status ON quiz_submissions
  FOR EACH ROW
  EXECUTE FUNCTION unlock_next_lesson_on_approval();

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_access_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Students can view their own quiz submissions" ON quiz_submissions;
DROP POLICY IF EXISTS "Coaches can view submissions for their quizzes" ON quiz_submissions;
DROP POLICY IF EXISTS "Coaches can update submissions for their quizzes" ON quiz_submissions;
DROP POLICY IF EXISTS "System can insert quiz submissions" ON quiz_submissions;

-- Quiz Submissions Policies
CREATE POLICY "Students can view their own quiz submissions"
  ON quiz_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view submissions for their quizzes"
  ON quiz_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      INNER JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
      INNER JOIN modules m ON m.id = mci.module_id
      INNER JOIN courses c ON c.id = m.course_id
      WHERE q.id = quiz_submissions.quiz_id
        AND c.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update submissions for their quizzes"
  ON quiz_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      INNER JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
      INNER JOIN modules m ON m.id = mci.module_id
      INNER JOIN courses c ON c.id = m.course_id
      WHERE q.id = quiz_submissions.quiz_id
        AND c.coach_id = auth.uid()
    )
  );

CREATE POLICY "System can insert quiz submissions"
  ON quiz_submissions FOR INSERT
  WITH CHECK (true); -- Allow trigger to insert

-- Quiz Feedback Policies
DROP POLICY IF EXISTS "Students can view feedback on their submissions" ON quiz_feedback;
DROP POLICY IF EXISTS "Coaches can create feedback for their quizzes" ON quiz_feedback;
DROP POLICY IF EXISTS "Coaches can update their own feedback" ON quiz_feedback;

CREATE POLICY "Students can view feedback on their submissions"
  ON quiz_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quiz_submissions qs
      WHERE qs.id = quiz_feedback.quiz_submission_id
        AND qs.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create feedback for their quizzes"
  ON quiz_feedback FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_submissions qs
      INNER JOIN quizzes q ON q.id = qs.quiz_id
      INNER JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
      INNER JOIN modules m ON m.id = mci.module_id
      INNER JOIN courses c ON c.id = m.course_id
      WHERE qs.id = quiz_feedback.quiz_submission_id
        AND c.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update their own feedback"
  ON quiz_feedback FOR UPDATE
  USING (coach_id = auth.uid());

-- Lesson Access Status Policies
DROP POLICY IF EXISTS "Students can view their own lesson access status" ON lesson_access_status;
DROP POLICY IF EXISTS "System can manage lesson access status" ON lesson_access_status;

CREATE POLICY "Students can view their own lesson access status"
  ON lesson_access_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage lesson access status"
  ON lesson_access_status FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE quiz_submissions IS 'Tracks coach review status of quiz attempts';
COMMENT ON TABLE quiz_feedback IS 'Stores coach feedback with optional media attachments';
COMMENT ON TABLE lesson_access_status IS 'Controls which lessons are locked/unlocked for each student';
COMMENT ON FUNCTION unlock_next_lesson IS 'Unlocks the next lesson after a quiz is approved by coach';
COMMENT ON FUNCTION is_lesson_locked IS 'Checks if a lesson is locked for a specific student';
COMMENT ON FUNCTION get_student_quiz_submission_status IS 'Returns the latest submission status for a student quiz';


