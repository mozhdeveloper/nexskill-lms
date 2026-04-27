-- Migration: Fix Coach Notification Persistence and Robustness
-- Created: 2026-04-27

-- 1. Function to mark a specific notification as read
CREATE OR REPLACE FUNCTION public.mark_specific_coach_notification_read(p_notif_id UUID, p_notif_type TEXT)
RETURNS VOID AS $$
BEGIN
    IF p_notif_type = 'quiz_review' THEN
        UPDATE public.quiz_submissions SET coach_read_at = NOW() WHERE id = p_notif_id;
    ELSIF p_notif_type = 'enrollment' THEN
        UPDATE public.enrollments SET coach_read_at = NOW() WHERE id = p_notif_id;
    ELSIF p_notif_type = 'student_left' THEN
        UPDATE public.course_leaves SET coach_read_at = NOW() WHERE id = p_notif_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to clear a specific notification (hide it)
CREATE OR REPLACE FUNCTION public.clear_specific_coach_notification(p_notif_id UUID, p_notif_type TEXT)
RETURNS VOID AS $$
BEGIN
    IF p_notif_type = 'quiz_review' THEN
        UPDATE public.quiz_submissions SET coach_cleared_at = NOW() WHERE id = p_notif_id;
    ELSIF p_notif_type = 'enrollment' THEN
        UPDATE public.enrollments SET coach_cleared_at = NOW() WHERE id = p_notif_id;
    ELSIF p_notif_type = 'student_left' THEN
        UPDATE public.course_leaves SET coach_cleared_at = NOW() WHERE id = p_notif_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Mark All As Read to be more robust (include quizzes in lessons)
CREATE OR REPLACE FUNCTION public.mark_all_coach_notifications_read(p_coach_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Quizzes in Modules
    UPDATE public.quiz_submissions qs SET coach_read_at = NOW()
    WHERE qs.coach_read_at IS NULL AND qs.coach_cleared_at IS NULL AND EXISTS (
        SELECT 1 FROM public.courses c 
        JOIN public.modules m ON m.course_id = c.id
        JOIN public.module_content_items mci ON mci.module_id = m.id
        WHERE c.coach_id = p_coach_id AND mci.content_id = qs.quiz_id AND mci.content_type = 'quiz'
    );

    -- Quizzes in Lessons
    UPDATE public.quiz_submissions qs SET coach_read_at = NOW()
    WHERE qs.coach_read_at IS NULL AND qs.coach_cleared_at IS NULL AND EXISTS (
        SELECT 1 FROM public.courses c
        JOIN public.lesson_content_items lci ON lci.course_id = c.id
        WHERE c.coach_id = p_coach_id AND lci.content_id = qs.quiz_id AND lci.content_type = 'quiz'
    );

    -- Enrollments
    UPDATE public.enrollments e SET coach_read_at = NOW() 
    FROM public.courses c
    WHERE e.course_id = c.id AND c.coach_id = p_coach_id AND e.coach_read_at IS NULL AND e.coach_cleared_at IS NULL;
    
    -- Leaves
    UPDATE public.course_leaves cl SET coach_read_at = NOW() 
    FROM public.courses c
    WHERE cl.course_id = c.id AND c.coach_id = p_coach_id AND cl.coach_read_at IS NULL AND cl.coach_cleared_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to clear all notifications for a coach
CREATE OR REPLACE FUNCTION public.clear_all_coach_notifications(p_coach_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Quizzes in Modules
    UPDATE public.quiz_submissions qs SET coach_cleared_at = NOW()
    WHERE qs.coach_cleared_at IS NULL AND EXISTS (
        SELECT 1 FROM public.courses c 
        JOIN public.modules m ON m.course_id = c.id
        JOIN public.module_content_items mci ON mci.module_id = m.id
        WHERE c.coach_id = p_coach_id AND mci.content_id = qs.quiz_id AND mci.content_type = 'quiz'
    );
    
    -- Quizzes in Lessons
    UPDATE public.quiz_submissions qs SET coach_cleared_at = NOW()
    WHERE qs.coach_cleared_at IS NULL AND EXISTS (
        SELECT 1 FROM public.courses c
        JOIN public.lesson_content_items lci ON lci.course_id = c.id
        WHERE c.coach_id = p_coach_id AND lci.content_id = qs.quiz_id AND lci.content_type = 'quiz'
    );

    -- Enrollments
    UPDATE public.enrollments e SET coach_cleared_at = NOW() 
    FROM public.courses c
    WHERE e.course_id = c.id AND c.coach_id = p_coach_id AND e.coach_cleared_at IS NULL;
    
    -- Leaves
    UPDATE public.course_leaves cl SET coach_cleared_at = NOW() 
    FROM public.courses c
    WHERE cl.course_id = c.id AND c.coach_id = p_coach_id AND cl.coach_cleared_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION public.mark_specific_coach_notification_read(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_specific_coach_notification(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_coach_notifications_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_all_coach_notifications(UUID) TO authenticated;
