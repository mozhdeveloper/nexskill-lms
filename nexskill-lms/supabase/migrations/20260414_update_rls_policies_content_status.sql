-- =====================================================
-- Migration: Update RLS Policies to use content_status
-- =====================================================
-- Replaces is_published checks with content_status = 'published'
-- in all student-facing policies.
--
-- Coach and admin policies remain unchanged (they can see all content).
-- =====================================================

-- ─────────────────────────────────────────────────────────
-- 1. Update modules student-facing policy
-- ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Modules are viewable by everyone" ON public.modules;

CREATE POLICY "Modules are viewable by everyone"
ON public.modules FOR SELECT
USING (content_status = 'published');

-- ─────────────────────────────────────────────────────────
-- 2. Update module_content_items student-facing policies
-- ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "View module content based on publish status and coach role" ON public.module_content_items;
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

-- ─────────────────────────────────────────────────────────
-- 3. Update lesson_content_items student-facing policy
-- ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view published lesson content items" ON public.lesson_content_items;

CREATE POLICY "Anyone can view published lesson content items"
ON public.lesson_content_items FOR SELECT
USING (content_status = 'published');

-- ─────────────────────────────────────────────────────────
-- 4. Update quizzes student-facing policy
-- ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_view_quizzes" ON public.quizzes;

CREATE POLICY "authenticated_view_quizzes"
ON public.quizzes FOR SELECT
USING (content_status = 'published');

-- ─────────────────────────────────────────────────────────
-- 5. Update public_view_quiz_questions to use content_status
-- ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_view_quiz_questions" ON public.quiz_questions;

CREATE POLICY "public_view_quiz_questions"
ON public.quiz_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quizzes q
    JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE q.id = quiz_questions.quiz_id
    AND q.content_status = 'published'
    AND c.verification_status = 'approved'
  )
);

-- ─────────────────────────────────────────────────────────
-- 6. Update comments
-- ─────────────────────────────────────────────────────────
COMMENT ON POLICY "Modules are viewable by everyone" ON public.modules IS
  'Students can only see modules where content_status = published';

COMMENT ON POLICY "public_view_module_content" ON public.module_content_items IS
  'Students can only see content items where content_status = published AND course is approved';

COMMENT ON POLICY "Anyone can view published lesson content items" ON public.lesson_content_items IS
  'Students can only see lesson content items where content_status = published';

COMMENT ON POLICY "authenticated_view_quizzes" ON public.quizzes IS
  'Students can only see quizzes where content_status = published';

COMMENT ON POLICY "public_view_quiz_questions" ON public.quiz_questions IS
  'Students can only see quiz questions for published quizzes in approved courses';
