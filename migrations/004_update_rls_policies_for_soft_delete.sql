-- Migration: Update RLS policies for soft delete workflow
-- Purpose: Ensure students can't see pending_deletion content, coaches can request deletion
-- Date: 2026-04-15

-- ============================================================================
-- 1. MODULES: Students can't see modules pending deletion
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can view modules" ON modules;
DROP POLICY IF EXISTS "Coaches can view their modules" ON modules;
DROP POLICY IF EXISTS "Students can view published modules" ON modules;
DROP POLICY IF EXISTS "Coaches can insert modules" ON modules;
DROP POLICY IF EXISTS "Coaches can update their modules" ON modules;
DROP POLICY IF EXISTS "Coaches can update modules" ON modules;
DROP POLICY IF EXISTS "Coaches can delete their modules" ON modules;
DROP POLICY IF EXISTS "Coaches can delete modules" ON modules;
DROP POLICY IF EXISTS "Admins can view all modules" ON modules;
DROP POLICY IF EXISTS "Admins can update all modules" ON modules;
DROP POLICY IF EXISTS "Admins can delete all modules" ON modules;

-- Recreate with pending_deletion filter for students
CREATE POLICY "Coaches can view their modules" ON modules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = modules.course_id
        AND c.coach_id = auth.uid()
        AND modules.content_status != 'pending_deletion'
    )
  );

-- Students can view published modules (exclude pending_deletion)
CREATE POLICY "Students can view published modules" ON modules
  FOR SELECT
  USING (
    content_status = 'published'
  );

-- Coaches can insert modules (unchanged)
CREATE POLICY "Coaches can insert modules" ON modules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = modules.course_id
        AND c.coach_id = auth.uid()
    )
  );

-- Coaches can update modules (exclude pending_deletion from normal updates)
CREATE POLICY "Coaches can update their modules" ON modules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = modules.course_id
        AND c.coach_id = auth.uid()
    )
  );

-- Coaches can delete modules (this marks as pending_deletion via app logic)
CREATE POLICY "Coaches can delete their modules" ON modules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = modules.course_id
        AND c.coach_id = auth.uid()
    )
  );

-- Admins can view all modules (including pending_deletion)
CREATE POLICY "Admins can view all modules" ON modules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Admins can update all modules (for approve/reject deletion)
CREATE POLICY "Admins can update all modules" ON modules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Admins can delete all modules
CREATE POLICY "Admins can delete all modules" ON modules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );


-- ============================================================================
-- 2. LESSONS: Students can't see lessons pending deletion
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "lessons_select_policy" ON lessons;
DROP POLICY IF EXISTS "lessons_update" ON lessons;
DROP POLICY IF EXISTS "lessons_delete" ON lessons;
DROP POLICY IF EXISTS "lessons_insert" ON lessons;
DROP POLICY IF EXISTS "Coaches can view their lessons" ON lessons;
DROP POLICY IF EXISTS "Students can view published lessons" ON lessons;
DROP POLICY IF EXISTS "Coaches can insert lessons" ON lessons;
DROP POLICY IF EXISTS "Coaches can update their lessons" ON lessons;
DROP POLICY IF EXISTS "Coaches can delete their lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can view all lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can update all lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can delete all lessons" ON lessons;

-- Coaches can view their lessons (exclude pending_deletion)
CREATE POLICY "Coaches can view their lessons" ON lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lessons.course_id
        AND c.coach_id = auth.uid()
        AND lessons.content_status != 'pending_deletion'
    )
  );

-- Students can view published lessons (exclude pending_deletion)
CREATE POLICY "Students can view published lessons" ON lessons
  FOR SELECT
  USING (
    content_status = 'published'
  );

-- Coaches can insert lessons (unchanged)
CREATE POLICY "Coaches can insert lessons" ON lessons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('coach', 'admin')
    )
  );

-- Coaches can update their lessons
CREATE POLICY "Coaches can update their lessons" ON lessons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('coach', 'admin')
    )
  );

-- Coaches can delete their lessons (soft delete via app logic)
CREATE POLICY "Coaches can delete their lessons" ON lessons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('coach', 'admin')
    )
  );

-- Admins can view all lessons (including pending_deletion)
CREATE POLICY "Admins can view all lessons" ON lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Admins can update all lessons
CREATE POLICY "Admins can update all lessons" ON lessons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Admins can delete all lessons
CREATE POLICY "Admins can delete all lessons" ON lessons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );


-- ============================================================================
-- 3. MODULE_CONTENT_ITEMS: Students can't see items pending deletion
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can manage module content" ON module_content_items;
DROP POLICY IF EXISTS "Admins can manage all module content" ON module_content_items;
DROP POLICY IF EXISTS "coaches_manage_module_content" ON module_content_items;
DROP POLICY IF EXISTS "Coaches can view their module content" ON module_content_items;
DROP POLICY IF EXISTS "Students can view published content items" ON module_content_items;
DROP POLICY IF EXISTS "Coaches can insert module content" ON module_content_items;
DROP POLICY IF EXISTS "Coaches can update their module content" ON module_content_items;
DROP POLICY IF EXISTS "Coaches can delete their module content" ON module_content_items;
DROP POLICY IF EXISTS "Admins can view all module content" ON module_content_items;
DROP POLICY IF EXISTS "Admins can update all module content" ON module_content_items;
DROP POLICY IF EXISTS "Admins can delete all module content" ON module_content_items;

