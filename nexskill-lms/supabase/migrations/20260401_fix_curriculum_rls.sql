-- Fix: Add RLS policies for curriculum tables to allow students to view published content
-- This allows students to see the curriculum (locked) even without enrollment

-- Enable RLS on these tables if not already enabled
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Allow authenticated read access to courses" ON public.courses;
DROP POLICY IF EXISTS "Allow authenticated read access to modules" ON public.modules;
DROP POLICY IF EXISTS "Allow authenticated read access to module content items" ON public.module_content_items;
DROP POLICY IF EXISTS "Allow authenticated read access to lessons" ON public.lessons;
DROP POLICY IF EXISTS "Allow authenticated read access to quizzes" ON public.quizzes;

-- ============================================
-- COURSES POLICIES
-- ============================================

-- Public can view approved courses (existing policy - keep or recreate)
DROP POLICY IF EXISTS "anyone_view_approved_courses" ON public.courses;
CREATE POLICY "anyone_view_approved_courses"
ON public.courses
FOR SELECT
TO public
USING (verification_status = 'approved');

-- Coaches can view their own courses (including drafts)
DROP POLICY IF EXISTS "coaches_view_own_courses" ON public.courses;
CREATE POLICY "coaches_view_own_courses"
ON public.courses
FOR SELECT
TO public
USING (
  coach_id = auth.uid() OR 
  verification_status = 'approved' OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- MODULES POLICIES
-- ============================================

-- Public can view modules from approved courses
DROP POLICY IF EXISTS "public_view_modules" ON public.modules;
CREATE POLICY "public_view_modules"
ON public.modules
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = modules.course_id 
    AND c.verification_status = 'approved'
  )
);

-- Coaches can manage their own modules
DROP POLICY IF EXISTS "coaches_manage_modules" ON public.modules;
CREATE POLICY "coaches_manage_modules"
ON public.modules
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = modules.course_id 
    AND c.coach_id = auth.uid()
  )
);

-- ============================================
-- MODULE_CONTENT_ITEMS POLICIES
-- ============================================

-- Public can view published content items from approved courses
DROP POLICY IF EXISTS "public_view_module_content" ON public.module_content_items;
CREATE POLICY "public_view_module_content"
ON public.module_content_items
FOR SELECT
TO public
USING (
  is_published = true AND
  EXISTS (
    SELECT 1 FROM modules m
    JOIN courses c ON c.id = m.course_id
    WHERE m.id = module_content_items.module_id
    AND c.verification_status = 'approved'
  )
);

-- Coaches can manage their own content items
DROP POLICY IF EXISTS "coaches_manage_module_content" ON public.module_content_items;
CREATE POLICY "coaches_manage_module_content"
ON public.module_content_items
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM modules m
    JOIN courses c ON c.id = m.course_id
    WHERE m.id = module_content_items.module_id
    AND c.coach_id = auth.uid()
  )
);

-- ============================================
-- LESSONS POLICIES
-- ============================================

-- Public can view published lessons from approved courses
DROP POLICY IF EXISTS "public_view_published_lessons" ON public.lessons;
CREATE POLICY "public_view_published_lessons"
ON public.lessons
FOR SELECT
TO public
USING (
  is_published = true AND
  EXISTS (
    SELECT 1 FROM module_content_items mci
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE mci.content_type = 'lesson'
    AND mci.content_id = lessons.id
    AND c.verification_status = 'approved'
  )
);

-- Coaches can manage their own lessons
DROP POLICY IF EXISTS "coaches_manage_lessons" ON public.lessons;
CREATE POLICY "coaches_manage_lessons"
ON public.lessons
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM module_content_items mci
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE mci.content_type = 'lesson'
    AND mci.content_id = lessons.id
    AND c.coach_id = auth.uid()
  )
);

-- ============================================
-- QUIZZES POLICIES
-- ============================================

-- Public can view published quizzes from approved courses
DROP POLICY IF EXISTS "public_view_published_quizzes" ON public.quizzes;
CREATE POLICY "public_view_published_quizzes"
ON public.quizzes
FOR SELECT
TO public
USING (
  is_published = true AND
  EXISTS (
    SELECT 1 FROM module_content_items mci
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE mci.content_type = 'quiz'
    AND mci.content_id = quizzes.id
    AND c.verification_status = 'approved'
  )
);

-- Coaches can manage their own quizzes
DROP POLICY IF EXISTS "coaches_manage_quizzes" ON public.quizzes;
CREATE POLICY "coaches_manage_quizzes"
ON public.quizzes
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM module_content_items mci
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE mci.content_type = 'quiz'
    AND mci.content_id = quizzes.id
    AND c.coach_id = auth.uid()
  )
);

-- Quiz questions: Public can view questions in published quizzes
DROP POLICY IF EXISTS "public_view_quiz_questions" ON public.quiz_questions;
CREATE POLICY "public_view_quiz_questions"
ON public.quiz_questions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM quizzes q
    JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE q.id = quiz_questions.quiz_id
    AND q.is_published = true
    AND c.verification_status = 'approved'
  )
);

-- Coaches can manage their own quiz questions
DROP POLICY IF EXISTS "coaches_manage_quiz_questions" ON public.quiz_questions;
CREATE POLICY "coaches_manage_quiz_questions"
ON public.quiz_questions
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM quizzes q
    JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE q.id = quiz_questions.quiz_id
    AND c.coach_id = auth.uid()
  )
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('courses', 'modules', 'module_content_items', 'lessons', 'quizzes', 'quiz_questions')
ORDER BY tablename, policyname;
