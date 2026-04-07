-- =====================================================
-- QUICK FIX: Publish All Existing Curriculum
-- =====================================================
-- Run this in Supabase SQL Editor to immediately fix
-- curriculum visibility issues for ALL courses
-- =====================================================

-- Step 1: Run the fix function for ALL courses
DO $$
DECLARE
    course_rec RECORD;
    fix_result TEXT;
BEGIN
    FOR course_rec IN SELECT id, title FROM courses LOOP
        BEGIN
            SELECT fix_course_curriculum_visibility(course_rec.id) INTO fix_result;
            RAISE NOTICE 'Fixed curriculum for course % (%): %', course_rec.id, course_rec.title, fix_result;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR fixing course % (%): %', course_rec.id, course_rec.title, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 2: Verify the fix by checking the visibility view
SELECT 
    course_id,
    course_title,
    version_status,
    version_number,
    COUNT(*) FILTER (WHERE visibility_status = 'VISIBLE_TO_STUDENTS') AS visible_items,
    COUNT(*) FILTER (WHERE visibility_status = 'HIDDEN_FROM_STUDENTS') AS hidden_items
FROM course_curriculum_visibility
GROUP BY course_id, course_title, version_status, version_number
ORDER BY course_id;

-- Step 3: Check if there are any pending updates that need approval
SELECT 
    pcu.id,
    c.title AS course_title,
    pcu.status,
    pcu.submitted_at,
    pcu.change_description
FROM pending_course_updates pcu
LEFT JOIN courses c ON c.id = pcu.course_id
WHERE pcu.status = 'pending'
ORDER BY pcu.submitted_at DESC;

-- Step 4: Show all course versions
SELECT 
    cv.course_id,
    c.title AS course_title,
    cv.version_number,
    cv.status,
    cv.version_name,
    cv.published_at,
    cv.approved_at
FROM course_versions cv
LEFT JOIN courses c ON c.id = cv.course_id
ORDER BY cv.course_id, cv.version_number;

-- =====================================================
-- MANUAL FIX FOR SPECIFIC COURSE
-- =====================================================
-- If you want to fix a specific course, replace the UUID below:
-- =====================================================

-- Example: Fix a specific course
-- SELECT fix_course_curriculum_visibility('YOUR-COURSE-ID-HERE');

-- =====================================================
-- DEBUG: Check current state
-- =====================================================

-- Check modules publishing status
SELECT 
    c.id AS course_id,
    c.title AS course_title,
    COUNT(*) FILTER (WHERE m.is_published = true) AS published_modules,
    COUNT(*) FILTER (WHERE m.is_published = false) AS unpublished_modules,
    COUNT(*) FILTER (WHERE m.is_published_version = true) AS version_published_modules,
    COUNT(*) FILTER (WHERE m.version_id IS NOT NULL) AS modules_with_version,
    COUNT(*) AS total_modules
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
GROUP BY c.id, c.title
ORDER BY c.id;

-- Check content items publishing status
SELECT 
    c.id AS course_id,
    c.title AS course_title,
    COUNT(*) FILTER (WHERE mci.is_published = true) AS published_items,
    COUNT(*) FILTER (WHERE mci.is_published = false) AS unpublished_items,
    COUNT(*) FILTER (WHERE mci.is_published_version = true) AS version_published_items,
    COUNT(*) FILTER (WHERE mci.version_id IS NOT NULL) AS items_with_version,
    COUNT(*) AS total_items
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN module_content_items mci ON mci.module_id = m.id
GROUP BY c.id, c.title
ORDER BY c.id;

-- Check lessons publishing status
SELECT 
    c.id AS course_id,
    c.title AS course_title,
    COUNT(*) FILTER (WHERE l.is_published = true) AS published_lessons,
    COUNT(*) FILTER (WHERE l.is_published = false) AS unpublished_lessons,
    COUNT(*) FILTER (WHERE l.is_published_version = true) AS version_published_lessons,
    COUNT(*) FILTER (WHERE l.version_id IS NOT NULL) AS lessons_with_version,
    COUNT(*) AS total_lessons
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN module_content_items mci ON mci.module_id = m.id AND mci.content_type = 'lesson'
LEFT JOIN lessons l ON l.id = mci.content_id
GROUP BY c.id, c.title
ORDER BY c.id;
