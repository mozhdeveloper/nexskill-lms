-- =====================================================
-- Course Versioning System - Proper Implementation
-- =====================================================
-- Students always see published version
-- Coach edits create pending updates
-- Admin approval merges changes into published version
-- =====================================================

-- ─────────────────────────────────────────────────────────
-- 1. Add version tracking columns
-- ─────────────────────────────────────────────────────────
-- Add version_id to track which version an item belongs to
DO $$ BEGIN
    ALTER TABLE modules ADD COLUMN IF NOT EXISTS version_id UUID REFERENCES course_versions(id);
    ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_published_version BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE module_content_items ADD COLUMN IF NOT EXISTS version_id UUID REFERENCES course_versions(id);
    ALTER TABLE module_content_items ADD COLUMN IF NOT EXISTS is_published_version BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE lessons ADD COLUMN IF NOT EXISTS version_id UUID REFERENCES course_versions(id);
    ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_published_version BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS version_id UUID REFERENCES course_versions(id);
    ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_published_version BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────
-- 2. Create indexes for performance
-- ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_modules_version ON modules(version_id);
CREATE INDEX IF NOT EXISTS idx_module_content_items_version ON module_content_items(version_id);
CREATE INDEX IF NOT EXISTS idx_lessons_version ON lessons(version_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_version ON quizzes(version_id);

-- ─────────────────────────────────────────────────────────
-- 3. Helper function: Get published version ID
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_published_course_version(p_course_id UUID)
RETURNS UUID AS $$
DECLARE
    v_version_id UUID;
BEGIN
    SELECT id INTO v_version_id
    FROM course_versions
    WHERE course_id = p_course_id
    AND status = 'published'
    ORDER BY version_number DESC
    LIMIT 1;
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 4. Helper function: Get or create draft version for editing
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_or_create_draft_version(p_course_id UUID, p_coach_id UUID)
RETURNS UUID AS $$
DECLARE
    v_version_id UUID;
    v_version_number INTEGER;
BEGIN
    -- Check if there's already a draft version
    SELECT id INTO v_version_id
    FROM course_versions
    WHERE course_id = p_course_id
    AND status = 'draft'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no draft exists, create one
    IF v_version_id IS NULL THEN
        SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
        FROM course_versions WHERE course_id = p_course_id;
        
        INSERT INTO course_versions (
            course_id, version_number, status, coach_id,
            version_name, change_summary
        ) VALUES (
            p_course_id, v_version_number, 'draft', p_coach_id,
            CONCAT('v', v_version_number, '.0 - Draft'), 'Pending changes'
        ) RETURNING id INTO v_version_id;
    END IF;
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 5. Function: Copy curriculum to new version
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION copy_curriculum_to_version(
    p_course_id UUID,
    p_source_version_id UUID,
    p_target_version_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_module RECORD;
    v_content RECORD;
    v_new_module_id UUID;
    v_new_content_id UUID;
BEGIN
    -- Copy modules
    FOR v_module IN
        SELECT * FROM modules
        WHERE course_id = p_course_id
        AND (version_id = p_source_version_id OR (p_source_version_id IS NULL AND is_published_version = true))
        ORDER BY position
    LOOP
        INSERT INTO modules (
            course_id, title, position, is_sequential,
            drip_mode, drip_days, drip_date,
            version_id, is_published_version
        ) VALUES (
            p_course_id,
            v_module.title,
            v_module.position,
            v_module.is_sequential,
            v_module.drip_mode,
            v_module.drip_days,
            v_module.drip_date,
            p_target_version_id,
            false
        ) RETURNING id INTO v_new_module_id;
        
        -- Copy content items for this module
        FOR v_content IN
            SELECT * FROM module_content_items
            WHERE module_id = v_module.id
            ORDER BY position
        LOOP
            INSERT INTO module_content_items (
                module_id, content_type, content_id, position,
                version_id, is_published_version
            ) VALUES (
                v_new_module_id,
                v_content.content_type,
                v_content.content_id, -- Reference same lesson/quiz
                v_content.position,
                p_target_version_id,
                false
            );
        END LOOP;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 6. Function: Start course update (for coaches)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION start_course_update(
    p_course_id UUID,
    p_coach_id UUID,
    p_change_description TEXT
)
RETURNS UUID AS $$
DECLARE
    v_version_id UUID;
    v_pending_id UUID;
    v_version_number INTEGER;
BEGIN
    -- Get or create draft version
    v_version_id := get_or_create_draft_version(p_course_id, p_coach_id);
    
    -- Copy current published curriculum to draft version
    PERFORM copy_curriculum_to_version(
        p_course_id,
        get_published_course_version(p_course_id),
        v_version_id
    );
    
    -- Create pending update record
    INSERT INTO pending_course_updates (
        course_id, course_version_id, coach_id,
        change_description, status
    ) VALUES (
        p_course_id, v_version_id, p_coach_id,
        p_change_description, 'pending'
    ) RETURNING id INTO v_pending_id;
    
    RETURN v_pending_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 7. Function: Approve course update (for admins)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION approve_course_update(
    p_pending_update_id UUID,
    p_admin_id UUID,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_pending_update RECORD;
    v_course_id UUID;
    v_version_id UUID;
    v_draft_module RECORD;
    v_published_module RECORD;
    v_content RECORD;
BEGIN
    -- Get pending update
    SELECT * INTO v_pending_update
    FROM pending_course_updates
    WHERE id = p_pending_update_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending update not found';
    END IF;
    
    v_course_id := v_pending_update.course_id;
    v_version_id := v_pending_update.course_version_id;
    
    -- Mark previous published version as not published
    UPDATE course_versions
    SET status = 'approved'
    WHERE course_id = v_course_id
    AND status = 'published';
    
    -- Mark new version as published
    UPDATE course_versions
    SET
        status = 'published',
        approved_at = NOW(),
        approved_by = p_admin_id,
        published_at = NOW()
    WHERE id = v_version_id;
    
    -- Mark all items in new version as published
    UPDATE modules
    SET
        is_published_version = true,
        is_published = true
    WHERE version_id = v_version_id;
    
    UPDATE module_content_items
    SET
        is_published_version = true,
        is_published = true
    WHERE version_id = v_version_id;
    
    UPDATE lessons l
    SET
        is_published_version = true,
        is_published = true
    FROM module_content_items mci
    WHERE mci.content_id = l.id
    AND mci.version_id = v_version_id
    AND mci.content_type = 'lesson';
    
    UPDATE quizzes q
    SET
        is_published_version = true,
        is_published = true
    FROM module_content_items mci
    WHERE mci.content_id = q.id
    AND mci.version_id = v_version_id
    AND mci.content_type = 'quiz';
    
    -- Update pending update status
    UPDATE pending_course_updates
    SET
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = p_admin_id,
        review_notes = p_review_notes
    WHERE id = p_pending_update_id;
    
    -- Update course basic info if changed
    UPDATE courses
    SET
        updated_at = NOW()
    WHERE id = v_course_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 8. Function: Reject course update
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reject_course_update(
    p_pending_update_id UUID,
    p_admin_id UUID,
    p_rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_version_id UUID;
BEGIN
    -- Get version to delete
    SELECT course_version_id INTO v_version_id
    FROM pending_course_updates
    WHERE id = p_pending_update_id;
    
    -- Update pending update status
    UPDATE pending_course_updates
    SET
        status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = p_admin_id,
        rejection_reason = p_rejection_reason
    WHERE id = p_pending_update_id;
    
    -- Update version status
    UPDATE course_versions
    SET
        status = 'rejected',
        rejected_at = NOW(),
        rejected_by = p_admin_id,
        rejection_reason = p_rejection_reason
    WHERE id = v_version_id;
    
    -- Delete draft modules/content (they reference the draft version)
    DELETE FROM module_content_items WHERE version_id = v_version_id;
    DELETE FROM modules WHERE version_id = v_version_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 9. Initialize existing courses with published version
-- ─────────────────────────────────────────────────────────
DO $$
DECLARE
    course_rec RECORD;
    v_version_id UUID;
    v_result TEXT;
BEGIN
    FOR course_rec IN SELECT id, title, coach_id FROM courses LOOP
        -- Check if already has a published version
        IF NOT EXISTS (
            SELECT 1 FROM course_versions
            WHERE course_id = course_rec.id AND status = 'published'
        ) THEN
            -- Create published version
            INSERT INTO course_versions (
                course_id, version_number, status, coach_id,
                version_name, change_summary, published_at
            ) VALUES (
                course_rec.id, 1, 'published', course_rec.coach_id,
                'v1.0 - Initial', 'Initial published version', NOW()
            ) RETURNING id INTO v_version_id;
            
            -- Mark existing modules as part of published version
            UPDATE modules
            SET version_id = v_version_id, is_published_version = true, is_published = true
            WHERE course_id = course_rec.id;
            
            -- Mark existing content items as published
            UPDATE module_content_items mci
            SET version_id = v_version_id, is_published_version = true, is_published = true
            FROM modules m
            WHERE mci.module_id = m.id AND m.course_id = course_rec.id;
            
            -- Mark existing lessons/quizzes as published
            UPDATE lessons l
            SET version_id = v_version_id, is_published_version = true, is_published = true
            FROM module_content_items mci
            WHERE mci.content_id = l.id
            AND mci.module_id IN (SELECT id FROM modules WHERE course_id = course_rec.id);
            
            UPDATE quizzes q
            SET version_id = v_version_id, is_published_version = true, is_published = true
            FROM module_content_items mci
            WHERE mci.content_id = q.id
            AND mci.module_id IN (SELECT id FROM modules WHERE course_id = course_rec.id);
            
            RAISE NOTICE 'Initialized versioning for course: %', course_rec.title;
        END IF;
    END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────
-- 10. Create view for student curriculum (published only)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW student_course_curriculum AS
SELECT
    c.id AS course_id,
    c.title AS course_title,
    m.id AS module_id,
    m.title AS module_title,
    m.position AS module_position,
    mci.id AS content_item_id,
    mci.content_type,
    mci.content_id,
    mci.position AS content_position,
    l.id AS lesson_id,
    l.title AS lesson_title,
    l.estimated_duration_minutes,
    q.id AS quiz_id,
    q.title AS quiz_title,
    q.time_limit_minutes
FROM courses c
JOIN course_versions cv ON cv.course_id = c.id AND cv.status = 'published'
JOIN modules m ON m.course_id = c.id AND m.version_id = cv.id AND m.is_published_version = true
JOIN module_content_items mci ON mci.module_id = m.id AND mci.version_id = cv.id AND mci.is_published_version = true
LEFT JOIN lessons l ON l.id = mci.content_id AND mci.content_type = 'lesson'
LEFT JOIN quizzes q ON q.id = mci.content_id AND mci.content_type = 'quiz'
ORDER BY m.position, mci.position;

-- ─────────────────────────────────────────────────────────
-- 11. Create view for admin to see pending updates
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW admin_pending_updates AS
SELECT
    pcu.id,
    pcu.course_id,
    c.title AS course_title,
    pcu.coach_id,
    p.first_name || ' ' || p.last_name AS coach_name,
    pcu.change_description,
    pcu.status,
    pcu.submitted_at,
    cv.version_number,
    (SELECT COUNT(*) FROM modules WHERE version_id = cv.id) AS module_count,
    (SELECT COUNT(*) FROM module_content_items WHERE version_id = cv.id) AS content_count
FROM pending_course_updates pcu
JOIN courses c ON c.id = pcu.course_id
JOIN profiles p ON p.id = pcu.coach_id
JOIN course_versions cv ON cv.id = pcu.course_version_id
WHERE pcu.status = 'pending'
ORDER BY pcu.submitted_at DESC;

-- ─────────────────────────────────────────────────────────
-- 12. Comments
-- ─────────────────────────────────────────────────────────
COMMENT ON FUNCTION get_published_course_version IS 'Returns the published version ID for a course (student view)';
COMMENT ON FUNCTION get_or_create_draft_version IS 'Creates/gets draft version for coach editing';
COMMENT ON FUNCTION start_course_update IS 'Coach starts an update - creates draft and pending request';
COMMENT ON FUNCTION approve_course_update IS 'Admin approves - merges draft into published';
COMMENT ON FUNCTION reject_course_update IS 'Admin rejects - deletes draft';
COMMENT ON VIEW student_course_curriculum IS 'Student view: only published curriculum';
COMMENT ON VIEW admin_pending_updates IS 'Admin view: pending updates with counts';
