-- =====================================================
-- Migration: Fix conflicting RLS policies on modules
-- =====================================================
-- ISSUE: The "public_modules" policy (ALL permissions)
-- allows students to see ALL modules when course is approved,
-- bypassing the content_status = 'published' check.
--
-- FIX: Drop the conflicting policy, keep only the
-- student-facing SELECT policy that checks content_status.
-- =====================================================

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "public_modules" ON public.modules;
DROP POLICY IF EXISTS "public_view_modules" ON public.modules;

-- Ensure the student-facing SELECT policy exists and is correct
DROP POLICY IF EXISTS "Modules are viewable by everyone" ON public.modules;

CREATE POLICY "Modules are viewable by everyone"
ON public.modules FOR SELECT
USING (
  content_status = 'published'
  AND EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = modules.course_id
    AND c.verification_status = 'approved'
  )
);

-- Ensure coach policy exists for management
DROP POLICY IF EXISTS "coaches_manage_modules" ON public.modules;

CREATE POLICY "coaches_manage_modules"
ON public.modules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = modules.course_id
    AND c.coach_id = auth.uid()
  )
);

-- =====================================================
-- Fix lessons policies (NO SELECT POLICY EXISTS!)
-- =====================================================
DROP POLICY IF EXISTS "public_lessons" ON public.lessons;
DROP POLICY IF EXISTS "public_view_lessons" ON public.lessons;
DROP POLICY IF EXISTS "lessons_select" ON public.lessons;

CREATE POLICY "lessons_select"
ON public.lessons FOR SELECT
USING (
  content_status = 'published'
  AND EXISTS (
    SELECT 1 FROM module_content_items mci
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE mci.content_id = lessons.id
    AND mci.content_type = 'lesson'
    AND c.verification_status = 'approved'
    AND mci.content_status = 'published'
  )
);

-- Also add coach/admin select access
CREATE POLICY "lessons_select_coach_admin"
ON public.lessons FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('coach', 'admin')
);

-- =====================================================
-- Fix same issue on module_content_items table
-- =====================================================
DROP POLICY IF EXISTS "public_module_content_items" ON public.module_content_items;
DROP POLICY IF EXISTS "public_view_module_content_items" ON public.module_content_items;

-- Ensure student-facing policy exists and is correct
DROP POLICY IF EXISTS "public_view_module_content" ON public.module_content_items;

CREATE POLICY "public_view_module_content"
ON public.module_content_items FOR SELECT
USING (
  content_status = 'published'
  AND EXISTS (
    SELECT 1 FROM modules m
    JOIN courses c ON c.id = m.course_id
    WHERE m.id = module_content_items.module_id
    AND c.verification_status = 'approved'
  )
);

-- =====================================================
-- Fix same issue on lesson_content_items table
-- =====================================================
DROP POLICY IF EXISTS "public_lesson_content_items" ON public.lesson_content_items;
DROP POLICY IF EXISTS "public_view_lesson_content_items" ON public.lesson_content_items;

-- Ensure student-facing policy exists and is correct
DROP POLICY IF EXISTS "Anyone can view published lesson content items" ON public.lesson_content_items;

CREATE POLICY "Anyone can view published lesson content items"
ON public.lesson_content_items FOR SELECT
USING (content_status = 'published');

-- =====================================================
-- Fix same issue on quizzes table
-- =====================================================
DROP POLICY IF EXISTS "public_quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "public_view_quizzes" ON public.quizzes;

-- =====================================================
-- Fix lessons_select policy (STILL uses is_published!)
-- =====================================================
DROP POLICY IF EXISTS "lessons_select" ON public.lessons;

CREATE POLICY "lessons_select"
ON public.lessons FOR SELECT
USING (
  content_status = 'published'
  AND EXISTS (
    SELECT 1 FROM module_content_items mci
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE mci.content_id = lessons.id
    AND mci.content_type = 'lesson'
    AND c.verification_status = 'approved'
    AND mci.content_status = 'published'
  )
);
