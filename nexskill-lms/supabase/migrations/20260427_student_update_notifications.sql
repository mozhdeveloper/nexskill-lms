-- Migration: Student Notifications for Course Content Updates
-- Created: 2026-04-27

-- 1. Create table for system-generated student notifications
CREATE TABLE IF NOT EXISTS public.student_system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    notif_type TEXT NOT NULL, -- 'new_lesson', 'course_update'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    student_read_at TIMESTAMPTZ,
    student_cleared_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.student_system_notifications ENABLE ROW LEVEL SECURITY;

-- Students can manage their own system notifications
CREATE POLICY "Students can manage own system notifications"
    ON public.student_system_notifications FOR ALL
    USING (student_id = auth.uid());

-- 2. Trigger function to notify students on course update approval
CREATE OR REPLACE FUNCTION public.handle_student_course_update_notification_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- When admin approves pending changes (pending_content true -> false)
    IF (OLD.pending_content = true AND NEW.pending_content = false AND NEW.verification_status = 'approved') THEN
        -- Insert a notification for every student enrolled in this course
        INSERT INTO public.student_system_notifications (student_id, course_id, notif_type)
        SELECT profile_id, NEW.id, 'new_content'
        FROM public.enrollments
        WHERE course_id = NEW.id AND status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to courses table
DROP TRIGGER IF EXISTS trg_student_course_update_notifications ON public.courses;
CREATE TRIGGER trg_student_course_update_notifications
AFTER UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.handle_student_course_update_notification_trigger();

-- 4. Unified function to get ALL student notifications (Quiz Results + System)
CREATE OR REPLACE FUNCTION public.get_student_all_notifications(p_student_id UUID)
RETURNS TABLE (
    notif_id UUID,
    notif_type TEXT,
    status TEXT,
    quiz_title TEXT, -- Or content title
    course_title TEXT,
    created_at TIMESTAMPTZ,
    is_read BOOLEAN,
    course_id UUID,
    extra_id UUID -- quiz_id or notification_id
) AS $$
BEGIN
    RETURN QUERY
    -- A. Quiz Results
    SELECT 
        qs.id as notif_id,
        'quiz_result'::TEXT as notif_type,
        qs.status::TEXT as status,
        q.title::TEXT as quiz_title,
        c.title::TEXT as course_title,
        qs.reviewed_at as created_at,
        (qs.student_read_at IS NOT NULL) as is_read,
        c.id as course_id,
        q.id as extra_id
    FROM public.quiz_submissions qs
    JOIN public.quizzes q ON q.id = qs.quiz_id
    JOIN public.module_content_items mci ON (mci.content_id = q.id AND mci.content_type = 'quiz')
    JOIN public.modules m ON m.id = mci.module_id
    JOIN public.courses c ON c.id = m.course_id
    WHERE qs.user_id = p_student_id
    AND qs.status IN ('passed', 'failed', 'resubmission_required')
    AND qs.reviewed_at IS NOT NULL
    AND qs.student_cleared_at IS NULL
    
    UNION ALL
    
    -- Quiz inside lessons
    SELECT 
        qs.id as notif_id,
        'quiz_result'::TEXT as notif_type,
        qs.status::TEXT as status,
        q.title::TEXT as quiz_title,
        c.title::TEXT as course_title,
        qs.reviewed_at as created_at,
        (qs.student_read_at IS NOT NULL) as is_read,
        c.id as course_id,
        q.id as extra_id
    FROM public.quiz_submissions qs
    JOIN public.quizzes q ON q.id = qs.quiz_id
    JOIN public.lesson_content_items lci ON (lci.content_id = q.id AND lci.content_type = 'quiz')
    JOIN public.courses c ON c.id = lci.course_id
    WHERE qs.user_id = p_student_id
    AND qs.status IN ('passed', 'failed', 'resubmission_required')
    AND qs.reviewed_at IS NOT NULL
    AND qs.student_cleared_at IS NULL

    UNION ALL

    -- B. System Notifications (New Content)
    SELECT
        ssn.id as notif_id,
        'system'::TEXT as notif_type,
        ssn.notif_type::TEXT as status, -- 'new_content'
        'New Lesson Available'::TEXT as quiz_title,
        c.title::TEXT as course_title,
        ssn.created_at,
        (ssn.student_read_at IS NOT NULL) as is_read,
        c.id as course_id,
        ssn.id as extra_id
    FROM public.student_system_notifications ssn
    JOIN public.courses c ON c.id = ssn.course_id
    WHERE ssn.student_id = p_student_id
    AND ssn.student_cleared_at IS NULL
    
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. MANAGEMENT FUNCTIONS
CREATE OR REPLACE FUNCTION public.mark_specific_student_notification_read(p_notif_id UUID, p_notif_type TEXT)
RETURNS VOID AS $$
BEGIN
    IF p_notif_type = 'quiz_result' THEN
        UPDATE public.quiz_submissions SET student_read_at = NOW() WHERE id = p_notif_id;
    ELSIF p_notif_type = 'system' THEN
        UPDATE public.student_system_notifications SET student_read_at = NOW() WHERE id = p_notif_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.clear_specific_student_notification(p_notif_id UUID, p_notif_type TEXT)
RETURNS VOID AS $$
BEGIN
    IF p_notif_type = 'quiz_result' THEN
        UPDATE public.quiz_submissions SET student_cleared_at = NOW() WHERE id = p_notif_id;
    ELSIF p_notif_type = 'system' THEN
        UPDATE public.student_system_notifications SET student_cleared_at = NOW() WHERE id = p_notif_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_all_student_notifications_read(p_student_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Quiz Submissions
    UPDATE public.quiz_submissions
    SET student_read_at = NOW()
    WHERE user_id = p_student_id
    AND reviewed_at IS NOT NULL
    AND student_read_at IS NULL
    AND student_cleared_at IS NULL;

    -- System Notifications
    UPDATE public.student_system_notifications
    SET student_read_at = NOW()
    WHERE student_id = p_student_id
    AND student_read_at IS NULL
    AND student_cleared_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.clear_all_student_notifications(p_student_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Quiz Submissions
    UPDATE public.quiz_submissions
    SET student_cleared_at = NOW()
    WHERE user_id = p_student_id
    AND student_cleared_at IS NULL;

    -- System Notifications
    UPDATE public.student_system_notifications
    SET student_cleared_at = NOW()
    WHERE student_id = p_student_id
    AND student_cleared_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT ALL ON public.student_system_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_all_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_specific_student_notification_read(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_specific_student_notification(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_student_notifications_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_all_student_notifications(UUID) TO authenticated;
