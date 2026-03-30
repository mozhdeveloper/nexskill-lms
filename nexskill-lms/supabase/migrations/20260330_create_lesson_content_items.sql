-- =====================================================
-- Lesson Content Items - Multiple Content Per Lesson
-- =====================================================
-- SAFE Migration Script - Does NOT drop existing data
-- Only creates if not exists, skips if already present
-- =====================================================

-- ─────────────────────────────────────────────────────────
-- 1. Create lesson_content_items table (if not exists)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'quiz', 'text', 'document')),
    content_id UUID,
    metadata JSONB DEFAULT '{}',
    "position" INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lesson_id, "position"),
    CHECK (
        (content_type = 'quiz' AND content_id IS NOT NULL) OR
        (content_type IN ('video', 'text', 'document') AND content_id IS NULL)
    )
);

-- Indexes (safe to run if exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lesson_content_items_lesson') THEN
        CREATE INDEX idx_lesson_content_items_lesson ON lesson_content_items(lesson_id, "position");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lesson_content_items_course') THEN
        CREATE INDEX idx_lesson_content_items_course ON lesson_content_items(course_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lesson_content_items_module') THEN
        CREATE INDEX idx_lesson_content_items_module ON lesson_content_items(module_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lesson_content_items_type') THEN
        CREATE INDEX idx_lesson_content_items_type ON lesson_content_items(content_type);
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────
-- 2. Create student_content_progress table (if not exists)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_content_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_item_id UUID NOT NULL REFERENCES lesson_content_items(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    watched_seconds INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    quiz_score NUMERIC,
    quiz_attempts INTEGER DEFAULT 0,
    quiz_passed BOOLEAN,
    completed_at TIMESTAMPTZ,
    last_watched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, content_item_id)
);

-- Indexes
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_student_content_progress_student') THEN
        CREATE INDEX idx_student_content_progress_student ON student_content_progress(student_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_student_content_progress_lesson') THEN
        CREATE INDEX idx_student_content_progress_lesson ON student_content_progress(lesson_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_student_content_progress_course') THEN
        CREATE INDEX idx_student_content_progress_course ON student_content_progress(course_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_student_content_progress_item') THEN
        CREATE INDEX idx_student_content_progress_item ON student_content_progress(content_item_id);
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────
-- 3. Enable RLS (safe to run multiple times)
-- ─────────────────────────────────────────────────────────
ALTER TABLE lesson_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_content_progress ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────
-- 4. Create trigger function (idempotent)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_lesson_content_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers only if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_lesson_content_items_updated_at') THEN
        CREATE TRIGGER trigger_lesson_content_items_updated_at
            BEFORE UPDATE ON lesson_content_items
            FOR EACH ROW
            EXECUTE FUNCTION update_lesson_content_items_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_student_content_progress_updated_at') THEN
        CREATE TRIGGER trigger_student_content_progress_updated_at
            BEFORE UPDATE ON student_content_progress
            FOR EACH ROW
            EXECUTE FUNCTION update_lesson_content_items_updated_at();
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────
-- 5. Create/replace view (safe)
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
-- 6. Create RLS Policies (only if not exist)
-- ─────────────────────────────────────────────────────────
DO $$ BEGIN
    -- lesson_content_items policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view published lesson content items') THEN
        CREATE POLICY "Anyone can view published lesson content items"
            ON lesson_content_items FOR SELECT
            USING (is_published = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can manage their course content items') THEN
        CREATE POLICY "Coaches can manage their course content items"
            ON lesson_content_items FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM courses c
                    WHERE c.id = course_id
                    AND c.coach_id = auth.uid()
                )
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all content items') THEN
        CREATE POLICY "Admins can manage all content items"
            ON lesson_content_items FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role = 'admin'
                )
            );
    END IF;
    
    -- student_content_progress policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can view their own progress') THEN
        CREATE POLICY "Students can view their own progress"
            ON student_content_progress FOR SELECT
            USING (student_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can insert their own progress') THEN
        CREATE POLICY "Students can insert their own progress"
            ON student_content_progress FOR INSERT
            WITH CHECK (student_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can update their own progress') THEN
        CREATE POLICY "Students can update their own progress"
            ON student_content_progress FOR UPDATE
            USING (student_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can view progress for their courses') THEN
        CREATE POLICY "Coaches can view progress for their courses"
            ON student_content_progress FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM courses c
                    WHERE c.id = course_id
                    AND c.coach_id = auth.uid()
                )
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all progress') THEN
        CREATE POLICY "Admins can view all progress"
            ON student_content_progress FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role = 'admin'
                )
            );
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────
-- 7. Create Helper Functions (idempotent)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_student_lesson_progress(
    p_student_id UUID,
    p_lesson_id UUID
)
RETURNS TABLE (
    content_item_id UUID,
    content_type TEXT,
    item_position INTEGER,
    is_completed BOOLEAN,
    progress_percent INTEGER,
    watched_seconds INTEGER,
    quiz_score NUMERIC,
    quiz_attempts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        lci.id,
        lci.content_type,
        lci."position",
        COALESCE(scp.is_completed, false),
        COALESCE(scp.progress_percent, 0),
        COALESCE(scp.watched_seconds, 0),
        scp.quiz_score,
        COALESCE(scp.quiz_attempts, 0)
    FROM lesson_content_items lci
    LEFT JOIN student_content_progress scp
        ON scp.content_item_id = lci.id AND scp.student_id = p_student_id
    WHERE lci.lesson_id = p_lesson_id
    ORDER BY lci."position";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_lesson_completion(
    p_student_id UUID,
    p_lesson_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    total_items INTEGER;
    completed_items INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_items
    FROM lesson_content_items
    WHERE lesson_id = p_lesson_id AND is_published = true;
    
    SELECT COUNT(*) INTO completed_items
    FROM lesson_content_items lci
    INNER JOIN student_content_progress scp
        ON scp.content_item_id = lci.id
        AND scp.student_id = p_student_id
        AND scp.is_completed = true
    WHERE lci.lesson_id = p_lesson_id AND lci.is_published = true;
    
    IF total_items = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN (completed_items * 100) / total_items;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 8. Documentation Comments (safe to repeat)
-- ─────────────────────────────────────────────────────────
COMMENT ON TABLE lesson_content_items IS 'Stores individual content items (videos, quizzes, text) within a lesson. Allows multiple content pieces per lesson with independent progress tracking.';
COMMENT ON TABLE student_content_progress IS 'Tracks student progress for each individual content item within lessons. Supports video watch time and quiz scores.';
COMMENT ON COLUMN lesson_content_items.metadata IS 'JSONB field storing content-specific metadata. For videos: {video_type, url, cloudinary_public_id, duration, thumbnail_url}.';
COMMENT ON COLUMN student_content_progress.quiz_score IS 'Percentage score (0-100) for quiz content items. NULL for non-quiz content.';
COMMENT ON COLUMN student_content_progress.quiz_attempts IS 'Number of quiz attempts for this content item. 0 for non-quiz content.';
