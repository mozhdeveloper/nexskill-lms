-- ============================================
-- DIAGNOSE: Student can't see coach feedback
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Check if feedback exists for a specific submission
-- Replace with actual submission_id from quiz_submissions table
SELECT 
    qf.id,
    qf.quiz_submission_id,
    qf.coach_id,
    qf.comment,
    qf.media_urls,
    qf.created_at,
    qs.user_id as student_id,
    qs.quiz_id,
    q.title as quiz_title
FROM quiz_feedback qf
JOIN quiz_submissions qs ON qs.id = qf.quiz_submission_id
JOIN quizzes q ON q.id = qs.quiz_id
WHERE qs.user_id = 'STUDENT_USER_ID_HERE' -- Replace with actual student ID
ORDER BY qf.created_at DESC;

-- STEP 2: Check current RLS policies on quiz_feedback
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'quiz_feedback';

-- STEP 3: Test if the existing student policy works
-- This should return feedback for the current student
/*
SELECT 
    qf.id,
    qf.comment,
    qs.user_id
FROM quiz_feedback qf
JOIN quiz_submissions qs ON qs.id = qf.quiz_submission_id
WHERE qs.user_id = auth.uid();
*/

-- STEP 4: Recreate the student feedback policy if needed
/*
DROP POLICY IF EXISTS "Students can view feedback on their submissions" ON quiz_feedback;

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
*/
