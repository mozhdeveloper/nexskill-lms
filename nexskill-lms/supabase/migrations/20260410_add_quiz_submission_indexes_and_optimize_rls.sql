-- ============================================
-- Add Indexes and Optimize RLS for Quiz Submissions
-- Created: 2026-04-10
-- Fixes query timeout issues on quiz_submissions table
-- ============================================

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_id ON quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_attempt_id ON quiz_submissions(quiz_attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_status ON quiz_submissions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_id ON quiz_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_created_at ON quiz_submissions(created_at DESC);

-- Drop existing inefficient coach policy
DROP POLICY IF EXISTS "Coaches can view submissions for their quizzes" ON quiz_submissions;

-- Create optimized policy using a simpler EXISTS check
CREATE POLICY "Coaches can view submissions for their quizzes"
  ON quiz_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_submissions.quiz_id
        AND EXISTS (
          SELECT 1 FROM module_content_items mci
          INNER JOIN modules m ON m.id = mci.module_id
          INNER JOIN courses c ON c.id = m.course_id
          WHERE mci.content_id = q.id 
            AND mci.content_type = 'quiz'
            AND c.coach_id = auth.uid()
        )
    )
  );

-- Verify indexes were created
SELECT 
  indexname, 
  tablename 
FROM pg_indexes 
WHERE tablename = 'quiz_submissions' 
ORDER BY indexname;