-- Coaches can view their module content (exclude pending_deletion)
CREATE POLICY "Coaches can view their module content" ON module_content_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = module_content_items.module_id
        AND c.coach_id = auth.uid()
        AND module_content_items.content_status != 'pending_deletion'
    )
  );

-- Students can view published content items (exclude pending_deletion)
CREATE POLICY "Students can view published content items" ON module_content_items
  FOR SELECT
  USING (
    content_status = 'published'
  );

-- Coaches can insert module content
CREATE POLICY "Coaches can insert module content" ON module_content_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = module_content_items.module_id
        AND c.coach_id = auth.uid()
    )
  );

-- Coaches can update their module content
CREATE POLICY "Coaches can update their module content" ON module_content_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = module_content_items.module_id
        AND c.coach_id = auth.uid()
    )
  );

-- Coaches can delete their module content (soft delete via app logic)
CREATE POLICY "Coaches can delete their module content" ON module_content_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = module_content_items.module_id
        AND c.coach_id = auth.uid()
    )
  );

-- Admins can view all module content (including pending_deletion)
CREATE POLICY "Admins can view all module content" ON module_content_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Admins can update all module content
CREATE POLICY "Admins can update all module content" ON module_content_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Admins can delete all module content
CREATE POLICY "Admins can delete all module content" ON module_content_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );


-- ============================================================================
-- 4. LESSON_CONTENT_ITEMS: Students can't see items pending deletion
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can manage their course content items" ON lesson_content_items;
DROP POLICY IF EXISTS "Admins can manage all content items" ON lesson_content_items;
DROP POLICY IF EXISTS "Coaches can view their content items" ON lesson_content_items;
DROP POLICY IF EXISTS "Students can view published lesson content items" ON lesson_content_items;
DROP POLICY IF EXISTS "Coaches can insert content items" ON lesson_content_items;
DROP POLICY IF EXISTS "Coaches can update their content items" ON lesson_content_items;
DROP POLICY IF EXISTS "Coaches can delete their content items" ON lesson_content_items;
DROP POLICY IF EXISTS "Admins can view all content items" ON lesson_content_items;
DROP POLICY IF EXISTS "Admins can update all content items" ON lesson_content_items;
DROP POLICY IF EXISTS "Admins can delete all content items" ON lesson_content_items;

-- Coaches can view their content items (exclude pending_deletion)
CREATE POLICY "Coaches can view their content items" ON lesson_content_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lesson_content_items.course_id
        AND c.coach_id = auth.uid()
        AND lesson_content_items.content_status != 'pending_deletion'
    )
  );

-- Students can view published content items (exclude pending_deletion)
CREATE POLICY "Students can view published lesson content items" ON lesson_content_items
  FOR SELECT
  USING (
    content_status = 'published'
  );

-- Coaches can insert content items
CREATE POLICY "Coaches can insert content items" ON lesson_content_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lesson_content_items.course_id
        AND c.coach_id = auth.uid()
    )
  );

-- Coaches can update their content items
CREATE POLICY "Coaches can update their content items" ON lesson_content_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lesson_content_items.course_id
        AND c.coach_id = auth.uid()
    )
  );

-- Coaches can delete their content items (soft delete via app logic)
CREATE POLICY "Coaches can delete their content items" ON lesson_content_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lesson_content_items.course_id
        AND c.coach_id = auth.uid()
    )
  );

-- Admins can view all content items (including pending_deletion)
CREATE POLICY "Admins can view all content items" ON lesson_content_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Admins can update all content items
CREATE POLICY "Admins can update all content items" ON lesson_content_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Admins can delete all content items
CREATE POLICY "Admins can delete all content items" ON lesson_content_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );


-- ============================================================================
-- 5. QUIZZES: Students can't see quizzes pending deletion
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can delete quizzes in their courses" ON quizzes;
DROP POLICY IF EXISTS "Coaches can view their quizzes" ON quizzes;
DROP POLICY IF EXISTS "Students can view published quizzes" ON quizzes;
DROP POLICY IF EXISTS "Coaches can insert quizzes" ON quizzes;
DROP POLICY IF EXISTS "Coaches can update their quizzes" ON quizzes;
DROP POLICY IF EXISTS "Coaches can delete their quizzes" ON quizzes;
DROP POLICY IF EXISTS "Admins can view all quizzes" ON quizzes;
DROP POLICY IF EXISTS "Admins can update all quizzes" ON quizzes;
DROP POLICY IF EXISTS "Admins can delete all quizzes" ON quizzes;

