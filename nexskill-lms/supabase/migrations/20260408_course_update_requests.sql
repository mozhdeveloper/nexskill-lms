-- =====================================================
-- Course Update Request System
-- =====================================================
-- Allows coaches to submit course updates for admin approval
-- Students always see published version until approved
-- =====================================================

-- ──────────────────────────────────────────────────────
-- 1. Create course_update_requests table
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_update_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Request metadata
    title TEXT NOT NULL,
    description TEXT,
    change_summary TEXT NOT NULL,
    update_type TEXT NOT NULL DEFAULT 'content_update' CHECK (update_type IN ('content_update', 'price_change', 'metadata_update', 'major_revision')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- Version tracking
    version_number INTEGER NOT NULL DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_course_update_requests_course ON course_update_requests(course_id);
CREATE INDEX idx_course_update_requests_coach ON course_update_requests(coach_id);
CREATE INDEX idx_course_update_requests_status ON course_update_requests(status);

-- ──────────────────────────────────────────────────────
-- 2. Create pending_course_changes table
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pending_course_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_request_id UUID NOT NULL REFERENCES course_update_requests(id) ON DELETE CASCADE,
    
    -- What entity is being changed
    entity_type TEXT NOT NULL CHECK (entity_type IN ('module', 'lesson', 'quiz', 'course')),
    entity_id UUID NOT NULL,
    
    -- Type of change
    change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
    
    -- Store the proposed data
    old_data JSONB,
    new_data JSONB,
    
    -- For modules: which fields changed
    changed_fields TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pending_course_changes_request ON pending_course_changes(update_request_id);
CREATE INDEX idx_pending_course_changes_entity ON pending_course_changes(entity_type, entity_id);

-- ──────────────────────────────────────────────────────
-- 3. Enable RLS
-- ──────────────────────────────────────────────────────
ALTER TABLE course_update_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_course_changes ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────
-- 4. Create RLS Policies
-- ──────────────────────────────────────────────────────
-- Coaches can view their own update requests
CREATE POLICY "Coaches can view their own update requests"
    ON course_update_requests FOR SELECT
    USING (coach_id = auth.uid());

-- Coaches can create update requests
CREATE POLICY "Coaches can create update requests"
    ON course_update_requests FOR INSERT
    WITH CHECK (coach_id = auth.uid());

-- Coaches can update their pending requests
CREATE POLICY "Coaches can update their pending requests"
    ON course_update_requests FOR UPDATE
    USING (coach_id = auth.uid() AND status = 'pending');

-- Admins can view all update requests
CREATE POLICY "Admins can view all update requests"
    ON course_update_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Admins can update all update requests
CREATE POLICY "Admins can update all update requests"
    ON course_update_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Coaches can view their pending changes
CREATE POLICY "Coaches can view their pending changes"
    ON pending_course_changes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM course_update_requests cur
            WHERE cur.id = update_request_id
            AND cur.coach_id = auth.uid()
        )
    );

-- Coaches can create pending changes
CREATE POLICY "Coaches can create pending changes"
    ON pending_course_changes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM course_update_requests cur
            WHERE cur.id = update_request_id
            AND cur.coach_id = auth.uid()
            AND cur.status = 'pending'
        )
    );

-- Admins can view all pending changes
CREATE POLICY "Admins can view all pending changes"
    ON pending_course_changes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- ──────────────────────────────────────────────────────
