-- ============================================
-- Add Indexes and Optimize RLS for module_content_items
-- Created: 2026-04-10
-- Fixes query timeout issues
-- ============================================

-- Add indexes for faster queries on module_content_items
CREATE INDEX IF NOT EXISTS idx_mci_module_content_type ON module_content_items(module_id, content_type);
CREATE INDEX IF NOT EXISTS idx_mci_content_id ON module_content_items(content_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_coach_id ON courses(coach_id);

-- Refresh statistics for query planner
ANALYZE module_content_items;
ANALYZE modules;
ANALYZE courses;

-- Verify indexes
SELECT 
  indexname, 
  tablename 
FROM pg_indexes 
WHERE tablename IN ('module_content_items', 'modules', 'courses')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
