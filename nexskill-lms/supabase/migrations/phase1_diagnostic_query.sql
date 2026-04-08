-- =====================================================
-- Phase 1 Diagnostic Query
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Check all triggers on key tables
SELECT 
  trigger_name,
  event_object_table as table_name,
  event_manipulation as event,
  action_timing as timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('courses', 'modules', 'lessons', 'module_content_items', 'lesson_content_items', 'quizzes')
ORDER BY event_object_table, event_manipulation, trigger_name;

-- 2. Check trigger functions exist and their definitions
SELECT 
  routine_name as function_name,
  CASE WHEN routine_definition LIKE '%is_published%' THEN 'Has is_published check' ELSE 'No is_published check' END as has_publish_check,
  CASE WHEN routine_definition LIKE '%Phase 1%' THEN 'Phase 1 version' ELSE 'Old version' END as version_check,
  CASE WHEN routine_definition LIKE '%pending_review%' THEN 'Resets to pending_review' ELSE 'Does NOT reset' END as reset_behavior
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%verification%' OR routine_name LIKE '%course%approval%')
ORDER BY routine_name;

-- 3. Check if any OLD triggers are still present
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%update_course_verification_status_on_content_change%'
   OR action_statement LIKE '%update_course_verification_on_lesson_change%'
   OR action_statement LIKE '%update_course_verification_on_quiz_change%'
ORDER BY trigger_name;

-- 4. Check current course status
SELECT id, title, verification_status, updated_at
FROM courses
WHERE id = '1f0719f1-84fd-42e0-8152-70cacd077815';

-- 5. Check for any broken triggers (functions that don't exist)
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  CASE WHEN action_statement LIKE '%update_course_verification%' THEN 'May be broken if function missing' ELSE 'OK' END as status_check
FROM information_schema.triggers
WHERE action_statement LIKE '%verification%'
ORDER BY trigger_name;

-- 6. Show all verification-related functions
SELECT 
  proname as function_name,
  prosrc LIKE '%is_published%' as has_is_published_check,
  prosrc LIKE '%Phase 1%' as is_phase1,
  LENGTH(prosrc) as function_length
FROM pg_proc
WHERE proname IN (
  'update_course_verification_status_on_content_change',
  'update_course_verification_on_lesson_change',
  'update_course_verification_on_quiz_change',
  'cascade_publish_on_course_approval'
);