-- 5. Create function to submit course update
-- ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION submit_course_update_request(
    p_course_id UUID,
    p_coach_id UUID,
    p_title TEXT,
    p_change_summary TEXT,
    p_update_type TEXT DEFAULT 'content_update',
    p_changes JSONB[] DEFAULT ARRAY[]::JSONB[]
)
RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
    v_version_number INTEGER;
    v_change JSONB;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM course_update_requests
    WHERE course_id = p_course_id;
    
    -- Create update request
    INSERT INTO course_update_requests (
        course_id, coach_id, title, change_summary,
        update_type, version_number
    ) VALUES (
        p_course_id, p_coach_id, p_title, p_change_summary,
        p_update_type, v_version_number
    ) RETURNING id INTO v_request_id;
    
    -- Create pending changes
    FOREACH v_change IN ARRAY p_changes LOOP
        INSERT INTO pending_course_changes (
            update_request_id, entity_type, entity_id,
            change_type, old_data, new_data, changed_fields
        ) VALUES (
            v_request_id,
            (v_change->>'entity_type')::TEXT,
            (v_change->>'entity_id')::UUID,
            (v_change->>'change_type')::TEXT,
            v_change->'old_data',
            v_change->'new_data',
            (v_change->>'changed_fields')::TEXT[]
        );
    END LOOP;
    
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────────────
-- 6. Create function to approve course update
-- ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION approve_course_update_request(
    p_request_id UUID,
    p_admin_id UUID,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_request RECORD;
    v_change RECORD;
BEGIN
    -- Get request details
    SELECT * INTO v_request
    FROM course_update_requests
    WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Update request not found';
    END IF;
    
    -- Apply each change
    FOR v_change IN
        SELECT * FROM pending_course_changes
        WHERE update_request_id = p_request_id
    LOOP
        IF v_change.entity_type = 'module' THEN
            IF v_change.change_type = 'create' OR v_change.change_type = 'update' THEN
                -- Insert or update module
                INSERT INTO modules (id, course_id, title, position, is_sequential, drip_mode, drip_days, drip_date, created_at)
                SELECT 
                    (v_change.new_data->>'id')::UUID,
                    (v_change.new_data->>'course_id')::UUID,
                    v_change.new_data->>'title',
                    (v_change.new_data->>'position')::INTEGER,
                    COALESCE((v_change.new_data->>'is_sequential')::BOOLEAN, false),
                    COALESCE(v_change.new_data->>'drip_mode', 'immediate'),
                    (v_change.new_data->>'drip_days')::INTEGER,
                    (v_change.new_data->>'drip_date')::TIMESTAMPTZ,
                    NOW()
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    position = EXCLUDED.position,
                    is_sequential = EXCLUDED.is_sequential,
                    drip_mode = EXCLUDED.drip_mode,
                    drip_days = EXCLUDED.drip_days,
                    drip_date = EXCLUDED.drip_date,
                    is_published = true;
                
            ELSIF v_change.change_type = 'delete' THEN
                -- Mark module as not published (don't delete)
                UPDATE modules SET is_published = false
                WHERE id = v_change.entity_id;
            END IF;
            
        ELSIF v_change.entity_type = 'lesson' THEN
            IF v_change.change_type = 'create' OR v_change.change_type = 'update' THEN
                -- Insert or update lesson
                INSERT INTO lessons (id, title, description, content_blocks, estimated_duration_minutes, is_published, created_at)
                SELECT 
                    (v_change.new_data->>'id')::UUID,
                    v_change.new_data->>'title',
                    v_change.new_data->>'description',
                    v_change.new_data->'content_blocks',
                    (v_change.new_data->>'estimated_duration_minutes')::INTEGER,
                    true,
                    NOW()
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    content_blocks = EXCLUDED.content_blocks,
                    estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
                    is_published = true;
                
            ELSIF v_change.change_type = 'delete' THEN
                UPDATE lessons SET is_published = false
                WHERE id = v_change.entity_id;
            END IF;
            
        ELSIF v_change.entity_type = 'quiz' THEN
            IF v_change.change_type = 'create' OR v_change.change_type = 'update' THEN
                -- Insert or update quiz
                INSERT INTO quizzes (id, title, description, passing_score, time_limit_minutes, is_published, created_at)
                SELECT 
                    (v_change.new_data->>'id')::UUID,
                    v_change.new_data->>'title',
                    v_change.new_data->>'description',
                    (v_change.new_data->>'passing_score')::INTEGER,
                    (v_change.new_data->>'time_limit_minutes')::INTEGER,
                    true,
                    NOW()
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    passing_score = EXCLUDED.passing_score,
                    time_limit_minutes = EXCLUDED.time_limit_minutes,
                    is_published = true;
                
            ELSIF v_change.change_type = 'delete' THEN
                UPDATE quizzes SET is_published = false
                WHERE id = v_change.entity_id;
            END IF;
        END IF;
    END LOOP;
    
    -- Update request status
    UPDATE course_update_requests
    SET
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = p_admin_id,
        review_notes = p_review_notes
    WHERE id = p_request_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────────────
-- 7. Create function to reject course update
-- ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reject_course_update_request(
    p_request_id UUID,
    p_admin_id UUID,
    p_rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE course_update_requests
    SET
        status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = p_admin_id,
        rejection_reason = p_rejection_reason
    WHERE id = p_request_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────────────
-- 8. Create view for admin dashboard
-- ──────────────────────────────────────────────────────
CREATE OR REPLACE VIEW admin_course_update_requests AS
SELECT
    cur.id,
    cur.course_id,
    c.title AS course_title,
    cur.coach_id,
    p.first_name || ' ' || p.last_name AS coach_name,
    p.email AS coach_email,
    cur.title AS request_title,
    cur.change_summary,
    cur.update_type,
    cur.priority,
    cur.status,
    cur.version_number,
    cur.submitted_at,
    cur.reviewed_at,
    reviewer.first_name || ' ' || reviewer.last_name AS reviewer_name,
    cur.review_notes,
    cur.rejection_reason,
    (SELECT COUNT(*) FROM pending_course_changes pcc WHERE pcc.update_request_id = cur.id) AS changes_count
FROM course_update_requests cur
JOIN courses c ON c.id = cur.course_id
JOIN profiles p ON p.id = cur.coach_id
LEFT JOIN profiles reviewer ON reviewer.id = cur.reviewed_by
ORDER BY cur.submitted_at DESC;

-- ──────────────────────────────────────────────────────
-- 9. Create view for coach dashboard
-- ──────────────────────────────────────────────────────
CREATE OR REPLACE VIEW coach_course_update_requests AS
SELECT
    cur.id,
    cur.course_id,
    c.title AS course_title,
    cur.title AS request_title,
    cur.change_summary,
    cur.update_type,
    cur.priority,
    cur.status,
    cur.version_number,
    cur.submitted_at,
    cur.reviewed_at,
    cur.review_notes,
    cur.rejection_reason,
    (SELECT COUNT(*) FROM pending_course_changes pcc WHERE pcc.update_request_id = cur.id) AS changes_count
FROM course_update_requests cur
JOIN courses c ON c.id = cur.course_id
WHERE cur.coach_id = auth.uid()
ORDER BY cur.submitted_at DESC;

-- ──────────────────────────────────────────────────────
-- 10. Comments
-- ──────────────────────────────────────────────────────
COMMENT ON TABLE course_update_requests IS 'Tracks course update requests submitted by coaches for admin approval';
COMMENT ON TABLE pending_course_changes IS 'Stores individual changes (modules, lessons, quizzes) in an update request';
COMMENT ON FUNCTION submit_course_update_request IS 'Creates a new course update request with changes';
COMMENT ON FUNCTION approve_course_update_request IS 'Admin approves and applies pending changes';
COMMENT ON FUNCTION reject_course_update_request IS 'Admin rejects an update request';
COMMENT ON VIEW admin_course_update_requests IS 'Admin view of all course update requests';
COMMENT ON VIEW coach_course_update_requests IS 'Coach view of their own update requests';
