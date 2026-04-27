-- Migration: Fix Quiz Submissions RLS for Coaches to include quizzes in lessons
-- Created: 2026-04-23

DROP POLICY IF EXISTS "Coaches can view submissions for their quizzes" ON quiz_submissions;

CREATE POLICY "Coaches can view submissions for their quizzes"
  ON quiz_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      LEFT JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
      LEFT JOIN lesson_content_items lci ON lci.content_id = q.id AND lci.content_type = 'quiz'
      LEFT JOIN modules m ON m.id = mci.module_id
      LEFT JOIN lessons l ON l.id = lci.lesson_id
      LEFT JOIN modules m2 ON m2.id = l.module_id
      LEFT JOIN courses c ON c.id = COALESCE(m.course_id, m2.course_id)
      WHERE q.id = quiz_submissions.quiz_id
        AND c.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can update submissions for their quizzes" ON quiz_submissions;

CREATE POLICY "Coaches can update submissions for their quizzes"
  ON quiz_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      LEFT JOIN module_content_items mci ON mci.content_id = q.id AND mci.content_type = 'quiz'
      LEFT JOIN lesson_content_items lci ON lci.content_id = q.id AND lci.content_type = 'quiz'
      LEFT JOIN modules m ON m.id = mci.module_id
      LEFT JOIN lessons l ON l.id = lci.lesson_id
      LEFT JOIN modules m2 ON m2.id = l.module_id
      LEFT JOIN courses c ON c.id = COALESCE(m.course_id, m2.course_id)
      WHERE q.id = quiz_submissions.quiz_id
        AND c.coach_id = auth.uid()
    )
  );
