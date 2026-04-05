-- Clean up ALL existing curriculum RLS policies and recreate properly
-- This ensures no conflicting policies exist

-- ============================================
-- DROP ALL EXISTING CURRICULUM POLICIES
-- ============================================

-- Courses policies
DROP POLICY IF EXISTS "anyone_view_approved_courses" ON public.courses;
DROP POLICY IF EXISTS "coaches_view_own_courses" ON public.courses;
DROP POLICY IF EXISTS "admin_full_courses" ON public.courses;
DROP POLICY IF EXISTS "coaches_insert_courses" ON public.courses;
DROP POLICY IF EXISTS "coaches_update_own_courses" ON public.courses;
DROP POLICY IF EXISTS "coaches_can_delete_course" ON public.courses;

-- Modules policies  
DROP POLICY IF EXISTS "Modules are viewable by everyone" ON public.modules;
DROP POLICY IF EXISTS "public_modules" ON public.modules;
DROP POLICY IF EXISTS "public_view_modules" ON public.modules;
DROP POLICY IF EXISTS "coaches_manage_modules" ON public.modules;
DROP POLICY IF EXISTS "Coaches can view modules" ON public.modules;
DROP POLICY IF EXISTS "Coaches can insert modules" ON public.modules;
DROP POLICY IF EXISTS "Coaches can update modules" ON public.modules;
DROP POLICY IF EXISTS "Coaches can delete modules" ON public.modules;

-- Module content items policies
DROP POLICY IF EXISTS "View module content based on publish status and coach role" ON public.module_content_items;
DROP POLICY IF EXISTS "public_view_module_content" ON public.module_content_items;
DROP POLICY IF EXISTS "coaches_manage_module_content" ON public.module_content_items;
DROP POLICY IF EXISTS "Coaches can manage module content" ON public.module_content_items;
DROP POLICY IF EXISTS "Admins can manage all module content" ON public.module_content_items;

-- Lessons policies
DROP POLICY IF EXISTS "Public can view published lessons" ON public.lessons;
DROP POLICY IF EXISTS "public_lessons" ON public.lessons;
DROP POLICY IF EXISTS "public_view_published_lessons" ON public.lessons;
DROP POLICY IF EXISTS "coaches_manage_lessons" ON public.lessons;
DROP POLICY IF EXISTS "Coaches can manage lessons in their courses" ON public.lessons;
DROP POLICY IF EXISTS "Coaches can delete lessons in their courses" ON public.lessons;

-- Quizzes policies
DROP POLICY IF EXISTS "public_view_published_quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "coaches_manage_quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Coaches can delete quizzes in their courses" ON public.quizzes;

-- Quiz questions policies
DROP POLICY IF EXISTS "public_view_quiz_questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "coaches_manage_quiz_questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Coaches can delete quiz questions in their courses" ON public.quiz_questions;

-- ============================================
-- RECREATE CLEAN POLICIES
-- ============================================

-- Enable RLS (just in case)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COURSES POLICIES
-- ============================================

-- 1. Anyone can view approved courses
CREATE POLICY "anyone_view_approved_courses"
ON public.courses
FOR SELECT
TO public
USING (verification_status = 'approved');

-- 2. Coaches and admins can view their own courses (including drafts)
CREATE POLICY "coaches_view_own_courses"
ON public.courses
FOR SELECT
TO public
USING (
  coach_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coach')
  )
);

-- 3. Coaches can insert courses
CREATE POLICY "coaches_insert_courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (
  coach_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coach')
  )
);

-- 4. Coaches can update their own courses, admins can update any
CREATE POLICY "coaches_update_own_courses"
ON public.courses
FOR UPDATE
TO authenticated
USING (
  coach_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 5. Coaches can delete their own courses, admins can delete any
CREATE POLICY "coaches_delete_courses"
ON public.courses
FOR DELETE
TO public
USING (
  coach_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 6. Admins can do anything with courses
CREATE POLICY "admin_full_courses"
ON public.courses
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- MODULES POLICIES
-- ============================================

-- 1. Anyone can view modules from approved courses
CREATE POLICY "anyone_view_modules"
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

-- 2. Coaches can manage modules in their own courses
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

-- 3. Admins can manage all modules
CREATE POLICY "admin_manage_modules"
ON public.modules
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- ============================================
-- MODULE_CONTENT_ITEMS POLICIES
-- ============================================

-- 1. Anyone can view published content items from approved courses
CREATE POLICY "anyone_view_module_content"
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

-- 2. Coaches can manage content items in their own courses
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

-- 3. Admins can manage all content items
CREATE POLICY "admin_manage_module_content"
ON public.module_content_items
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- ============================================
-- LESSONS POLICIES
-- ============================================

-- 1. Anyone can view published lessons from approved courses
CREATE POLICY "anyone_view_lessons"
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

-- 2. Coaches can manage lessons in their own courses
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

-- 3. Admins can manage all lessons
CREATE POLICY "admin_manage_lessons"
ON public.lessons
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- ============================================
-- QUIZZES POLICIES
-- ============================================

-- 1. Anyone can view published quizzes from approved courses
CREATE POLICY "anyone_view_quizzes"
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

-- 2. Coaches can manage quizzes in their own courses
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

-- 3. Admins can manage all quizzes
CREATE POLICY "admin_manage_quizzes"
ON public.quizzes
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- ============================================
-- QUIZ QUESTIONS POLICIES
-- ============================================

-- 1. Anyone can view questions in published quizzes from approved courses
CREATE POLICY "anyone_view_quiz_questions"
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

-- 2. Coaches can manage quiz questions in their own courses
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

-- 3. Admins can manage all quiz questions
CREATE POLICY "admin_manage_quiz_questions"
ON public.quiz_questions
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- ============================================
-- VERIFY POLICIES
-- ============================================

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('courses', 'modules', 'module_content_items', 'lessons', 'quizzes', 'quiz_questions')
ORDER BY tablename, policyname;
