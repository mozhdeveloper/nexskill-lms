-- =====================================================
-- Course Versioning System with Admin Approval
-- =====================================================
-- Allows coaches to submit course updates for admin review
-- Students always see the last approved version
-- =====================================================

-- ─────────────────────────────────────────────────────────
-- 1. Create course_versions table
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'published')),
    version_name TEXT, -- e.g., "v1.0", "v1.1 - Added React modules"
    change_summary TEXT, -- Description of what changed in this version
    coach_id UUID NOT NULL REFERENCES profiles(id),
    published_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES profiles(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, version_number)
);

CREATE INDEX idx_course_versions_course ON course_versions(course_id);
CREATE INDEX idx_course_versions_status ON course_versions(status);
CREATE INDEX idx_course_versions_coach ON course_versions(coach_id);

-- ─────────────────────────────────────────────────────────
-- 2. Create pending_course_updates table
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pending_course_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    course_version_id UUID NOT NULL REFERENCES course_versions(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Course-level changes
    title_change TEXT, -- New title (if changed)
    subtitle_change TEXT,
    description_change TEXT,
    price_change NUMERIC,
    level_change TEXT,
    
    -- Metadata
    update_type TEXT NOT NULL DEFAULT 'content_update' CHECK (update_type IN ('content_update', 'price_change', 'metadata_update', 'major_revision')),
    change_description TEXT NOT NULL, -- Coach's description of changes
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),
    review_notes TEXT,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pending_course_updates_course ON pending_course_updates(course_id);
CREATE INDEX idx_pending_course_updates_status ON pending_course_updates(status);
CREATE INDEX idx_pending_course_updates_coach ON pending_course_updates(coach_id);

-- ─────────────────────────────────────────────────────────
-- 3. Create pending_module_updates table
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pending_module_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pending_update_id UUID NOT NULL REFERENCES pending_course_updates(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE, -- NULL if new module
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'reorder')),
    
    -- Module data
    title TEXT, -- New/updated title
    position INTEGER,
    is_sequential BOOLEAN DEFAULT false,
    drip_mode TEXT DEFAULT 'immediate',
    drip_days INTEGER,
    drip_date TIMESTAMPTZ,
    
    -- For reordering
    old_position INTEGER,
    new_position INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pending_module_updates_pending ON pending_module_updates(pending_update_id);
CREATE INDEX idx_pending_module_updates_module ON pending_module_updates(module_id);

-- ─────────────────────────────────────────────────────────
-- 4. Create pending_content_item_updates table
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pending_content_item_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pending_update_id UUID NOT NULL REFERENCES pending_course_updates(id) ON DELETE CASCADE,
    module_update_id UUID REFERENCES pending_module_updates(id) ON DELETE CASCADE,
    content_item_id UUID REFERENCES module_content_items(id) ON DELETE CASCADE, -- NULL if new item
    
    -- Content reference
    content_type TEXT NOT NULL CHECK (content_type IN ('lesson', 'quiz')),
    content_id UUID NOT NULL, -- ID of lesson or quiz
    
    -- Action
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'reorder')),
    
    -- Position/ordering
    position INTEGER,
    old_position INTEGER,
    new_position INTEGER,
    
    -- Lesson/Quiz changes
    title_change TEXT,
    description_change TEXT,
    content_blocks_change JSONB, -- For lesson content changes
    estimated_duration_change INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pending_content_updates_pending ON pending_content_item_updates(pending_update_id);
CREATE INDEX idx_pending_content_updates_module ON pending_content_item_updates(module_update_id);
CREATE INDEX idx_pending_content_updates_item ON pending_content_item_updates(content_item_id);

-- ─────────────────────────────────────────────────────────
-- 5. Add version tracking to existing tables
-- ─────────────────────────────────────────────────────────
-- Add version_id to modules to track which version they belong to
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'version_id') THEN
        ALTER TABLE modules ADD COLUMN version_id UUID REFERENCES course_versions(id) ON DELETE CASCADE;
        ALTER TABLE modules ADD COLUMN is_published_version BOOLEAN DEFAULT false;
        CREATE INDEX idx_modules_version ON modules(version_id);
    END IF;
