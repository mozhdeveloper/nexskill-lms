-- Check RLS status and policies for quizzes table
-- Run this in Supabase SQL Editor to diagnose the issue

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'quizzes';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('quizzes', 'modules', 'lessons', 'module_content_items')
ORDER BY tablename, policyname;
