-- Migration: Create Student Notification RPC Functions
-- Created: 2026-04-23

-- 1. Function to fetch notifications for a student
CREATE OR REPLACE FUNCTION get_student_quiz_notifications(p_student_id UUID)
RETURNS TABLE (
    submission_id UUID,
    status TEXT,
    quiz_title TEXT,
    course_title TEXT,
    reviewed_at TIMESTAMPTZ,
    is_read BOOLEAN,
    course_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qs.id as submission_id,
        qs.status,
        q.title as quiz_title,
        c.title as course_title,
        qs.reviewed_at,
        (qs.student_read_at IS NOT NULL) as is_read,
        c.id as course_id
    FROM quiz_submissions qs
    JOIN quizzes q ON q.id = qs.quiz_id
    JOIN module_content_items mci ON (mci.content_id = q.id AND mci.content_type = 'quiz')
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE qs.user_id = p_student_id
    AND qs.status IN ('passed', 'failed', 'resubmission_required')
    AND qs.reviewed_at IS NOT NULL
    AND qs.student_cleared_at IS NULL
    
    UNION
    
    -- Support for quizzes inside lessons
    SELECT 
        qs.id as submission_id,
        qs.status,
        q.title as quiz_title,
        c.title as course_title,
        qs.reviewed_at,
        (qs.student_read_at IS NOT NULL) as is_read,
        c.id as course_id
    FROM quiz_submissions qs
    JOIN quizzes q ON q.id = qs.quiz_id
    JOIN lesson_content_items lci ON (lci.content_id = q.id AND lci.content_type = 'quiz')
    JOIN courses c ON c.id = lci.course_id
    WHERE qs.user_id = p_student_id
    AND qs.status IN ('passed', 'failed', 'resubmission_required')
    AND qs.reviewed_at IS NOT NULL
    AND qs.student_cleared_at IS NULL
    
    ORDER BY reviewed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to mark all student notifications as read
CREATE OR REPLACE FUNCTION mark_all_student_quiz_notifications_read(p_student_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE quiz_submissions
    SET student_read_at = NOW()
    WHERE user_id = p_student_id
    AND reviewed_at IS NOT NULL
    AND student_read_at IS NULL
    AND student_cleared_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION get_student_quiz_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_student_quiz_notifications_read(UUID) TO authenticated;
