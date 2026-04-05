-- ============================================
-- FIX: Lesson/Quiz Insert Timeout & RLS Issues
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- PART 0: CRITICAL - Add Index to Fix Timeout
-- ============================================
-- This is the MAIN cause of the timeout. The trigger trg_reset_lesson_completion_on_content_change
-- runs: DELETE FROM user_lesson_progress WHERE lesson_id = ...
-- Without this index, it scans the ENTIRE table on every INSERT.

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id 
ON public.user_lesson_progress(lesson_id);

-- Also add supporting indexes for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_courses_coach_id ON public.courses(coach_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_content_items_course_id ON public.lesson_content_items(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_content_items_lesson_id ON public.lesson_content_items(lesson_id);

-- PART 1: Fix RLS Policies (remove slow subqueries)
-- ============================================

-- Drop slow policies
DROP POLICY IF EXISTS "coaches_insert_lessons" ON public.lessons;
DROP POLICY IF EXISTS "coaches_insert_quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "coaches_insert_content_items" ON public.lesson_content_items;

-- Fast INSERT policy for lessons - just check if user is coach/admin
CREATE POLICY "coaches_insert_lessons"
ON public.lessons
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('coach', 'admin')
  )
);

-- Fast INSERT policy for quizzes
CREATE POLICY "coaches_insert_quizzes"
ON public.quizzes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('coach', 'admin')
  )
);

-- Fast INSERT policy for lesson_content_items
CREATE POLICY "coaches_insert_content_items"
ON public.lesson_content_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('coach', 'admin')
  )
);

-- PART 2: Remove Problematic Triggers
-- ============================================

-- CRITICAL: This trigger causes the timeout by running DELETE on user_lesson_progress
-- for EVERY content item insert. Drop it unless you really need automatic progress reset.
DROP TRIGGER IF EXISTS trg_reset_lesson_completion_on_content_change ON public.lesson_content_items;

-- These triggers fire on lessons/quizzes INSERT but try to find 
-- module_content_items that don't exist yet (causing NULL lookups)
-- Course verification is already handled by module_content_items triggers
DROP TRIGGER IF EXISTS trg_lessons_change ON public.lessons;
DROP TRIGGER IF EXISTS trg_quizzes_change ON public.quizzes;

-- PART 3: Verify Changes
-- ============================================

-- Check new policies
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('lessons', 'quizzes', 'lesson_content_items')
AND policyname LIKE 'coaches_insert%'
ORDER BY tablename;

-- Check triggers are removed
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name IN ('trg_lessons_change', 'trg_quizzes_change', 'trg_reset_lesson_completion_on_content_change');

-- Check indexes exist
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename;

-- Done! Try adding a video again - should be instant now.
