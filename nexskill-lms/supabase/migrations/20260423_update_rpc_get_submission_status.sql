-- Migration: Update get_student_quiz_submission_status to include student_read_at
-- Created: 2026-04-23

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
  student_read_at TIMESTAMPTZ,
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
    qs.student_read_at,
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
