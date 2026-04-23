-- Migration: Create get_coach_quiz_notifications RPC function
-- Created: 2026-04-23

CREATE OR REPLACE FUNCTION get_coach_quiz_notifications(p_coach_id UUID)
RETURNS TABLE (
    submission_id UUID,
    status TEXT,
    student_name TEXT,
    quiz_title TEXT,
    course_title TEXT,
    submitted_at TIMESTAMPTZ,
    is_read BOOLEAN,
    course_id UUID
) AS $$
BEGIN
    RETURN QUERY
    WITH coach_courses AS (
        SELECT c.id, c.title
        FROM courses c
        WHERE c.coach_id = p_coach_id
    ),
    all_quizzes AS (
        -- Quizzes directly in modules
        SELECT 
            mci.content_id as quiz_id,
            cc.id as course_id,
            cc.title as course_title
        FROM module_content_items mci
        JOIN modules m ON m.id = mci.module_id
        JOIN coach_courses cc ON cc.id = m.course_id
        WHERE mci.content_type = 'quiz'
        
        UNION
        
        -- Quizzes inside lessons
        SELECT 
            lci.content_id as quiz_id,
            cc.id as course_id,
            cc.title as course_title
        FROM lesson_content_items lci
        JOIN coach_courses cc ON cc.id = lci.course_id
        WHERE lci.content_type = 'quiz'
    )
    SELECT 
        qs.id as submission_id,
        qs.status,
        TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''))::TEXT as student_name,
        q.title as quiz_title,
        aq.course_title,
        qs.submitted_at,
        (qs.coach_read_at IS NOT NULL) as is_read,
        aq.course_id
    FROM quiz_submissions qs
    JOIN profiles p ON p.id = qs.user_id
    JOIN quizzes q ON q.id = qs.quiz_id
    JOIN all_quizzes aq ON aq.quiz_id = q.id
    WHERE qs.coach_cleared_at IS NULL
    ORDER BY qs.submitted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_coach_quiz_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_coach_quiz_notifications(UUID) TO service_role;