END $$;

-- Add version_id to module_content_items
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'module_content_items' AND column_name = 'version_id') THEN
        ALTER TABLE module_content_items ADD COLUMN version_id UUID REFERENCES course_versions(id) ON DELETE CASCADE;
        ALTER TABLE module_content_items ADD COLUMN is_published_version BOOLEAN DEFAULT false;
        CREATE INDEX idx_module_content_items_version ON module_content_items(version_id);
    END IF;
END $$;

-- Add version tracking to lessons
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'version_id') THEN
        ALTER TABLE lessons ADD COLUMN version_id UUID REFERENCES course_versions(id) ON DELETE SET NULL;
        ALTER TABLE lessons ADD COLUMN original_lesson_id UUID REFERENCES lessons(id); -- For tracking lesson versions
        ALTER TABLE lessons ADD COLUMN is_published_version BOOLEAN DEFAULT false;
        CREATE INDEX idx_lessons_version ON lessons(version_id);
    END IF;
END $$;

-- Add version tracking to quizzes
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'version_id') THEN
        ALTER TABLE quizzes ADD COLUMN version_id UUID REFERENCES course_versions(id) ON DELETE SET NULL;
        ALTER TABLE quizzes ADD COLUMN original_quiz_id UUID REFERENCES quizzes(id); -- For tracking quiz versions
        ALTER TABLE quizzes ADD COLUMN is_published_version BOOLEAN DEFAULT false;
        CREATE INDEX idx_quizzes_version ON quizzes(version_id);
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────
-- 6. Enable RLS
-- ─────────────────────────────────────────────────────────
ALTER TABLE course_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_course_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_module_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_content_item_updates ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────
-- 7. Create RLS Policies
-- ─────────────────────────────────────────────────────────
-- course_versions policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view published course versions') THEN
        CREATE POLICY "Anyone can view published course versions"
            ON course_versions FOR SELECT
            USING (status = 'published');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can view their own course versions') THEN
        CREATE POLICY "Coaches can view their own course versions"
            ON course_versions FOR SELECT
            USING (coach_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can create course versions') THEN
        CREATE POLICY "Coaches can create course versions"
            ON course_versions FOR INSERT
            WITH CHECK (coach_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can update their draft versions') THEN
        CREATE POLICY "Coaches can update their draft versions"
            ON course_versions FOR UPDATE
            USING (coach_id = auth.uid() AND status = 'draft');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all course versions') THEN
        CREATE POLICY "Admins can manage all course versions"
            ON course_versions FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role = 'admin'
                )
            );
    END IF;
END $$;

-- pending_course_updates policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can view their own pending updates') THEN
        CREATE POLICY "Coaches can view their own pending updates"
            ON pending_course_updates FOR SELECT
            USING (coach_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all pending updates') THEN
        CREATE POLICY "Admins can view all pending updates"
            ON pending_course_updates FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role = 'admin'
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can create pending updates') THEN
        CREATE POLICY "Coaches can create pending updates"
            ON pending_course_updates FOR INSERT
            WITH CHECK (coach_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can update their pending updates before review') THEN
        CREATE POLICY "Coaches can update their pending updates before review"
            ON pending_course_updates FOR UPDATE
            USING (coach_id = auth.uid() AND status = 'pending');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all pending updates') THEN
        CREATE POLICY "Admins can manage all pending updates"
            ON pending_course_updates FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role = 'admin'
                )
            );
    END IF;
END $$;

