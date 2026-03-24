-- DEBUG CURRICULUM QUERY
-- Run this in Supabase SQL Editor to check if data exists
-- Replace the course_id with your actual course ID

-- Step 1: Check if course exists
SELECT id, title, is_published, verification_status 
FROM courses 
WHERE id = 'YOUR_COURSE_ID_HERE';

-- Step 2: Check modules for the course
SELECT id, title, position, is_published, course_id 
FROM modules 
WHERE course_id = 'YOUR_COURSE_ID_HERE'
ORDER BY position;

-- Step 3: Check content items for all modules
SELECT mci.*, m.title as module_title
FROM module_content_items mci
JOIN modules m ON mci.module_id = m.id
WHERE m.course_id = 'YOUR_COURSE_ID_HERE'
ORDER BY m.position, mci.position;

-- Step 4: Check lessons linked to content items
SELECT l.id, l.title, l.is_published, mci.content_id
FROM lessons l
JOIN module_content_items mci ON l.id = mci.content_id
JOIN modules m ON mci.module_id = m.id
WHERE m.course_id = 'YOUR_COURSE_ID_HERE'
AND mci.content_type = 'lesson';

-- Step 5: Check quizzes linked to content items
SELECT q.id, q.title, q.is_published, mci.content_id
FROM quizzes q
JOIN module_content_items mci ON q.id = mci.content_id
JOIN modules m ON mci.module_id = m.id
WHERE m.course_id = 'YOUR_COURSE_ID_HERE'
AND mci.content_type = 'quiz';
