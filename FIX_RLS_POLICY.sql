-- ============================================
-- FIX: Add RLS policy for quizzes in lesson_content_items
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Drop the old policy (we'll replace it with a better one)
DROP POLICY IF EXISTS "Coaches can view submissions for their quizzes" ON quiz_submissions;
DROP POLICY IF EXISTS "Coaches can update submissions for their quizzes" ON quiz_submissions;

-- STEP 2: Create new policies that check BOTH paths
-- Policy for SELECT (viewing submissions)
CREATE POLICY "Coaches can view submissions for their quizzes"
ON quiz_submissions
FOR SELECT
USING (
  -- Path 1: Quiz is directly in module_content_items
  EXISTS (
    SELECT 1 FROM module_content_items mci
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE mci.content_id = quiz_submissions.quiz_id
      AND mci.content_type = 'quiz'
      AND c.coach_id = auth.uid()
  )
  OR
  -- Path 2: Quiz is in lesson_content_items (inside a lesson)
  EXISTS (
    SELECT 1 FROM lesson_content_items lci
    JOIN lessons l ON l.id = lci.lesson_id
    JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE lci.content_id = quiz_submissions.quiz_id
      AND lci.content_type = 'quiz'
      AND c.coach_id = auth.uid()
  )
);

-- Policy for UPDATE (reviewing submissions)
CREATE POLICY "Coaches can update submissions for their quizzes"
ON quiz_submissions
FOR UPDATE
USING (
  -- Path 1: Quiz is directly in module_content_items
  EXISTS (
    SELECT 1 FROM module_content_items mci
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE mci.content_id = quiz_submissions.quiz_id
      AND mci.content_type = 'quiz'
      AND c.coach_id = auth.uid()
  )
  OR
  -- Path 2: Quiz is in lesson_content_items (inside a lesson)
  EXISTS (
    SELECT 1 FROM lesson_content_items lci
    JOIN lessons l ON l.id = lci.lesson_id
    JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE lci.content_id = quiz_submissions.quiz_id
      AND lci.content_type = 'quiz'
      AND c.coach_id = auth.uid()
  )
);

-- STEP 3: Verify the new policies
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'quiz_submissions'
  AND policyname LIKE 'Coaches%';

-- STEP 4: Test if the coach can now see the submissions
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
JOIN lesson_content_items lci ON lci.content_id = q.id AND lci.content_type = 'quiz'
JOIN lessons l ON l.id = lci.lesson_id
JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
JOIN modules m ON m.id = mci.module_id
JOIN courses c ON c.id = m.course_id
JOIN profiles p ON p.id = qs.user_id
WHERE c.id = '472d0bb4-084e-4654-8718-5083b9f0acbf'
  AND qs.status IN ('pending_review', 'failed', 'resubmission_required')
ORDER BY qs.submitted_at DESC;
