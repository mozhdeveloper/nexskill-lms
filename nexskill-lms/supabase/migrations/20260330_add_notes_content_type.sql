-- =====================================================
-- Add 'notes' Content Type to lesson_content_items
-- =====================================================
-- Migration to add 'notes' as a new content type
-- Allows coaches to create rich text notes using React Quill
-- =====================================================

-- ─────────────────────────────────────────────────────────
-- 1. Update content_type CHECK constraint
-- ─────────────────────────────────────────────────────────
-- Drop existing constraint if it exists
ALTER TABLE lesson_content_items
DROP CONSTRAINT IF EXISTS lesson_content_items_content_type_check;

-- Add new constraint with 'notes' content type
ALTER TABLE lesson_content_items
ADD CONSTRAINT lesson_content_items_content_type_check
CHECK (content_type IN ('video', 'quiz', 'text', 'document', 'notes'));

-- Update the CHECK constraint for content_id to allow notes
ALTER TABLE lesson_content_items
DROP CONSTRAINT IF EXISTS lesson_content_items_content_id_check;

ALTER TABLE lesson_content_items
ADD CONSTRAINT lesson_content_items_content_id_check
CHECK (
    (content_type = 'quiz' AND content_id IS NOT NULL) OR
    (content_type IN ('video', 'text', 'document', 'notes') AND content_id IS NULL)
);

-- ─────────────────────────────────────────────────────────
-- 2. Update view to handle notes content type
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW lesson_content_items_with_data AS
SELECT
    lci.id,
    lci.lesson_id,
    lci.course_id,
    lci.module_id,
    lci.content_type,
    lci.content_id,
    lci.metadata,
    lci."position",
    lci.is_published,
    lci.created_at,
    lci.updated_at,
    l.title AS lesson_title,
    l.description AS lesson_description,
    l.estimated_duration_minutes,
    q.title AS quiz_title,
    q.description AS quiz_description,
    q.instructions,
    q.passing_score,
    q.time_limit_minutes,
    q.max_attempts AS quiz_max_attempts,
    q.requires_manual_grading AS quiz_requires_manual_grading
FROM lesson_content_items lci
LEFT JOIN lessons l ON lci.lesson_id = l.id
LEFT JOIN quizzes q ON lci.content_type = 'quiz' AND lci.content_id = q.id;

-- ─────────────────────────────────────────────────────────
-- 3. Update documentation
-- ─────────────────────────────────────────────────────────
COMMENT ON TABLE lesson_content_items IS 'Stores individual content items (videos, quizzes, text, documents, notes) within a lesson. Allows multiple content pieces per lesson with independent progress tracking.';
COMMENT ON COLUMN lesson_content_items.metadata IS 'JSONB field storing content-specific metadata. For videos: {video_type, url, cloudinary_public_id, duration, thumbnail_url}. For notes: {content, title, word_count, reading_time}.';