-- pending_module_updates policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can view their pending module updates') THEN
        CREATE POLICY "Coaches can view their pending module updates"
            ON pending_module_updates FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM pending_course_updates pcu
                    WHERE pcu.id = pending_update_id
                    AND pcu.coach_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all pending module updates') THEN
        CREATE POLICY "Admins can view all pending module updates"
            ON pending_module_updates FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role = 'admin'
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can manage their pending module updates') THEN
        CREATE POLICY "Coaches can manage their pending module updates"
            ON pending_module_updates FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM pending_course_updates pcu
                    WHERE pcu.id = pending_update_id
                    AND pcu.coach_id = auth.uid()
                    AND pcu.status = 'pending'
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all pending module updates') THEN
        CREATE POLICY "Admins can manage all pending module updates"
            ON pending_module_updates FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role = 'admin'
                )
            );
    END IF;
END $$;

-- pending_content_item_updates policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can view their pending content updates') THEN
        CREATE POLICY "Coaches can view their pending content updates"
            ON pending_content_item_updates FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM pending_course_updates pcu
                    WHERE pcu.id = pending_update_id
                    AND pcu.coach_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all pending content updates') THEN
        CREATE POLICY "Admins can view all pending content updates"
            ON pending_content_item_updates FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role = 'admin'
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can manage their pending content updates') THEN
        CREATE POLICY "Coaches can manage their pending content updates"
            ON pending_content_item_updates FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM pending_course_updates pcu
                    WHERE pcu.id = pending_update_id
                    AND pcu.coach_id = auth.uid()
                    AND pcu.status = 'pending'
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all pending content updates') THEN
        CREATE POLICY "Admins can manage all pending content updates"
            ON pending_content_item_updates FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role = 'admin'
                )
            );
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────
-- 8. Create helper functions
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

CREATE OR REPLACE FUNCTION get_latest_course_version(p_course_id UUID)
RETURNS UUID AS $$
DECLARE
    v_version_id UUID;
