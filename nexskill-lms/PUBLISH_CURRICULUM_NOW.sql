-- =====================================================
-- QUICK FIX: Publish Curriculum for Your Course
-- =====================================================
-- Run this in Supabase SQL Editor to immediately
-- publish all modules, lessons, and quizzes
-- =====================================================

-- Replace with your course ID
-- Your course ID: 9d18a986-155e-4e57-8e11-b03d5940d6d2
DO $$
DECLARE
    v_course_id UUID := '9d18a986-155e-4e57-8e11-b03d5940d6d2';
    v_course_title TEXT;
    v_result TEXT;
BEGIN
    -- Get course title
    SELECT title INTO v_course_title FROM courses WHERE id = v_course_id;
    
    -- Publish course itself
    UPDATE courses SET is_published = true WHERE id = v_course_id;
    
    -- Publish modules
    UPDATE modules SET is_published = true WHERE course_id = v_course_id;
    
    -- Publish content items
    UPDATE module_content_items mci
    SET is_published = true
    FROM modules m
    WHERE mci.module_id = m.id AND m.course_id = v_course_id;
    
    -- Publish lessons
    UPDATE lessons l
    SET is_published = true
    FROM module_content_items mci
    WHERE mci.content_id = l.id
    AND mci.content_type = 'lesson'
    AND mci.module_id IN (SELECT id FROM modules WHERE course_id = v_course_id);
    
    -- Publish quizzes
    UPDATE quizzes q
    SET is_published = true
    FROM module_content_items mci
    WHERE mci.content_id = q.id
    AND mci.content_type = 'quiz'
    AND mci.module_id IN (SELECT id FROM modules WHERE course_id = v_course_id);
    
    -- Show result
    RAISE NOTICE '✅ Published curriculum for: %', v_course_title;
    RAISE NOTICE '   - Modules: %', (SELECT COUNT(*) FROM modules WHERE course_id = v_course_id AND is_published = true);
    RAISE NOTICE '   - Content Items: %', (SELECT COUNT(*) FROM module_content_items mci JOIN modules m ON mci.module_id = m.id WHERE m.course_id = v_course_id AND mci.is_published = true);
    RAISE NOTICE '   - Lessons: %', (SELECT COUNT(*) FROM lessons l JOIN module_content_items mci ON l.id = mci.content_id JOIN modules m ON mci.module_id = m.id WHERE m.course_id = v_course_id AND l.is_published = true);
    RAISE NOTICE '   - Quizzes: %', (SELECT COUNT(*) FROM quizzes q JOIN module_content_items mci ON q.id = mci.content_id JOIN modules m ON mci.module_id = m.id WHERE m.course_id = v_course_id AND q.is_published = true);
END $$;

-- Verify the fix
SELECT 
    c.title AS course_title,
    c.is_published AS course_published,
    COUNT(DISTINCT m.id) FILTER (WHERE m.is_published = true) AS modules_published,
    COUNT(DISTINCT mci.id) FILTER (WHERE mci.is_published = true) AS content_items_published,
    COUNT(DISTINCT l.id) FILTER (WHERE l.is_published = true) AS lessons_published,
    COUNT(DISTINCT q.id) FILTER (WHERE q.is_published = true) AS quizzes_published
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN module_content_items mci ON mci.module_id = m.id
LEFT JOIN lessons l ON l.id = mci.content_id AND mci.content_type = 'lesson'
LEFT JOIN quizzes q ON q.id = mci.content_id AND mci.content_type = 'quiz'
WHERE c.id = '9d18a986-155e-4e57-8e11-b03d5940d6d2'
GROUP BY c.id, c.title, c.is_published;
