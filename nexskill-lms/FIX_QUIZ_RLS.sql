-- Fix RLS policies for quiz_attempts and quiz_responses tables
-- This allows coaches to view student quiz data for courses they manage

-- Enable RLS on quiz_attempts table
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on quiz_responses table
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Coaches can view student quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can view own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can update own quiz attempts" ON quiz_attempts;

DROP POLICY IF EXISTS "Coaches can view student quiz responses" ON quiz_responses;
DROP POLICY IF EXISTS "Users can view own quiz responses" ON quiz_responses;
DROP POLICY IF EXISTS "Users can insert own quiz responses" ON quiz_responses;
DROP POLICY IF EXISTS "Users can update own quiz responses" ON quiz_responses;

-- ============================================
-- QUIZ ATTEMPTS POLICIES
-- ============================================

-- Policy 1: Students can view their own quiz attempts
CREATE POLICY "Users can view own quiz attempts"
ON quiz_attempts
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Policy 2: Students can insert their own quiz attempts
CREATE POLICY "Users can insert own quiz attempts"
ON quiz_attempts
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- Policy 3: Students can update their own quiz attempts
CREATE POLICY "Users can update own quiz attempts"
ON quiz_attempts
FOR UPDATE
USING (
  auth.uid() = user_id
);

-- Policy 4: Coaches can view quiz attempts for students in their courses
-- This joins through enrollments to check if the coach has access
CREATE POLICY "Coaches can view student quiz attempts"
ON quiz_attempts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM enrollments e
    INNER JOIN courses c ON e.course_id = c.id
    INNER JOIN course_coaches cc ON cc.course_id = c.id
    WHERE cc.coach_id = auth.uid()
    AND e.profile_id = quiz_attempts.user_id
  )
  OR
  -- Allow if user is a coach (role-based access)
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('coach', 'admin')
  )
);

-- ============================================
-- QUIZ RESPONSES POLICIES
-- ============================================

-- Policy 1: Students can view their own quiz responses
CREATE POLICY "Users can view own quiz responses"
ON quiz_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quiz_attempts qa
    WHERE qa.id = quiz_responses.attempt_id
    AND qa.user_id = auth.uid()
  )
);

-- Policy 2: Students can insert their own quiz responses
CREATE POLICY "Users can insert own quiz responses"
ON quiz_responses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quiz_attempts qa
    WHERE qa.id = quiz_responses.attempt_id
    AND qa.user_id = auth.uid()
  )
);

-- Policy 3: Students can update their own quiz responses
CREATE POLICY "Users can update own quiz responses"
ON quiz_responses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM quiz_attempts qa
    WHERE qa.id = quiz_responses.attempt_id
    AND qa.user_id = auth.uid()
  )
);

-- Policy 4: Coaches can view quiz responses for students in their courses
CREATE POLICY "Coaches can view student quiz responses"
ON quiz_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quiz_attempts qa
    INNER JOIN enrollments e ON qa.user_id = e.profile_id
    INNER JOIN courses c ON e.course_id = c.id
    INNER JOIN course_coaches cc ON cc.course_id = c.id
    WHERE qa.id = quiz_responses.attempt_id
    AND cc.coach_id = auth.uid()
  )
  OR
  -- Allow if user is a coach (role-based access)
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('coach', 'admin')
  )
);

-- ============================================
-- ADDITIONAL HELPFUL POLICIES FOR OTHER TABLES
-- ============================================

-- Ensure coaches can read quizzes table (for viewing quiz details)
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quizzes are viewable by everyone" ON quizzes;
CREATE POLICY "Quizzes are viewable by everyone"
ON quizzes
FOR SELECT
USING (
  is_published = true
  OR 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('coach', 'admin')
  )
);

-- Ensure coaches can read quiz_questions table
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quiz questions viewable by everyone" ON quiz_questions;
CREATE POLICY "Quiz questions viewable by everyone"
ON quiz_questions
FOR SELECT
USING (true);

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify policies were created:
-- SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
-- FROM pg_policies 
-- WHERE tablename IN ('quiz_attempts', 'quiz_responses', 'quizzes', 'quiz_questions')
-- ORDER BY tablename, policyname;
