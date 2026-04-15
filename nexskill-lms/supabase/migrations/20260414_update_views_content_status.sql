-- =====================================================
-- Migration: Update views to use content_status
-- =====================================================
-- Replaces is_published with content_status in views
-- =====================================================

-- ─────────────────────────────────────────────────────────
-- 1. Update module_content_with_data view
--    Must DROP first because we're renaming columns
-- ─────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.module_content_with_data;

CREATE VIEW public.module_content_with_data AS
SELECT
  -- From module_content_items
  mci.id,
  mci.module_id,
  mci.content_type,
  mci.content_id,
  mci.position,
  mci.content_status as item_content_status,
  mci.created_at as item_created_at,
  mci.updated_at as item_updated_at,

  -- Lesson fields (null if not a lesson)
  l.id as lesson_id,
  l.title as lesson_title,
  l.description as lesson_description,
  l.content_blocks,
  l.estimated_duration_minutes,
  l.content_status as lesson_content_status,
  l.created_at as lesson_created_at,
  l.updated_at as lesson_updated_at,

  -- Quiz fields (null if not a quiz)
  q.id as quiz_id,
  q.title as quiz_title,
  q.description as quiz_description,
  q.instructions,
  q.passing_score,
  q.time_limit_minutes,
  q.max_attempts as quiz_max_attempts,
  q.requires_manual_grading as quiz_requires_manual_grading,
  q.content_status as quiz_content_status,
  q.created_at as quiz_created_at,
  q.updated_at as quiz_updated_at

FROM public.module_content_items mci
LEFT JOIN public.lessons l
  ON mci.content_type = 'lesson'
  AND mci.content_id = l.id
LEFT JOIN public.quizzes q
  ON mci.content_type = 'quiz'
  AND mci.content_id = q.id;

-- ─────────────────────────────────────────────────────────
-- 2. Update lesson_content_items_with_data view
--    Must DROP first because we're renaming columns
-- ─────────────────────────────────────────────────────────
DROP VIEW IF EXISTS lesson_content_items_with_data;

CREATE VIEW lesson_content_items_with_data AS
SELECT
    lci.id,
    lci.lesson_id,
    lci.course_id,
    lci.module_id,
    lci.content_type,
    lci.content_id,
    lci.metadata,
    lci."position",
    lci.content_status,
    lci.created_at,
    lci.updated_at,
    l.title AS lesson_title,
    l.description AS lesson_description,
    l.estimated_duration_minutes,
    l.content_status AS lesson_content_status,
    q.title AS quiz_title,
    q.description AS quiz_description,
    q.instructions,
    q.passing_score,
    q.time_limit_minutes,
    q.max_attempts AS quiz_max_attempts,
    q.requires_manual_grading AS quiz_requires_manual_grading,
    q.content_status AS quiz_content_status
FROM lesson_content_items lci
LEFT JOIN lessons l ON lci.lesson_id = l.id
LEFT JOIN quizzes q ON lci.content_type = 'quiz' AND lci.content_id = q.id;

-- ─────────────────────────────────────────────────────────
-- 3. Update comments
-- ─────────────────────────────────────────────────────────
COMMENT ON VIEW public.module_content_with_data IS
  'Module content with joined lesson/quiz data. Uses content_status instead of is_published.';

COMMENT ON VIEW lesson_content_items_with_data IS
  'Lesson content items with joined lesson/quiz data. Uses content_status instead of is_published.';
