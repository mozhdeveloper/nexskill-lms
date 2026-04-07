-- =====================================================
-- DEBUG: Check why courses disappear from student catalog
-- =====================================================

-- Check your course status
SELECT 
  id,
  title,
  verification_status,
  is_published,
  visibility
FROM courses
WHERE id = 'YOUR-COURSE-ID-HERE';

-- Check modules status
SELECT 
  m.id,
  m.title,
  m.is_published,
  m.is_published_version,
  m.version_id
FROM modules m
WHERE m.course_id = 'YOUR-COURSE-ID-HERE';

-- Check if there's RLS blocking the query
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
WHERE tablename IN ('courses', 'modules')
AND policyname LIKE '%student%' OR policyname LIKE '%select%';

-- Test query as student would see it
SELECT 
  c.id,
  c.title,
  c.verification_status,
  c.visibility,
  (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as module_count,
  (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id AND m.is_published = true) as published_module_count
FROM courses c
WHERE c.verification_status = 'approved'
AND c.id = 'YOUR-COURSE-ID-HERE';
