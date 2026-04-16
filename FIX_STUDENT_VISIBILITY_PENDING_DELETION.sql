-- Keep pending_deletion learner-visible until admin approval.
-- This matches a staged moderation workflow: learners continue seeing the last approved version
-- until an admin actually approves the deletion.
-- Run this in Supabase SQL Editor.

BEGIN;

-- MODULES
DROP POLICY IF EXISTS "Students can view published modules" ON public.modules;
CREATE POLICY "Students can view published modules" ON public.modules
  FOR SELECT
  USING (
    content_status IN ('published', 'pending_deletion')
  );

-- LESSONS
DROP POLICY IF EXISTS "Students can view published lessons" ON public.lessons;
CREATE POLICY "Students can view published lessons" ON public.lessons
  FOR SELECT
  USING (
    content_status IN ('published', 'pending_deletion')
  );

-- MODULE CONTENT ITEMS
DROP POLICY IF EXISTS "Students can view published content items" ON public.module_content_items;
CREATE POLICY "Students can view published content items" ON public.module_content_items
  FOR SELECT
  USING (
    content_status IN ('published', 'pending_deletion')
  );

-- LESSON CONTENT ITEMS
DROP POLICY IF EXISTS "Students can view published lesson content items" ON public.lesson_content_items;
CREATE POLICY "Students can view published lesson content items" ON public.lesson_content_items
  FOR SELECT
  USING (
    content_status IN ('published', 'pending_deletion')
  );

-- QUIZZES
DROP POLICY IF EXISTS "Students can view published quizzes" ON public.quizzes;
CREATE POLICY "Students can view published quizzes" ON public.quizzes
  FOR SELECT
  USING (
    content_status IN ('published', 'pending_deletion')
  );

-- QUIZ QUESTIONS: keep learner access for quizzes that are still learner-visible
DROP POLICY IF EXISTS "Students can view published quiz questions" ON public.quiz_questions;
CREATE POLICY "Students can view published quiz questions" ON public.quiz_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.quizzes q
      WHERE q.id = quiz_questions.quiz_id
        AND q.content_status IN ('published', 'pending_deletion')
    )
  );

COMMIT;

SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('modules', 'lessons', 'module_content_items', 'lesson_content_items', 'quizzes', 'quiz_questions')
  AND policyname IN (
    'Students can view published modules',
    'Students can view published lessons',
    'Students can view published content items',
    'Students can view published lesson content items',
    'Students can view published quizzes',
    'Students can view published quiz questions'
  )
ORDER BY tablename, policyname;
