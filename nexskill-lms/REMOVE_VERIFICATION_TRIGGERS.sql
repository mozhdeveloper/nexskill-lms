-- =====================================================
-- Remove triggers that reset verification_status
-- =====================================================

-- Check if there's a trigger that changes verification_status when modules are added
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('modules', 'module_content_items', 'lessons', 'quizzes')
AND action_statement LIKE '%verification_status%';

-- Drop any trigger that resets verification_status
DROP TRIGGER IF EXISTS check_course_content_changes ON modules;
DROP TRIGGER IF EXISTS update_course_verification_on_module_change ON modules;
DROP TRIGGER IF EXISTS update_course_verification_on_content_change ON module_content_items;
DROP TRIGGER IF EXISTS update_course_verification_on_lesson_change ON lessons;

-- =====================================================
-- Ensure courses stay approved when content is added
-- =====================================================

-- Verify the course status
SELECT 
  id,
  title,
  verification_status,
  visibility
FROM courses
WHERE verification_status = 'approved';
