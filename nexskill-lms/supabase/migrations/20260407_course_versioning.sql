-- =====================================================
-- Course Versioning System
-- =====================================================
-- Students always see published version
-- Coach edits create pending updates  
-- Admin approval merges changes
-- =====================================================

-- ──────────────────────────────────────────────────────
-- 1. Add version tracking columns
-- ──────────────────────────────────────────────────────
DO $$ BEGIN
    ALTER TABLE modules ADD COLUMN IF NOT EXISTS version_id UUID;
    ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_published_version BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE module_content_items ADD COLUMN IF NOT EXISTS version_id UUID;
    ALTER TABLE module_content_items ADD COLUMN IF NOT EXISTS is_published_version BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE lessons ADD COLUMN IF NOT EXISTS version_id UUID;
    ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_published_version BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS version_id UUID;
    ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_published_version BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Add foreign keys
ALTER TABLE modules ADD CONSTRAINT fk_modules_version 
    FOREIGN KEY (version_id) REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE module_content_items ADD CONSTRAINT fk_content_items_version 
    FOREIGN KEY (version_id) REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE lessons ADD CONSTRAINT fk_lessons_version 
    FOREIGN KEY (version_id) REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE quizzes ADD CONSTRAINT fk_quizzes_version 
    FOREIGN KEY (version_id) REFERENCES courses(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_modules_version ON modules(version_id);
CREATE INDEX IF NOT EXISTS idx_content_items_version ON module_content_items(version_id);
CREATE INDEX IF NOT EXISTS idx_lessons_version ON lessons(version_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_version ON quizzes(version_id);

-- ──────────────────────────────────────────────────────
-- 2. Helper: Get published version ID
-- ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_published_course_version(p_course_id UUID)
RETURNS UUID AS $$
    SELECT id FROM courses WHERE id = p_course_id AND is_published = true LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ──────────────────────────────────────────────────────
-- 3. Student View: Published curriculum only
-- ──────────────────────────────────────────────────────
CREATE OR REPLACE VIEW student_course_curriculum AS
SELECT
    c.id AS course_id,
    c.title AS course_title,
    m.id AS module_id,
    m.title AS module_title,
    m.position AS module_position,
    mci.id AS content_item_id,
    mci.content_type,
    mci.content_id,
    mci.position AS content_position,
    l.id AS lesson_id,
    l.title AS lesson_title,
    l.estimated_duration_minutes,
    q.id AS quiz_id,
    q.title AS quiz_title,
    q.time_limit_minutes
FROM courses c
JOIN modules m ON m.course_id = c.id AND m.is_published = true
JOIN module_content_items mci ON mci.module_id = m.id AND mci.is_published = true
LEFT JOIN lessons l ON l.id = mci.content_id AND mci.content_type = 'lesson' AND l.is_published = true
LEFT JOIN quizzes q ON q.id = mci.content_id AND mci.content_type = 'quiz' AND q.is_published = true
WHERE c.is_published = true
ORDER BY m.position, mci.position;

-- ──────────────────────────────────────────────────────
-- 4. Initialize existing courses
-- ──────────────────────────────────────────────────────
DO $$
DECLARE
    course_rec RECORD;
BEGIN
    FOR course_rec IN SELECT id, title FROM courses WHERE is_published = true LOOP
        -- Mark all modules as published version
        UPDATE modules
        SET is_published_version = true
        WHERE course_id = course_rec.id;
        
        -- Mark all content items as published version
        UPDATE module_content_items mci
        SET is_published_version = true
        FROM modules m
        WHERE mci.module_id = m.id AND m.course_id = course_rec.id;
        
        -- Mark all lessons as published version
        UPDATE lessons l
        SET is_published_version = true
        FROM module_content_items mci
        WHERE mci.content_id = l.id
        AND mci.content_type = 'lesson'
        AND mci.module_id IN (SELECT id FROM modules WHERE course_id = course_rec.id);
        
        -- Mark all quizzes as published version
        UPDATE quizzes q
        SET is_published_version = true
        FROM module_content_items mci
        WHERE mci.content_id = q.id
        AND mci.content_type = 'quiz'
        AND mci.module_id IN (SELECT id FROM modules WHERE course_id = course_rec.id);
        
        RAISE NOTICE 'Initialized versioning for: %', course_rec.title;
    END LOOP;
END $$;

-- ──────────────────────────────────────────────────────
-- 5. Comments
-- ──────────────────────────────────────────────────────
COMMENT ON VIEW student_course_curriculum IS 'Student view: only published curriculum';
