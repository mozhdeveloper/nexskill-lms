-- =====================================================
-- Migration: Fix Quiz Feedback RLS
-- Date: 2026-04-27
-- =====================================================

-- Enable RLS
ALTER TABLE public.quiz_feedback ENABLE ROW LEVEL SECURITY;

-- 1. Students can view feedback on their own submissions
DROP POLICY IF EXISTS "Students can view feedback on their submissions" ON public.quiz_feedback;
CREATE POLICY "Students can view feedback on their submissions"
ON public.quiz_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_submissions qs
    WHERE qs.id = public.quiz_feedback.quiz_submission_id
      AND qs.user_id = auth.uid()
  )
);

-- 2. Coaches can view feedback they gave
DROP POLICY IF EXISTS "Coaches can view their own feedback" ON public.quiz_feedback;
CREATE POLICY "Coaches can view their own feedback"
ON public.quiz_feedback
FOR SELECT
USING (coach_id = auth.uid());

-- 3. Coaches can view feedback for courses they own
DROP POLICY IF EXISTS "Coaches can view feedback for their courses" ON public.quiz_feedback;
CREATE POLICY "Coaches can view feedback for their courses"
ON public.quiz_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_submissions qs
    JOIN public.courses c ON c.id = (SELECT course_id FROM public.quizzes WHERE id = qs.quiz_id)
    WHERE qs.id = public.quiz_feedback.quiz_submission_id
      AND c.coach_id = auth.uid()
  )
);

-- 4. Coaches can create feedback
DROP POLICY IF EXISTS "Coaches can insert feedback" ON public.quiz_feedback;
CREATE POLICY "Coaches can insert feedback"
ON public.quiz_feedback
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('coach', 'admin', 'platform_owner')
  )
);

-- 5. Coaches can update their own feedback
DROP POLICY IF EXISTS "Coaches can update their own feedback" ON public.quiz_feedback;
CREATE POLICY "Coaches can update their own feedback"
ON public.quiz_feedback
FOR UPDATE
USING (coach_id = auth.uid());

-- 6. Admins can do everything
DROP POLICY IF EXISTS "Admins can manage all feedback" ON public.quiz_feedback;
CREATE POLICY "Admins can manage all feedback"
ON public.quiz_feedback
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
