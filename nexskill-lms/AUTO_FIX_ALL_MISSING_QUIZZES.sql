-- ============================================
-- AUTO-FIX: Find and Create ALL Missing Quizzes
-- This script finds ALL orphaned quiz content items
-- and creates the missing quiz rows automatically
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Show all orphaned content items
SELECT 
    '🔍 FOUND ORPHANED CONTENT ITEMS' as info,
    lci.id as content_item_id,
    lci.content_id as missing_quiz_id,
    lci.lesson_id,
    lci.course_id,
    lci.metadata->>'title' as quiz_title,
    l.title as lesson_title,
    c.title as course_title,
    lci.created_at
FROM lesson_content_items lci
LEFT JOIN quizzes q ON lci.content_id = q.id
LEFT JOIN lessons l ON lci.lesson_id = l.id
LEFT JOIN courses c ON lci.course_id = c.id
WHERE lci.content_type = 'quiz'
AND q.id IS NULL
ORDER BY lci.created_at DESC;

-- STEP 2: Create ALL missing quizzes from lesson_content_items
-- This will automatically create quiz rows for all orphaned content items
WITH orphaned_items AS (
    SELECT 
        lci.content_id,
        lci.lesson_id,
        lci.metadata,
        lci.is_published,
        lci.created_at
    FROM lesson_content_items lci
    LEFT JOIN quizzes q ON lci.content_id = q.id
    WHERE lci.content_type = 'quiz'
    AND q.id IS NULL
)
INSERT INTO quizzes (
    id,
    title,
    description,
    instructions,
    lesson_id,
    passing_score,
    time_limit_minutes,
    max_attempts,
    is_published,
    requires_coach_approval,
    requires_manual_grading,
    late_submission_allowed,
    late_penalty_percent,
    created_at,
    updated_at
)
SELECT 
    content_id,
    COALESCE(metadata->>'title', 'Quiz') as title,
    '' as description,
    '' as instructions,
    lesson_id,
    70 as passing_score,
    NULL as time_limit_minutes,
    NULL as max_attempts,
    is_published,
    true as requires_coach_approval,
    false as requires_manual_grading,
    false as late_submission_allowed,
    0 as late_penalty_percent,
    created_at,
    NOW() as updated_at
FROM orphaned_items
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    lesson_id = EXCLUDED.lesson_id,
    updated_at = NOW()
RETURNING id, title, lesson_id;

-- STEP 3: Show how many quizzes were created
SELECT 
    '✅ CREATED QUIZZES' as info,
    COUNT(*) as quizzes_created
FROM quizzes
WHERE created_at = updated_at
AND updated_at > NOW() - INTERVAL '5 minutes';

-- STEP 4: Verify no orphaned items remain
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No orphaned content items remain'
        ELSE '⚠️ ' || COUNT(*) || ' orphaned items still exist'
    END as verification_status,
    COUNT(*) as remaining_orphaned
FROM lesson_content_items lci
LEFT JOIN quizzes q ON lci.content_id = q.id
WHERE lci.content_type = 'quiz'
AND q.id IS NULL;

-- STEP 5: Fix RLS policies to prevent future access issues
DROP POLICY IF EXISTS "authenticated_view_quizzes" ON quizzes;
DROP POLICY IF EXISTS "coaches_insert_quizzes" ON quizzes;
DROP POLICY IF EXISTS "coaches_manage_own_quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow authenticated users to view quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow authenticated read access to quizzes" ON quizzes;
DROP POLICY IF EXISTS "anyone_view_quizzes" ON quizzes;
DROP POLICY IF EXISTS "coaches_manage_quizzes" ON quizzes;
DROP POLICY IF EXISTS "admin_manage_quizzes" ON quizzes;
DROP POLICY IF EXISTS "public_view_published_quizzes" ON quizzes;
DROP POLICY IF EXISTS "Quizzes are viewable by everyone" ON quizzes;

CREATE POLICY "authenticated_view_quizzes"
ON quizzes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "coaches_insert_quizzes"
ON quizzes
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('coach', 'admin', 'platform_owner')
    )
);

CREATE POLICY "coaches_manage_quizzes"
ON quizzes
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('coach', 'admin', 'platform_owner')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('coach', 'admin', 'platform_owner')
    )
);

-- STEP 6: Final summary
SELECT 
    '✅ COMPLETE SUMMARY' as info,
    (SELECT COUNT(*) FROM quizzes) as total_quizzes,
    (SELECT COUNT(*) FROM lesson_content_items WHERE content_type = 'quiz') as total_quiz_content_items,
    (
        SELECT COUNT(*)
        FROM lesson_content_items lci
        LEFT JOIN quizzes q ON lci.content_id = q.id
        WHERE lci.content_type = 'quiz'
        AND q.id IS NULL
    ) as orphaned_items_remaining,
    (
        SELECT COUNT(*)
        FROM pg_policies
        WHERE tablename = 'quizzes'
        AND schemaname = 'public'
    ) as active_rls_policies;

-- STEP 7: Show all quizzes with their question counts
SELECT 
    q.id,
    q.title,
    q.is_published,
    q.requires_coach_approval,
    q.lesson_id,
    COUNT(DISTINCT qq.id) as question_count,
    CASE 
        WHEN COUNT(DISTINCT qq.id) = 0 THEN '⚠️ Add questions via coach'
        ELSE '✅ Has questions'
    END as status
FROM quizzes q
LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
GROUP BY q.id, q.title, q.is_published, q.requires_coach_approval, q.lesson_id
ORDER BY q.created_at DESC
LIMIT 20;