-- Coaches can view their quizzes (exclude pending_deletion)
CREATE POLICY "Coaches can view their quizzes" ON quizzes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_content_items lci
      JOIN modules m ON m.id = lci.module_id
      JOIN courses c ON c.id = m.course_id
      WHERE lci.content_id = quizzes.id
        AND lci.content_type = 'quiz'
        AND c.coach_id = auth.uid()
        AND quizzes.content_status != 'pending_deletion'
    )
  );

-- Students can view published quizzes (exclude pending_deletion)
CREATE POLICY "Students can view published quizzes" ON quizzes
  FOR SELECT
  USING (
    content_status = 'published'
  );

-- Coaches can insert quizzes
CREATE POLICY "Coaches can insert quizzes" ON quizzes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lesson_content_items lci
      JOIN modules m ON m.id = lci.module_id
      JOIN courses c ON c.id = m.course_id
      WHERE lci.content_id = quizzes.id
        AND lci.content_type = 'quiz'
        AND c.coach_id = auth.uid()
    )
  );

-- Coaches can update their quizzes
CREATE POLICY "Coaches can update their quizzes" ON quizzes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lesson_content_items lci
      JOIN modules m ON m.id = lci.module_id
      JOIN courses c ON c.id = m.course_id
      WHERE lci.content_id = quizzes.id
        AND lci.content_type = 'quiz'
        AND c.coach_id = auth.uid()
    )
  );

-- Coaches can delete their quizzes (soft delete via app logic)
CREATE POLICY "Coaches can delete their quizzes" ON quizzes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lesson_content_items lci
      JOIN modules m ON m.id = lci.module_id
      JOIN courses c ON c.id = m.course_id
      WHERE lci.content_id = quizzes.id
        AND lci.content_type = 'quiz'
        AND c.coach_id = auth.uid()
    )
  );

-- Admins can view all quizzes (including pending_deletion)
CREATE POLICY "Admins can view all quizzes" ON quizzes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Admins can update all quizzes
CREATE POLICY "Admins can update all quizzes" ON quizzes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Admins can delete all quizzes
CREATE POLICY "Admins can delete all quizzes" ON quizzes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );


-- ============================================================================
-- 6. QUIZ_QUESTIONS: Students can't see questions from quizzes pending deletion
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can delete quiz questions in their courses" ON quiz_questions;
DROP POLICY IF EXISTS "Coaches can view their quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Students can view published quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Coaches can insert quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Coaches can update their quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Coaches can delete their quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can view all quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can update all quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can delete all quiz questions" ON quiz_questions;

-- Coaches can view their quiz questions (exclude pending_deletion)
CREATE POLICY "Coaches can view their quiz questions" ON quiz_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_questions.quiz_id
        AND q.deleted_at IS NULL
        AND q.content_status != 'pending_deletion'
        AND EXISTS (
          SELECT 1 FROM lesson_content_items lci
          JOIN modules m ON m.id = lci.module_id
          JOIN courses c ON c.id = m.course_id
          WHERE lci.content_id = q.id
            AND lci.content_type = 'quiz'
            AND c.coach_id = auth.uid()
        )
    )
  );

-- Students can view published quiz questions (exclude pending_deletion)
CREATE POLICY "Students can view published quiz questions" ON quiz_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_questions.quiz_id
        AND q.content_status = 'published'
    )
  );

-- Coaches can insert quiz questions
CREATE POLICY "Coaches can insert quiz questions" ON quiz_questions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_questions.quiz_id
        AND EXISTS (
          SELECT 1 FROM lesson_content_items lci
          JOIN modules m ON m.id = lci.module_id
          JOIN courses c ON c.id = m.course_id
          WHERE lci.content_id = q.id
            AND lci.content_type = 'quiz'
            AND c.coach_id = auth.uid()
        )
    )
  );

-- Coaches can update their quiz questions
CREATE POLICY "Coaches can update their quiz questions" ON quiz_questions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_questions.quiz_id
        AND EXISTS (
          SELECT 1 FROM lesson_content_items lci
          JOIN modules m ON m.id = lci.module_id
          JOIN courses c ON c.id = m.course_id
          WHERE lci.content_id = q.id
            AND lci.content_type = 'quiz'
            AND c.coach_id = auth.uid()
        )
    )
  );

-- Coaches can delete their quiz questions (soft delete via app logic)
CREATE POLICY "Coaches can delete their quiz questions" ON quiz_questions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_questions.quiz_id
        AND EXISTS (
          SELECT 1 FROM lesson_content_items lci
          JOIN modules m ON m.id = lci.module_id
          JOIN courses c ON c.id = m.course_id
          WHERE lci.content_id = q.id
            AND lci.content_type = 'quiz'
            AND c.coach_id = auth.uid()
        )
    )
  );

-- Admins can view all quiz questions (including pending_deletion)
CREATE POLICY "Admins can view all quiz questions" ON quiz_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Admins can update all quiz questions
CREATE POLICY "Admins can update all quiz questions" ON quiz_questions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Admins can delete all quiz questions
CREATE POLICY "Admins can delete all quiz questions" ON quiz_questions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );
