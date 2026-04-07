-- =====================================================
-- Fix Course Curriculum Publishing
-- =====================================================
-- This migration fixes the issue where approved curriculum
-- data is not appearing on the student side.
-- =====================================================

-- ─────────────────────────────────────────────────────────
-- 1. Create a simpler, more reliable approve function
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION approve_course_update_simple(
    p_pending_update_id UUID,
    p_admin_id UUID,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_pending_update RECORD;
    v_course_id UUID;
    v_version_id UUID;
    v_module_update RECORD;
    v_content_update RECORD;
BEGIN
    -- Get pending update details
    SELECT * INTO v_pending_update
    FROM pending_course_updates
    WHERE id = p_pending_update_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending update not found';
    END IF;

    v_course_id := v_pending_update.course_id;
    v_version_id := v_pending_update.course_version_id;

    -- Update pending update status
    UPDATE pending_course_updates
    SET
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = p_admin_id,
        review_notes = p_review_notes
    WHERE id = p_pending_update_id;

    -- Update course version status to published
    UPDATE course_versions
    SET
        status = 'published',
        approved_at = NOW(),
        approved_by = p_admin_id,
        published_at = NOW()
    WHERE id = v_version_id;

    -- Mark all other versions as not published
    UPDATE course_versions
    SET status = 'approved'
    WHERE course_id = v_course_id
    AND id != v_version_id
    AND status = 'published';

    -- Apply module updates
    FOR v_module_update IN
        SELECT * FROM pending_module_updates
        WHERE pending_update_id = p_pending_update_id
        ORDER BY created_at
    LOOP
        IF v_module_update.action = 'create' THEN
            -- Create new module with version tracking
            INSERT INTO modules (
                course_id, title, position, is_sequential,
                drip_mode, drip_days, drip_date,
                version_id, is_published_version, is_published
            ) VALUES (
                v_course_id,
                v_module_update.title,
                COALESCE(v_module_update.position, 999),
                COALESCE(v_module_update.is_sequential, false),
                COALESCE(v_module_update.drip_mode, 'immediate'),
                v_module_update.drip_days,
                v_module_update.drip_date,
                v_version_id,
                true,
                true
            );

        ELSIF v_module_update.action = 'update' THEN
            -- Update existing module AND mark as published
            UPDATE modules
            SET
                title = COALESCE(v_module_update.title, title),
                position = COALESCE(v_module_update.position, position),
                is_sequential = COALESCE(v_module_update.is_sequential, is_sequential),
                drip_mode = COALESCE(v_module_update.drip_mode, drip_mode),
                drip_days = COALESCE(v_module_update.drip_days, drip_days),
                drip_date = COALESCE(v_module_update.drip_date, drip_date),
                version_id = v_version_id,
                is_published_version = true,
                is_published = true
            WHERE id = v_module_update.module_id;

        ELSIF v_module_update.action = 'delete' THEN
            -- Mark module as unpublished (don't delete)
            UPDATE modules
            SET
                is_published_version = false,
                is_published = false
            WHERE id = v_module_update.module_id;

        ELSIF v_module_update.action = 'reorder' THEN
            -- Just update position
            UPDATE modules
            SET
                position = COALESCE(v_module_update.new_position, v_module_update.position),
                version_id = v_version_id,
                is_published_version = true,
                is_published = true
            WHERE id = v_module_update.module_id;
        END IF;
    END LOOP;

    -- Apply content item updates
    FOR v_content_update IN
        SELECT * FROM pending_content_item_updates
        WHERE pending_update_id = p_pending_update_id
        ORDER BY created_at
    LOOP
        IF v_content_update.action = 'create' THEN
            -- Get the module_id from the module_update
            DECLARE
                v_target_module_id UUID;
            BEGIN
                SELECT module_id INTO v_target_module_id
                FROM modules
                WHERE id = v_content_update.module_update_id
                OR (
                    SELECT module_id FROM pending_module_updates
                    WHERE id = v_content_update.module_update_id
                ) IS NOT NULL;

                -- If we have a module_update_id reference, get the actual module
                IF v_content_update.module_update_id IS NOT NULL THEN
                    SELECT pmu.module_id INTO v_target_module_id
                    FROM pending_module_updates pmu
                    WHERE pmu.id = v_content_update.module_update_id;

                    -- If module_id is null, it's a new module, get the most recently created one
                    IF v_target_module_id IS NULL THEN
                        SELECT id INTO v_target_module_id
                        FROM modules
                        WHERE course_id = v_course_id
                        AND version_id = v_version_id
                        ORDER BY created_at DESC
                        LIMIT 1;
                    END IF;
                END IF;

                -- Create new content item
                INSERT INTO module_content_items (
                    module_id, content_type, content_id, position,
                    version_id, is_published_version, is_published
                ) VALUES (
                    COALESCE(v_target_module_id, (
                        SELECT id FROM modules
                        WHERE course_id = v_course_id
                        AND version_id = v_version_id
                        ORDER BY created_at DESC
                        LIMIT 1
                    )),
                    v_content_update.content_type,
                    v_content_update.content_id,
                    COALESCE(v_content_update.position, 999),
                    v_version_id,
                    true,
                    true
                );
            END;

        ELSIF v_content_update.action = 'update' THEN
            -- Update content item AND mark as published
            UPDATE module_content_items
            SET
                position = COALESCE(v_content_update.position, position),
                version_id = v_version_id,
                is_published_version = true,
                is_published = true
            WHERE id = v_content_update.content_item_id;

            -- Update lesson if it's a lesson
            IF v_content_update.content_type = 'lesson' THEN
                UPDATE lessons
                SET
                    title = COALESCE(v_content_update.title_change, title),
                    description = COALESCE(v_content_update.description_change, description),
                    content_blocks = COALESCE(v_content_update.content_blocks_change, content_blocks),
                    estimated_duration_minutes = COALESCE(v_content_update.estimated_duration_change, estimated_duration_minutes),
                    version_id = v_version_id,
                    is_published_version = true,
                    is_published = true
                WHERE id = v_content_update.content_id;

            -- Update quiz if it's a quiz
            ELSIF v_content_update.content_type = 'quiz' THEN
                UPDATE quizzes
                SET
                    title = COALESCE(v_content_update.title_change, title),
                    description = COALESCE(v_content_update.description_change, description),
                    version_id = v_version_id,
                    is_published_version = true,
                    is_published = true
                WHERE id = v_content_update.content_id;
            END IF;

        ELSIF v_content_update.action = 'delete' THEN
            -- Mark content item as unpublished
            UPDATE module_content_items
            SET
                is_published_version = false,
                is_published = false
            WHERE id = v_content_update.content_item_id;

        ELSIF v_content_update.action = 'reorder' THEN
            -- Just update position
            UPDATE module_content_items
            SET
                position = COALESCE(v_content_update.new_position, v_content_update.position),
                version_id = v_version_id,
                is_published_version = true,
                is_published = true
            WHERE id = v_content_update.content_item_id;
        END IF;
    END LOOP;

    -- Apply course-level changes
    UPDATE courses
    SET
        title = COALESCE(v_pending_update.title_change, title),
        subtitle = COALESCE(v_pending_update.subtitle_change, subtitle),
        long_description = COALESCE(v_pending_update.description_change, long_description),
        price = COALESCE(v_pending_update.price_change, price),
        level = COALESCE(v_pending_update.level_change, level),
        updated_at = NOW()
    WHERE id = v_course_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 2. Create a helper function to publish ALL existing curriculum
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION publish_all_course_curriculum(
    p_course_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_version_id UUID;
    v_module RECORD;
    v_content RECORD;
BEGIN
    -- Get or create a published version
    SELECT id INTO v_version_id
    FROM course_versions
    WHERE course_id = p_course_id
    AND status = 'published'
    ORDER BY version_number DESC
    LIMIT 1;

    -- If no published version exists, create one
    IF v_version_id IS NULL THEN
        INSERT INTO course_versions (
            course_id, version_number, status, coach_id,
            version_name, change_summary, published_at
        )
        SELECT
            p_course_id,
            COALESCE((SELECT MAX(version_number) FROM course_versions WHERE course_id = p_course_id), 0) + 1,
            'published',
            coach_id,
            'v' || (COALESCE((SELECT MAX(version_number) FROM course_versions WHERE course_id = p_course_id), 0) + 1) || '.0',
            'Initial published version',
            NOW()
        FROM courses
        WHERE id = p_course_id
        RETURNING id INTO v_version_id;
    END IF;

    -- Mark all modules for this course as published
    UPDATE modules
    SET
        version_id = v_version_id,
        is_published_version = true,
        is_published = true
    WHERE course_id = p_course_id;

    -- Mark all content items for this course as published
    UPDATE module_content_items mci
    SET
        version_id = v_version_id,
        is_published_version = true,
        is_published = true
    FROM modules m
    WHERE mci.module_id = m.id
    AND m.course_id = p_course_id;

    -- Mark all lessons for this course as published
    UPDATE lessons l
    SET
        version_id = v_version_id,
        is_published_version = true,
        is_published = true
    FROM module_content_items mci
    WHERE mci.content_id = l.id
    AND mci.content_type = 'lesson'
    AND mci.module_id IN (SELECT id FROM modules WHERE course_id = p_course_id);

    -- Mark all quizzes for this course as published
    UPDATE quizzes q
    SET
        version_id = v_version_id,
        is_published_version = true,
        is_published = true
    FROM module_content_items mci
    WHERE mci.content_id = q.id
    AND mci.content_type = 'quiz'
    AND mci.module_id IN (SELECT id FROM modules WHERE course_id = p_course_id);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 3. Update the original approve function to use the simple one
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION approve_course_update(
    p_pending_update_id UUID,
    p_admin_id UUID,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Use the simpler, more reliable function
    RETURN approve_course_update_simple(p_pending_update_id, p_admin_id, p_review_notes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 4. Create a view for debugging curriculum visibility
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW course_curriculum_visibility AS
SELECT
    c.id AS course_id,
    c.title AS course_title,
    cv.id AS version_id,
    cv.status AS version_status,
    cv.version_number,
    m.id AS module_id,
    m.title AS module_title,
    m.is_published AS module_is_published,
    m.is_published_version AS module_is_published_version,
    m.version_id AS module_version_id,
    mci.id AS content_item_id,
    mci.content_type,
    mci.is_published AS content_is_published,
    mci.is_published_version AS content_is_published_version,
    mci.version_id AS content_version_id,
    CASE
        WHEN cv.status = 'published'
            AND m.is_published_version = true
            AND mci.is_published_version = true
        THEN 'VISIBLE_TO_STUDENTS'
        ELSE 'HIDDEN_FROM_STUDENTS'
    END AS visibility_status
FROM courses c
LEFT JOIN course_versions cv ON cv.course_id = c.id AND cv.status = 'published'
LEFT JOIN modules m ON m.course_id = c.id AND (m.version_id = cv.id OR m.is_published_version = true)
LEFT JOIN module_content_items mci ON mci.module_id = m.id AND (mci.version_id = cv.id OR mci.is_published_version = true)
ORDER BY c.id, m.position, mci.position;

-- ─────────────────────────────────────────────────────────
-- 5. Create function to fix visibility for a specific course
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fix_course_curriculum_visibility(
    p_course_id UUID
)
RETURNS TEXT AS $$
DECLARE
    v_version_id UUID;
    v_modules_fixed INTEGER := 0;
    v_content_fixed INTEGER := 0;
    v_lessons_fixed INTEGER := 0;
    v_quizzes_fixed INTEGER := 0;
    v_result TEXT;
BEGIN
    -- Get or create published version
    SELECT id INTO v_version_id
    FROM course_versions
    WHERE course_id = p_course_id
    AND status = 'published'
    ORDER BY version_number DESC
    LIMIT 1;

    IF v_version_id IS NULL THEN
        -- Create published version
        INSERT INTO course_versions (
            course_id, version_number, status, coach_id,
            version_name, change_summary, published_at
        )
        SELECT
            p_course_id,
            1,
            'published',
            coach_id,
            'v1.0',
            'Published via fix_course_curriculum_visibility',
            NOW()
        FROM courses
        WHERE id = p_course_id
        RETURNING id INTO v_version_id;
    END IF;

    -- Fix modules
    UPDATE modules
    SET
        version_id = v_version_id,
        is_published_version = true,
        is_published = true
    WHERE course_id = p_course_id
    AND (version_id IS NULL OR is_published_version = false);
    GET DIAGNOSTICS v_modules_fixed = ROW_COUNT;

    -- Fix content items
    UPDATE module_content_items mci
    SET
        version_id = v_version_id,
        is_published_version = true,
        is_published = true
    FROM modules m
    WHERE mci.module_id = m.id
    AND m.course_id = p_course_id
    AND (mci.version_id IS NULL OR mci.is_published_version = false);
    GET DIAGNOSTICS v_content_fixed = ROW_COUNT;

    -- Fix lessons
    UPDATE lessons l
    SET
        version_id = v_version_id,
        is_published_version = true,
        is_published = true
    FROM module_content_items mci
    WHERE mci.content_id = l.id
    AND mci.content_type = 'lesson'
    AND mci.module_id IN (SELECT id FROM modules WHERE course_id = p_course_id)
    AND (l.version_id IS NULL OR l.is_published_version = false);
    GET DIAGNOSTICS v_lessons_fixed = ROW_COUNT;

    -- Fix quizzes
    UPDATE quizzes q
    SET
        version_id = v_version_id,
        is_published_version = true,
        is_published = true
    FROM module_content_items mci
    WHERE mci.content_id = q.id
    AND mci.content_type = 'quiz'
    AND mci.module_id IN (SELECT id FROM modules WHERE course_id = p_course_id)
    AND (q.version_id IS NULL OR q.is_published_version = false);
    GET DIAGNOSTICS v_quizzes_fixed = ROW_COUNT;

    v_result := format(
        'Fixed curriculum visibility for course %s: %s modules, %s content items, %s lessons, %s quizzes',
        p_course_id,
        v_modules_fixed,
        v_content_fixed,
        v_lessons_fixed,
        v_quizzes_fixed
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 6. Add comments
-- ─────────────────────────────────────────────────────────
COMMENT ON FUNCTION approve_course_update_simple IS 'Simpler, more reliable function to approve course updates';
COMMENT ON FUNCTION publish_all_course_curriculum IS 'Publishes all existing curriculum for a course (useful for initial setup)';
COMMENT ON FUNCTION fix_course_curriculum_visibility IS 'Fixes visibility issues by ensuring all curriculum is linked to published version';
COMMENT ON VIEW course_curriculum_visibility IS 'Debug view to check curriculum visibility status';
