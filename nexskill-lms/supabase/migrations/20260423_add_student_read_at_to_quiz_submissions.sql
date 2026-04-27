-- Migration: Add student_read_at to quiz_submissions for notifications
-- Created: 2026-04-23

ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS student_read_at TIMESTAMPTZ;

-- Update RLS to allow students to update their own read status
DROP POLICY IF EXISTS "Students can update their own read status" ON quiz_submissions;

CREATE POLICY "Students can update their own read status"
  ON quiz_submissions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
