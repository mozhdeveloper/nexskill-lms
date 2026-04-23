-- Migration: Unified Coach Notifications (Quiz + Enrollment)
-- Created: 2026-04-23

-- 1. Add tracking columns to enrollments
-- First add a primary key ID if it doesn't exist for easier tracking
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS coach_read_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS coach_cleared_at TIMESTAMPTZ;

-- 2. Create the unified notification function
CREATE OR REPLACE FUNCTION get_coach_all_notifications(p_coach_id UUID)
RETURNS TABLE (
    notif_id UUID,
    notif_type TEXT,
    status TEXT,
    student_name TEXT,
    content_title TEXT, -- Quiz Title or Course Title
    course_title TEXT,
    timestamp TIMESTAMPTZ,
    is_read BOOLEAN,
    course_id UUID,
    extra_id UUID -- submission_id or enrollment_id
) AS $$
BEGIN
    RETURN QUERY
    -- A. Quiz Notifications
    SELECT 
        qs.id as notif_id,
        'quiz_review'::TEXT as notif_type,
        qs.status,
        TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''))::TEXT as student_name,
        q.title as content_title,
        c.title as course_title,
        qs.submitted_at as timestamp,
        (qs.coach_read_at IS NOT NULL) as is_read,
        c.id as course_id,
        qs.id as extra_id
    FROM quiz_submissions qs
    JOIN profiles p ON p.id = qs.user_id
    JOIN quizzes q ON q.id = qs.quiz_id
    JOIN module_content_items mci ON (mci.content_id = q.id AND mci.content_type = 'quiz')
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE c.coach_id = p_coach_id
    AND qs.coach_cleared_at IS NULL

    UNION ALL

    -- Support for quizzes inside lessons
    SELECT 
        qs.id as notif_id,
        'quiz_review'::TEXT as notif_type,
        qs.status,
        TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''))::TEXT as student_name,
        q.title as content_title,
        c.title as course_title,
        qs.submitted_at as timestamp,
        (qs.coach_read_at IS NOT NULL) as is_read,
        c.id as course_id,
        qs.id as extra_id
    FROM quiz_submissions qs
    JOIN profiles p ON p.id = qs.user_id
    JOIN quizzes q ON q.id = qs.quiz_id
    JOIN lesson_content_items lci ON (lci.content_id = q.id AND lci.content_type = 'quiz')
    JOIN courses c ON c.id = lci.course_id
    WHERE c.coach_id = p_coach_id
    AND qs.coach_cleared_at IS NULL

    UNION ALL

    -- B. Enrollment Notifications
    SELECT 
        e.id as notif_id,
        'enrollment'::TEXT as notif_type,
        'enrolled'::TEXT as status,
        TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''))::TEXT as student_name,
        c.title as content_title,
        c.title as course_title,
        e.enrolled_at as timestamp,
        (e.coach_read_at IS NOT NULL) as is_read,
        c.id as course_id,
        e.id as extra_id
    FROM enrollments e
    JOIN profiles p ON p.id = e.profile_id
    JOIN courses c ON c.id = e.course_id
    WHERE c.coach_id = p_coach_id
    AND e.coach_cleared_at IS NULL

    ORDER BY timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Mark All as Read (Updated to include enrollments)
CREATE OR REPLACE FUNCTION mark_all_coach_notifications_read(p_coach_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Mark Quizzes
    UPDATE quiz_submissions qs
    SET coach_read_at = NOW()
    WHERE qs.coach_read_at IS NULL
    AND EXISTS (
        SELECT 1 FROM courses c
        JOIN modules m ON m.course_id = c.id
        JOIN module_content_items mci ON mci.module_id = m.id
        WHERE c.coach_id = p_coach_id AND mci.content_id = qs.quiz_id
    );

    -- Mark Enrollments
    UPDATE enrollments e
    SET coach_read_at = NOW()
    FROM courses c
    WHERE e.course_id = c.id
    AND c.coach_id = p_coach_id
    AND e.coach_read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION get_coach_all_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_coach_notifications_read(UUID) TO authenticated;
