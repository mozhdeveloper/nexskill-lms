-- =====================================================
-- FIX: Auto-publish modules/lessons when course is published
-- =====================================================
-- Run this ONCE in Supabase SQL Editor
-- This ensures when a course is approved, all its curriculum is also published
-- =====================================================

-- Create trigger function
CREATE OR REPLACE FUNCTION auto_publish_course_curriculum()
RETURNS TRIGGER AS $$
BEGIN
    -- When course is_published becomes true
    IF NEW.is_published = true AND (OLD.is_published IS NULL OR OLD.is_published = false) THEN
        
        -- Publish all modules for this course
        UPDATE modules 
        SET is_published = true 
        WHERE course_id = NEW.id;
        
        -- Publish all content items for this course
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
        
        RAISE NOTICE 'Auto-published curriculum for course: %', NEW.title;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on courses table
DROP TRIGGER IF EXISTS trigger_auto_publish_curriculum ON courses;
CREATE TRIGGER trigger_auto_publish_curriculum
    AFTER UPDATE ON courses
    FOR EACH ROW
    WHEN (NEW.is_published = true AND (OLD.is_published IS NULL OR OLD.is_published = false))
    EXECUTE FUNCTION auto_publish_course_curriculum();

-- =====================================================
-- Fix existing approved courses RIGHT NOW
-- =====================================================
DO $$
DECLARE
    course_rec RECORD;
BEGIN
    FOR course_rec IN 
        SELECT id, title FROM courses WHERE is_published = true
    LOOP
        -- Publish modules
        UPDATE modules SET is_published = true WHERE course_id = course_rec.id;
        
        -- Publish content items
        UPDATE module_content_items mci
        SET is_published = true
        FROM modules m
        WHERE mci.module_id = m.id AND m.course_id = course_rec.id;
        
        -- Publish lessons
        UPDATE lessons l
        SET is_published = true
        FROM module_content_items mci
        WHERE mci.content_id = l.id
        AND mci.content_type = 'lesson'
        AND mci.module_id IN (SELECT id FROM modules WHERE course_id = course_rec.id);
        
        -- Publish quizzes
        UPDATE quizzes q
        SET is_published = true
        FROM module_content_items mci
        WHERE mci.content_id = q.id
        AND mci.content_type = 'quiz'
        AND mci.module_id IN (SELECT id FROM modules WHERE course_id = course_rec.id);
        
        RAISE NOTICE '✅ Published curriculum for: %', course_rec.title;
    END LOOP;
END $$;

-- =====================================================
-- Verify the fix worked
-- =====================================================
SELECT 
    c.title AS course_name,
    c.is_published AS course_published,
    (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id AND m.is_published = true) AS modules_count,
    (SELECT COUNT(*) FROM module_content_items mci 
     JOIN modules m ON mci.module_id = m.id 
     WHERE m.course_id = c.id AND mci.is_published = true) AS content_items_count,
    (SELECT COUNT(*) FROM lessons l 
     JOIN module_content_items mci ON l.id = mci.content_id 
     JOIN modules m ON mci.module_id = m.id 
     WHERE m.course_id = c.id AND l.is_published = true) AS lessons_count,
    (SELECT COUNT(*) FROM quizzes q 
     JOIN module_content_items mci ON q.id = mci.content_id 
     JOIN modules m ON mci.module_id = m.id 
     WHERE m.course_id = c.id AND q.is_published = true) AS quizzes_count
FROM courses c
ORDER BY c.created_at DESC;