BEGIN
    SELECT id INTO v_version_id
    FROM course_versions
    WHERE course_id = p_course_id
    ORDER BY version_number DESC
    LIMIT 1;
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_course_update(
    p_course_id UUID,
    p_coach_id UUID,
    p_change_description TEXT,
    p_update_type TEXT DEFAULT 'content_update',
    p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
    v_version_id UUID;
    v_version_number INTEGER;
    v_pending_update_id UUID;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM course_versions
    WHERE course_id = p_course_id;
    
    -- Create new version record
    INSERT INTO course_versions (course_id, version_number, status, coach_id, version_name, change_summary)
    VALUES (p_course_id, v_version_number, 'draft', p_coach_id, 
            CONCAT('v', v_version_number, '.0'), p_change_description)
    RETURNING id INTO v_version_id;
    
    -- Create pending update record
    INSERT INTO pending_course_updates (
        course_id, course_version_id, coach_id, 
        change_description, update_type, priority, status
    )
    VALUES (p_course_id, v_version_id, p_coach_id, 
            p_change_description, p_update_type, p_priority, 'pending')
    RETURNING id INTO v_pending_update_id;
    
    RETURN v_pending_update_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION approve_course_update(
    p_pending_update_id UUID,
    p_admin_id UUID,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_pending_update RECORD;
    v_module_update RECORD;
    v_content_update RECORD;
    v_new_module_id UUID;
    v_new_content_item_id UUID;
BEGIN
    -- Get pending update details
    SELECT * INTO v_pending_update
    FROM pending_course_updates
    WHERE id = p_pending_update_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending update not found';
    END IF;
    
    -- Update pending update status
    UPDATE pending_course_updates
    SET 
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = p_admin_id,
        review_notes = p_review_notes
    WHERE id = p_pending_update_id;
    
    -- Update course version status
    UPDATE course_versions
    SET 
        status = 'published',
        approved_at = NOW(),
        approved_by = p_admin_id,
        published_at = NOW()
    WHERE id = v_pending_update.course_version_id;
    
    -- Mark previous published version as not published
    UPDATE course_versions
    SET status = 'approved'
    WHERE course_id = v_pending_update.course_id
    AND id != v_pending_update.course_version_id
    AND status = 'published';
    
    -- Apply module updates
    FOR v_module_update IN 
        SELECT * FROM pending_module_updates 
        WHERE pending_update_id = p_pending_update_id
    LOOP
        IF v_module_update.action = 'create' THEN
            -- Create new module
            INSERT INTO modules (
                course_id, title, position, is_sequential, 
                drip_mode, drip_days, drip_date, version_id, is_published_version
            ) VALUES (
                v_pending_update.course_id,
                v_module_update.title,
                v_module_update.position,
                v_module_update.is_sequential,
                v_module_update.drip_mode,
                v_module_update.drip_days,
                v_module_update.drip_date,
                v_pending_update.course_version_id,
                true
            ) RETURNING id INTO v_new_module_id;
            
            -- Update content item references
            UPDATE pending_content_item_updates
            SET module_update_id = v_new_module_id
            WHERE module_update_id = v_module_update.id;
            
        ELSIF v_module_update.action = 'update' THEN
            -- Update existing module
            UPDATE modules
            SET 
                title = COALESCE(v_module_update.title, title),
                position = COALESCE(v_module_update.position, position),
                is_sequential = COALESCE(v_module_update.is_sequential, is_sequential),
                drip_mode = COALESCE(v_module_update.drip_mode, drip_mode),
                drip_days = COALESCE(v_module_update.drip_days, drip_days),
                drip_date = COALESCE(v_module_update.drip_date, drip_date),
                version_id = v_pending_update.course_version_id,
                is_published_version = true
            WHERE id = v_module_update.module_id;
            
        ELSIF v_module_update.action = 'delete' THEN
            -- Mark module as not published (don't actually delete for history)
            UPDATE modules
            SET is_published_version = false
            WHERE id = v_module_update.module_id;
        END IF;
    END LOOP;
    
    -- Apply content item updates
    FOR v_content_update IN 
        SELECT * FROM pending_content_item_updates 
        WHERE pending_update_id = p_pending_update_id
    LOOP
        IF v_content_update.action = 'create' THEN
            -- Create new content item
            INSERT INTO module_content_items (
                module_id, content_type, content_id, position, 
                version_id, is_published_version
            ) VALUES (
                v_content_update.module_update_id, -- This should be set from module creation
                v_content_update.content_type,
                v_content_update.content_id,
                v_content_update.position,
                v_pending_update.course_version_id,
                true
            );
            
        ELSIF v_content_update.action = 'update' THEN
            -- Update content item
            UPDATE module_content_items
            SET 
                position = COALESCE(v_content_update.position, position),
                version_id = v_pending_update.course_version_id,
                is_published_version = true
            WHERE id = v_content_update.content_item_id;
            
            -- Update lesson/quiz if needed
            IF v_content_update.content_type = 'lesson' THEN
                UPDATE lessons
                SET 
                    title = COALESCE(v_content_update.title_change, title),
                    description = COALESCE(v_content_update.description_change, description),
                    content_blocks = COALESCE(v_content_update.content_blocks_change, content_blocks),
                    estimated_duration_minutes = COALESCE(v_content_update.estimated_duration_change, estimated_duration_minutes),
                    version_id = v_pending_update.course_version_id,
                    is_published_version = true
                WHERE id = v_content_update.content_id;
            ELSIF v_content_update.content_type = 'quiz' THEN
                UPDATE quizzes
                SET 
                    title = COALESCE(v_content_update.title_change, title),
                    description = COALESCE(v_content_update.description_change, description),
                    version_id = v_pending_update.course_version_id,
                    is_published_version = true
                WHERE id = v_content_update.content_id;
            END IF;
            
        ELSIF v_content_update.action = 'delete' THEN
            -- Mark content item as not published
            UPDATE module_content_items
            SET is_published_version = false
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
    WHERE id = v_pending_update.course_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_course_update(
    p_pending_update_id UUID,
    p_admin_id UUID,
    p_rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update pending update status
    UPDATE pending_course_updates
    SET 
        status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = p_admin_id,
        rejection_reason = p_rejection_reason
    WHERE id = p_pending_update_id;
    
    -- Update course version status
    UPDATE course_versions
    SET 
        status = 'rejected',
        rejected_at = NOW(),
        rejected_by = p_admin_id,
        rejection_reason = p_rejection_reason
    WHERE course_version_id = p_pending_update_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 9. Create triggers for updated_at
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_versions_updated_at
    BEFORE UPDATE ON course_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_course_updates_updated_at
    BEFORE UPDATE ON pending_course_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_module_updates_updated_at
    BEFORE UPDATE ON pending_module_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_content_item_updates_updated_at
    BEFORE UPDATE ON pending_content_item_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────
-- 10. Create views for easy querying
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW pending_updates_with_details AS
SELECT 
    pcu.id,
    pcu.course_id,
    c.title AS course_title,
    pcu.coach_id,
    p.first_name || ' ' || p.last_name AS coach_name,
    pcu.update_type,
    pcu.change_description,
    pcu.priority,
    pcu.status,
    pcu.submitted_at,
    pcu.reviewed_at,
    reviewer.first_name || ' ' || reviewer.last_name AS reviewer_name,
    pcu.review_notes,
    pcu.rejection_reason,
    (SELECT COUNT(*) FROM pending_module_updates pmu WHERE pmu.pending_update_id = pcu.id) AS module_changes_count,
    (SELECT COUNT(*) FROM pending_content_item_updates pciu WHERE pciu.pending_update_id = pcu.id) AS content_changes_count
FROM pending_course_updates pcu
LEFT JOIN courses c ON c.id = pcu.course_id
LEFT JOIN profiles p ON p.id = pcu.coach_id
LEFT JOIN profiles reviewer ON reviewer.id = pcu.reviewed_by
ORDER BY pcu.submitted_at DESC;

CREATE OR REPLACE VIEW course_versions_with_details AS
SELECT 
    cv.id,
    cv.course_id,
    c.title AS course_title,
    cv.version_number,
    cv.status,
    cv.version_name,
    cv.change_summary,
    cv.coach_id,
    coach.first_name || ' ' || coach.last_name AS coach_name,
    cv.published_at,
    cv.approved_at,
    approver.first_name || ' ' || approver.last_name AS approver_name,
    cv.rejected_at,
    rejecter.first_name || ' ' || rejecter.last_name AS rejecter_name,
    cv.rejection_reason,
    cv.created_at
FROM course_versions cv
LEFT JOIN courses c ON c.id = cv.course_id
LEFT JOIN profiles coach ON coach.id = cv.coach_id
LEFT JOIN profiles approver ON approver.id = cv.approved_by
LEFT JOIN profiles rejecter ON rejecter.id = cv.rejected_by
ORDER BY cv.course_id, cv.version_number DESC;

-- ─────────────────────────────────────────────────────────
-- 11. Add comments for documentation
-- ─────────────────────────────────────────────────────────
COMMENT ON TABLE course_versions IS 'Tracks different versions of a course through the approval workflow';
COMMENT ON TABLE pending_course_updates IS 'Stores pending course update requests awaiting admin approval';
COMMENT ON TABLE pending_module_updates IS 'Stores module-level changes in a pending update';
COMMENT ON TABLE pending_content_item_updates IS 'Stores lesson/quiz-level changes in a pending update';
COMMENT ON FUNCTION submit_course_update IS 'Creates a new draft version and pending update request';
COMMENT ON FUNCTION approve_course_update IS 'Applies pending changes to the published course';
COMMENT ON FUNCTION reject_course_update IS 'Rejects a pending update request';
COMMENT ON FUNCTION get_published_course_version IS 'Returns the currently published version ID for a course';
COMMENT ON FUNCTION get_latest_course_version IS 'Returns the most recent version ID (any status) for a course';
