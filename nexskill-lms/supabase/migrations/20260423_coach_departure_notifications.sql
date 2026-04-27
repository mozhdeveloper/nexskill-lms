-- Migration: Add Student Departure Notifications for Coaches
-- Created: 2026-04-23

-- 1. Create a table to track when students leave courses
CREATE TABLE IF NOT EXISTS public.course_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    left_at TIMESTAMPTZ DEFAULT NOW(),
    coach_read_at TIMESTAMPTZ,
    coach_cleared_at TIMESTAMPTZ
);

-- 2. Create a trigger function to log the departure when an enrollment is deleted
CREATE OR REPLACE FUNCTION log_student_course_departure()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.course_leaves (profile_id, course_id)
    VALUES (OLD.profile_id, OLD.course_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the trigger to the enrollments table
DROP TRIGGER IF EXISTS trg_log_course_departure ON public.enrollments;
CREATE TRIGGER trg_log_course_departure
BEFORE DELETE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION log_student_course_departure();

-- 4. UPDATE THE UNIFIED NOTIFICATION FUNCTION (Include Course Leaves)
DROP FUNCTION IF EXISTS public.get_coach_all_notifications(uuid);

CREATE OR REPLACE FUNCTION public.get_coach_all_notifications(p_coach_id UUID)
RETURNS TABLE (
    notif_id UUID,
    notif_type TEXT,
    status TEXT,
    student_name TEXT,
    content_title TEXT,
    course_title TEXT,
    created_at TIMESTAMPTZ,
    is_read BOOLEAN,
    course_id UUID,
    extra_id UUID
) AS $$
BEGIN
    RETURN QUERY
    -- A. Quiz Notifications
    SELECT 
        qs.id as notif_id,
        'quiz_review'::TEXT as notif_type,
        qs.status::TEXT as status,
        TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''))::TEXT as student_name,
        q.title::TEXT as content_title,
        c.title::TEXT as course_title,
        qs.submitted_at as created_at,
        (qs.coach_read_at IS NOT NULL) as is_read,
        c.id as course_id,
        qs.id as extra_id
    FROM quiz_submissions qs
    JOIN profiles p ON p.id = qs.user_id
    JOIN quizzes q ON q.id = qs.quiz_id
    JOIN module_content_items mci ON (mci.content_id = q.id AND mci.content_type = 'quiz')
    JOIN modules m ON m.id = mci.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE c.coach_id = p_coach_id AND qs.coach_cleared_at IS NULL

    UNION ALL

    -- Support for quizzes inside lessons
    SELECT 
        qs.id as notif_id,
        'quiz_review'::TEXT as notif_type,
        qs.status::TEXT as status,
        TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''))::TEXT as student_name,
        q.title::TEXT as content_title,
        c.title::TEXT as course_title,
        qs.submitted_at as created_at,
        (qs.coach_read_at IS NOT NULL) as is_read,
        c.id as course_id,
        qs.id as extra_id
    FROM quiz_submissions qs
    JOIN profiles p ON p.id = qs.user_id
    JOIN quizzes q ON q.id = qs.quiz_id
    JOIN lesson_content_items lci ON (lci.content_id = q.id AND lci.content_type = 'quiz')
    JOIN courses c ON c.id = lci.course_id
    WHERE c.coach_id = p_coach_id AND qs.coach_cleared_at IS NULL

    UNION ALL

    -- B. Enrollment Notifications
    SELECT 
        e.id as notif_id,
        'enrollment'::TEXT as notif_type,
        'enrolled'::TEXT as status,
        TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''))::TEXT as student_name,
        c.title::TEXT as content_title,
        c.title::TEXT as course_title,
        e.enrolled_at as created_at,
        (e.coach_read_at IS NOT NULL) as is_read,
        c.id as course_id,
        e.id as extra_id
    FROM enrollments e
    JOIN profiles p ON p.id = e.profile_id
    JOIN courses c ON c.id = e.course_id
    WHERE c.coach_id = p_coach_id AND e.coach_cleared_at IS NULL

    UNION ALL

    -- C. Student Departure Notifications (NEW)
    SELECT 
        cl.id as notif_id,
        'student_left'::TEXT as notif_type,
        'left'::TEXT as status,
        TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''))::TEXT as student_name,
        c.title::TEXT as content_title,
        c.title::TEXT as course_title,
        cl.left_at as created_at,
        (cl.coach_read_at IS NOT NULL) as is_read,
        c.id as course_id,
        cl.id as extra_id
    FROM course_leaves cl
    JOIN profiles p ON p.id = cl.profile_id
    JOIN courses c ON c.id = cl.course_id
    WHERE c.coach_id = p_coach_id AND cl.coach_cleared_at IS NULL

    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. UPDATE MARK ALL AS READ
CREATE OR REPLACE FUNCTION public.mark_all_coach_notifications_read(p_coach_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Quizzes
    UPDATE quiz_submissions qs SET coach_read_at = NOW()
    WHERE qs.coach_read_at IS NULL AND qs.coach_cleared_at IS NULL AND EXISTS (
        SELECT 1 FROM courses c JOIN modules m ON m.course_id = c.id
        JOIN module_content_items mci ON mci.module_id = m.id
        WHERE c.coach_id = p_coach_id AND mci.content_id = qs.quiz_id
    );
    -- Enrollments
    UPDATE enrollments e SET coach_read_at = NOW() FROM courses c
    WHERE e.course_id = c.id AND c.coach_id = p_coach_id AND e.coach_read_at IS NULL AND e.coach_cleared_at IS NULL;
    -- Leaves (NEW)
    UPDATE course_leaves cl SET coach_read_at = NOW() FROM courses c
    WHERE cl.course_id = c.id AND c.coach_id = p_coach_id AND cl.coach_read_at IS NULL AND cl.coach_cleared_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_coach_all_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_coach_notifications_read(UUID) TO authenticated;
