-- =====================================================
-- Auto-Publish Curriculum When Course is Approved
-- =====================================================
-- This creates a trigger that automatically sets
-- is_published = true on all curriculum when course is approved
-- =====================================================

-- ─────────────────────────────────────────────────────────
-- 1. Create function to publish all curriculum
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION publish_course_curriculum()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if course is being set to published/approved
    IF NEW.is_published = true AND (OLD.is_published IS NULL OR OLD.is_published = false) THEN
        
        -- Publish all modules for this course
        UPDATE modules
        SET is_published = true
        WHERE course_id = NEW.id;
        
        -- Publish all module_content_items for this course
        UPDATE module_content_items mci
        SET is_published = true
        FROM modules m
        WHERE mci.module_id = m.id
        AND m.course_id = NEW.id;
        
        -- Publish all lessons for this course
        UPDATE lessons l
        SET is_published = true
        FROM module_content_items mci
        WHERE mci.content_id = l.id
        AND mci.content_type = 'lesson'
        AND mci.module_id IN (SELECT id FROM modules WHERE course_id = NEW.id);
        
        -- Publish all quizzes for this course
        UPDATE quizzes q
        SET is_published = true
        FROM module_content_items mci
        WHERE mci.content_id = q.id
        AND mci.content_type = 'quiz'
        AND mci.module_id IN (SELECT id FROM modules WHERE course_id = NEW.id);
        
        RAISE NOTICE 'Published all curriculum for course: %', NEW.title;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 2. Create trigger on courses table
-- ─────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trigger_publish_course_curriculum ON courses;

CREATE TRIGGER trigger_publish_course_curriculum
    AFTER UPDATE ON courses
    FOR EACH ROW
    WHEN (NEW.is_published = true AND (OLD.is_published IS NULL OR OLD.is_published = false))
    EXECUTE FUNCTION publish_course_curriculum();

-- ─────────────────────────────────────────────────────────
-- 3. Create helper function to manually publish curriculum
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION manually_publish_curriculum(p_course_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_course_title TEXT;
    v_modules_count INTEGER := 0;
    v_content_count INTEGER := 0;
    v_lessons_count INTEGER := 0;
    v_quizzes_count INTEGER := 0;
BEGIN
    -- Get course title
    SELECT title INTO v_course_title FROM courses WHERE id = p_course_id;
    
    -- Publish course itself
    UPDATE courses SET is_published = true WHERE id = p_course_id;
    
    -- Publish modules
    UPDATE modules SET is_published = true WHERE course_id = p_course_id;
    GET DIAGNOSTICS v_modules_count = ROW_COUNT;
    
    -- Publish content items
    UPDATE module_content_items mci
    SET is_published = true
    FROM modules m
    WHERE mci.module_id = m.id AND m.course_id = p_course_id;
    GET DIAGNOSTICS v_content_count = ROW_COUNT;
    
    -- Publish lessons
    UPDATE lessons l
    SET is_published = true
    FROM module_content_items mci
    WHERE mci.content_id = l.id
    AND mci.content_type = 'lesson'
    AND mci.module_id IN (SELECT id FROM modules WHERE course_id = p_course_id);
    GET DIAGNOSTICS v_lessons_count = ROW_COUNT;
    
    -- Publish quizzes
    UPDATE quizzes q
    SET is_published = true
    FROM module_content_items mci
    WHERE mci.content_id = q.id
    AND mci.content_type = 'quiz'
    AND mci.module_id IN (SELECT id FROM modules WHERE course_id = p_course_id);
    GET DIAGNOSTICS v_quizzes_count = ROW_COUNT;
    
    RETURN format(
        'Published curriculum for "%s": %s modules, %s content items, %s lessons, %s quizzes',
        v_course_title,
        v_modules_count,
        v_content_count,
        v_lessons_count,
        v_quizzes_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 4. Create view to check publishing status
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW curriculum_publishing_status AS
SELECT
    c.id AS course_id,
    c.title AS course_title,
    c.is_published AS course_published,
    COUNT(DISTINCT m.id) FILTER (WHERE m.is_published = true) AS published_modules,
    COUNT(DISTINCT m.id) FILTER (WHERE m.is_published = false) AS unpublished_modules,
    COUNT(DISTINCT mci.id) FILTER (WHERE mci.is_published = true) AS published_content_items,
    COUNT(DISTINCT mci.id) FILTER (WHERE mci.is_published = false) AS unpublished_content_items,
    COUNT(DISTINCT l.id) FILTER (WHERE l.is_published = true) AS published_lessons,
    COUNT(DISTINCT l.id) FILTER (WHERE l.is_published = false) AS unpublished_lessons,
    COUNT(DISTINCT q.id) FILTER (WHERE q.is_published = true) AS published_quizzes,
    COUNT(DISTINCT q.id) FILTER (WHERE q.is_published = false) AS unpublished_quizzes
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN module_content_items mci ON mci.module_id = m.id
LEFT JOIN lessons l ON l.id = mci.content_id AND mci.content_type = 'lesson'
LEFT JOIN quizzes q ON q.id = mci.content_id AND mci.content_type = 'quiz'
GROUP BY c.id, c.title, c.is_published
ORDER BY c.id;

-- ─────────────────────────────────────────────────────────
-- 5. Publish all existing approved courses
-- ─────────────────────────────────────────────────────────
DO $$
DECLARE
    course_rec RECORD;
    result TEXT;
BEGIN
    FOR course_rec IN 
        SELECT id, title FROM courses 
        WHERE is_published = true
    LOOP
        BEGIN
            SELECT manually_publish_curriculum(course_rec.id) INTO result;
            RAISE NOTICE '%', result;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR publishing %: %', course_rec.title, SQLERRM;
        END;
    END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────
-- 6. Show publishing status
-- ─────────────────────────────────────────────────────────
SELECT * FROM curriculum_publishing_status;

-- ─────────────────────────────────────────────────────────
-- Comments
-- ─────────────────────────────────────────────────────────
COMMENT ON FUNCTION publish_course_curriculum IS 'Trigger function to auto-publish curriculum when course is published';
COMMENT ON FUNCTION manually_publish_curriculum IS 'Manually publish all curriculum for a course';
COMMENT ON VIEW curriculum_publishing_status IS 'View to check publishing status of courses and their curriculum';
