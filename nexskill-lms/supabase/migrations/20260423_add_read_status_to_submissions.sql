-- Migration: Add student_read_at and coach_read_at to quiz_submissions
-- Created: 2026-04-23

ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS student_read_at TIMESTAMPTZ;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS coach_read_at TIMESTAMPTZ;

-- Update RLS for students
DROP POLICY IF EXISTS "Students can update their own read status" ON quiz_submissions;
CREATE POLICY "Students can update their own read status"
  ON quiz_submissions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update RLS for coaches
DROP POLICY IF EXISTS "Coaches can update their own read status" ON quiz_submissions;
CREATE POLICY "Coaches can update their own read status"
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
  )
  WITH CHECK (true);
