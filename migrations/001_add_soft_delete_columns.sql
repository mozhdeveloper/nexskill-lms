-- Migration: Add soft delete support for course versioning
-- Purpose: Enable coaches to request deletion of content from approved courses
-- Date: 2026-04-15

-- 1. Add deleted_at timestamps (NULL = not deleted, timestamp = marked for deletion)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE module_content_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE lesson_content_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Add indexes for performance (filter out soft-deleted items)
CREATE INDEX IF NOT EXISTS idx_modules_not_deleted ON modules(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_not_deleted ON lessons(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_module_content_items_not_deleted ON module_content_items(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lesson_content_items_not_deleted ON lesson_content_items(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quizzes_not_deleted ON quizzes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quiz_questions_not_deleted ON quiz_questions(deleted_at) WHERE deleted_at IS NULL;

-- 3. Add content_status check constraints if not already present
-- (User already ran this, but making idempotent)
DO $$
BEGIN
  -- Check and update modules constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'modules_content_status_check'
  ) THEN
    ALTER TABLE modules DROP CONSTRAINT modules_content_status_check;
  END IF;
  ALTER TABLE modules ADD CONSTRAINT modules_content_status_check 
    CHECK (content_status IN ('draft', 'published', 'pending_addition', 'pending_deletion'));

  -- Check and update lessons constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'lessons_content_status_check'
  ) THEN
    ALTER TABLE lessons DROP CONSTRAINT lessons_content_status_check;
  END IF;
  ALTER TABLE lessons ADD CONSTRAINT lessons_content_status_check 
    CHECK (content_status IN ('draft', 'published', 'pending_addition', 'pending_deletion'));

  -- Check and update quizzes constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quizzes_content_status_check'
  ) THEN
    ALTER TABLE quizzes DROP CONSTRAINT quizzes_content_status_check;
  END IF;
  ALTER TABLE quizzes ADD CONSTRAINT quizzes_content_status_check 
    CHECK (content_status IN ('draft', 'published', 'pending_addition', 'pending_deletion'));

  -- Check and update module_content_items constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'module_content_items_content_status_check'
  ) THEN
    ALTER TABLE module_content_items DROP CONSTRAINT module_content_items_content_status_check;
  END IF;
  ALTER TABLE module_content_items ADD CONSTRAINT module_content_items_content_status_check 
    CHECK (content_status IN ('draft', 'published', 'pending_addition', 'pending_deletion'));

  -- Check and update lesson_content_items constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'lesson_content_items_content_status_check'
  ) THEN
    ALTER TABLE lesson_content_items DROP CONSTRAINT lesson_content_items_content_status_check;
  END IF;
  ALTER TABLE lesson_content_items ADD CONSTRAINT lesson_content_items_content_status_check 
    CHECK (content_status IN ('draft', 'published', 'pending_addition', 'pending_deletion'));
END $$;

-- 4. Create helper function to get pending deletion requests
CREATE OR REPLACE FUNCTION get_pending_deletions(p_course_id UUID DEFAULT NULL)
RETURNS TABLE(
  course_id UUID,
  course_title TEXT,
  entity_type TEXT,
  entity_id UUID,
  entity_title TEXT,
  deleted_at TIMESTAMPTZ,
  coach_id UUID
) AS $$
BEGIN
  RETURN QUERY
  -- Modules pending deletion
  SELECT m.course_id, c.title, 'module'::TEXT, m.id, m.title, m.deleted_at, c.coach_id
  FROM modules m
  JOIN courses c ON c.id = m.course_id
  WHERE m.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR m.course_id = p_course_id)
  
  UNION ALL
  
  -- Lessons pending deletion
  SELECT l.course_id, c.title, 'lesson'::TEXT, l.id, l.title, l.deleted_at, c.coach_id
  FROM lessons l
  JOIN courses c ON c.id = l.course_id
  WHERE l.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR l.course_id = p_course_id)
  
  UNION ALL
  
  -- Quizzes pending deletion
  SELECT m.course_id, c.title, 'quiz'::TEXT, q.id, q.title, q.deleted_at, c.coach_id
  FROM quizzes q
  JOIN lesson_content_items lci ON lci.content_id = q.id AND lci.content_type = 'quiz'
  JOIN modules m ON m.id = lci.module_id
  JOIN courses c ON c.id = m.course_id
  WHERE q.content_status = 'pending_deletion'
    AND (p_course_id IS NULL OR m.course_id = p_course_id)
  
  UNION ALL
  
  -- Quiz questions pending deletion (via their quiz)
  SELECT m.course_id, c.title, 'quiz_question'::TEXT, qq.id, qq.question_text, qq.deleted_at, c.coach_id
  FROM quiz_questions qq
  JOIN quizzes q ON q.id = qq.quiz_id
  JOIN lesson_content_items lci ON lci.content_id = q.id AND lci.content_type = 'quiz'
  JOIN modules m ON m.id = lci.module_id
  JOIN courses c ON c.id = m.course_id
  WHERE qq.deleted_at IS NOT NULL
    AND (p_course_id IS NULL OR m.course_id = p_course_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Comment on columns for documentation
COMMENT ON COLUMN modules.deleted_at IS 'Timestamp when module was marked for deletion (NULL = not deleted)';
COMMENT ON COLUMN lessons.deleted_at IS 'Timestamp when lesson was marked for deletion (NULL = not deleted)';
COMMENT ON COLUMN module_content_items.deleted_at IS 'Timestamp when content item was marked for deletion (NULL = not deleted)';
COMMENT ON COLUMN lesson_content_items.deleted_at IS 'Timestamp when content item was marked for deletion (NULL = not deleted)';
COMMENT ON COLUMN quizzes.deleted_at IS 'Timestamp when quiz was marked for deletion (NULL = not deleted)';
COMMENT ON COLUMN quiz_questions.deleted_at IS 'Timestamp when quiz question was marked for deletion (NULL = not deleted)';
