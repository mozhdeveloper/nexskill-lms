-- Migration: Add cleared_at columns for persistent notification clearing
-- Created: 2026-04-23

ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS coach_cleared_at TIMESTAMPTZ;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS student_cleared_at TIMESTAMPTZ;

-- Update RLS to allow updating these new columns
DROP POLICY IF EXISTS "Coaches can update their own read status" ON quiz_submissions;
CREATE POLICY "Coaches can update their own read status"
ON quiz_submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM quizzes q
    WHERE q.id = quiz_submissions.quiz_id
    AND (
      EXISTS (SELECT 1 FROM module_content_items mci JOIN modules m ON m.id = mci.module_id JOIN courses c ON c.id = m.course_id WHERE mci.content_id = q.id AND c.coach_id = auth.uid())
      OR
      EXISTS (SELECT 1 FROM lesson_content_items lci JOIN module_content_items mci_lesson ON mci_lesson.content_id = lci.lesson_id JOIN modules m ON m.id = mci_lesson.module_id JOIN courses c ON c.id = m.course_id WHERE lci.content_id = q.id AND c.coach_id = auth.uid())
    )
  )
)
WITH CHECK (true);
