-- ============================================
-- FIX: Add RLS policy for quiz_feedback table
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Check current policies on quiz_feedback
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'quiz_feedback';

-- STEP 2: Drop old policies (if any)
DROP POLICY IF EXISTS "Coaches can insert feedback" ON quiz_feedback;
DROP POLICY IF EXISTS "Coaches can view their feedback" ON quiz_feedback;
DROP POLICY IF EXISTS "Coaches can view feedback" ON quiz_feedback;
DROP POLICY IF EXISTS "Students can view feedback on their submissions" ON quiz_feedback;
DROP POLICY IF EXISTS "Students can view feedback" ON quiz_feedback;
DROP POLICY IF EXISTS "Coaches can update their feedback" ON quiz_feedback;
DROP POLICY IF EXISTS "Coaches can update feedback" ON quiz_feedback;

-- STEP 3: Create INSERT policy for coaches
-- Coaches can insert feedback for quizzes they own
CREATE POLICY "Coaches can insert feedback"
ON quiz_feedback
FOR INSERT
WITH CHECK (
  -- The coach_id must be the current user
  coach_id = auth.uid()
  AND
  -- AND the quiz must belong to this coach (check both paths)
  (
    -- Path 1: Quiz is directly in module_content_items
    EXISTS (
      SELECT 1 FROM quiz_submissions qs
      JOIN module_content_items mci ON mci.content_id = qs.quiz_id AND mci.content_type = 'quiz'
      JOIN modules m ON m.id = mci.module_id
      JOIN courses c ON c.id = m.course_id
      WHERE qs.id = quiz_feedback.quiz_submission_id
        AND c.coach_id = auth.uid()
    )
    OR
    -- Path 2: Quiz is in lesson_content_items
    EXISTS (
      SELECT 1 FROM quiz_submissions qs
      JOIN lesson_content_items lci ON lci.content_id = qs.quiz_id AND lci.content_type = 'quiz'
      JOIN lessons l ON l.id = lci.lesson_id
      JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
      JOIN modules m ON m.id = mci.module_id
      JOIN courses c ON c.id = m.course_id
      WHERE qs.id = quiz_feedback.quiz_submission_id
        AND c.coach_id = auth.uid()
    )
  )
);

-- STEP 4: Create SELECT policy for coaches (view their own feedback)
CREATE POLICY "Coaches can view their feedback"
ON quiz_feedback
FOR SELECT
USING (
  coach_id = auth.uid()
);

-- STEP 5: Create SELECT policy for students (view feedback on their submissions)
CREATE POLICY "Students can view feedback on their submissions"
ON quiz_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quiz_submissions qs
    WHERE qs.id = quiz_feedback.quiz_submission_id
      AND qs.user_id = auth.uid()
  )
);

-- STEP 6: Create UPDATE policy for coaches (edit their own feedback)
CREATE POLICY "Coaches can update their feedback"
ON quiz_feedback
FOR UPDATE
USING (
  coach_id = auth.uid()
);

-- STEP 7: Verify the new policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'quiz_feedback'
ORDER BY policyname;
