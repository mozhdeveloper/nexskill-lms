-- Migration: Coach Notifications for Course and Update Approvals
-- Created: 2026-04-27

-- 1. Create table for system-generated coach notifications
CREATE TABLE IF NOT EXISTS public.coach_system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    notif_type TEXT NOT NULL, -- 'course_approved' or 'update_approved'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    coach_read_at TIMESTAMPTZ,
    coach_cleared_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.coach_system_notifications ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own system notifications
CREATE POLICY "Coaches can manage own system notifications"
    ON public.coach_system_notifications FOR ALL
    USING (coach_id = auth.uid());

-- 2. Trigger function to create notifications for coaches
CREATE OR REPLACE FUNCTION public.handle_coach_approval_notification_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- For INITIAL COURSE APPROVAL
    IF (OLD.verification_status != 'approved' AND NEW.verification_status = 'approved') THEN
        INSERT INTO public.coach_system_notifications (coach_id, course_id, notif_type)
        VALUES (NEW.coach_id, NEW.id, 'course_approved');
        
    -- For PENDING CHANGES APPROVAL
    ELSIF (OLD.pending_content = true AND NEW.pending_content = false AND NEW.verification_status = 'approved') THEN
        INSERT INTO public.coach_system_notifications (coach_id, course_id, notif_type)
        VALUES (NEW.coach_id, NEW.id, 'update_approved');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to courses table
DROP TRIGGER IF EXISTS trg_coach_approval_notifications ON public.courses;
CREATE TRIGGER trg_coach_approval_notifications
AFTER UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.handle_coach_approval_notification_trigger();

-- 4. UPDATE UNIFIED NOTIFICATION FUNCTION
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
    FROM public.quiz_submissions qs
    JOIN public.profiles p ON p.id = qs.user_id
    JOIN public.quizzes q ON q.id = qs.quiz_id
    JOIN public.module_content_items mci ON (mci.content_id = q.id AND mci.content_type = 'quiz')
    JOIN public.modules m ON m.id = mci.module_id
    JOIN public.courses c ON c.id = m.course_id
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
    FROM public.quiz_submissions qs
    JOIN public.profiles p ON p.id = qs.user_id
    JOIN public.quizzes q ON q.id = qs.quiz_id
    JOIN public.lesson_content_items lci ON (lci.content_id = q.id AND lci.content_type = 'quiz')
    JOIN public.courses c ON c.id = lci.course_id
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
    FROM public.enrollments e
    JOIN public.profiles p ON p.id = e.profile_id
    JOIN public.courses c ON c.id = e.course_id
    WHERE c.coach_id = p_coach_id AND e.coach_cleared_at IS NULL

    UNION ALL

    -- C. Student Departure Notifications
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
    FROM public.course_leaves cl
    JOIN public.profiles p ON p.id = cl.profile_id
    JOIN public.courses c ON c.id = cl.course_id
    WHERE c.coach_id = p_coach_id AND cl.coach_cleared_at IS NULL

    UNION ALL

    -- D. NEW: System Approvals (Course/Update Approved)
    SELECT
        csn.id as notif_id,
        csn.notif_type::TEXT as notif_type,
        'approved'::TEXT as status,
        'System'::TEXT as student_name,
        c.title::TEXT as content_title,
        c.title::TEXT as course_title,
        csn.created_at,
        (csn.coach_read_at IS NOT NULL) as is_read,
        c.id as course_id,
        csn.id as extra_id
    FROM public.coach_system_notifications csn
    JOIN public.courses c ON c.id = csn.course_id
    WHERE csn.coach_id = p_coach_id AND csn.coach_cleared_at IS NULL

    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. UPDATE MANAGEMENT FUNCTIONS
CREATE OR REPLACE FUNCTION public.mark_specific_coach_notification_read(p_notif_id UUID, p_notif_type TEXT)
RETURNS VOID AS $$
BEGIN
    IF p_notif_type = 'quiz_review' THEN
        UPDATE public.quiz_submissions SET coach_read_at = NOW() WHERE id = p_notif_id;
    ELSIF p_notif_type = 'enrollment' THEN
        UPDATE public.enrollments SET coach_read_at = NOW() WHERE id = p_notif_id;
    ELSIF p_notif_type = 'student_left' THEN
        UPDATE public.course_leaves SET coach_read_at = NOW() WHERE id = p_notif_id;
    ELSIF p_notif_type IN ('course_approved', 'update_approved') THEN
        UPDATE public.coach_system_notifications SET coach_read_at = NOW() WHERE id = p_notif_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.clear_specific_coach_notification(p_notif_id UUID, p_notif_type TEXT)
RETURNS VOID AS $$
BEGIN
    IF p_notif_type = 'quiz_review' THEN
        UPDATE public.quiz_submissions SET coach_cleared_at = NOW() WHERE id = p_notif_id;
    ELSIF p_notif_type = 'enrollment' THEN
        UPDATE public.enrollments SET coach_cleared_at = NOW() WHERE id = p_notif_id;
    ELSIF p_notif_type = 'student_left' THEN
        UPDATE public.course_leaves SET coach_cleared_at = NOW() WHERE id = p_notif_id;
    ELSIF p_notif_type IN ('course_approved', 'update_approved') THEN
        UPDATE public.coach_system_notifications SET coach_cleared_at = NOW() WHERE id = p_notif_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_all_coach_notifications_read(p_coach_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Quizzes
    UPDATE public.quiz_submissions qs SET coach_read_at = NOW()
    WHERE qs.coach_read_at IS NULL AND qs.coach_cleared_at IS NULL AND EXISTS (
        SELECT 1 FROM public.courses c 
        JOIN public.modules m ON m.course_id = c.id
        JOIN public.module_content_items mci ON mci.module_id = m.id
        WHERE c.coach_id = p_coach_id AND mci.content_id = qs.quiz_id AND mci.content_type = 'quiz'
    );
    UPDATE public.quiz_submissions qs SET coach_read_at = NOW()
    WHERE qs.coach_read_at IS NULL AND qs.coach_cleared_at IS NULL AND EXISTS (
        SELECT 1 FROM public.courses c
        JOIN public.lesson_content_items lci ON lci.course_id = c.id
        WHERE c.coach_id = p_coach_id AND lci.content_id = qs.quiz_id AND lci.content_type = 'quiz'
    );

    -- Enrollments
    UPDATE public.enrollments e SET coach_read_at = NOW() FROM public.courses c
    WHERE e.course_id = c.id AND c.coach_id = p_coach_id AND e.coach_read_at IS NULL AND e.coach_cleared_at IS NULL;
    
    -- Leaves
    UPDATE public.course_leaves cl SET coach_read_at = NOW() FROM public.courses c
    WHERE cl.course_id = c.id AND c.coach_id = p_coach_id AND cl.coach_read_at IS NULL AND cl.coach_cleared_at IS NULL;
    
    -- System (NEW)
    UPDATE public.coach_system_notifications SET coach_read_at = NOW()
    WHERE coach_id = p_coach_id AND coach_read_at IS NULL AND coach_cleared_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.clear_all_coach_notifications(p_coach_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Quizzes
    UPDATE public.quiz_submissions qs SET coach_cleared_at = NOW()
    WHERE qs.coach_cleared_at IS NULL AND EXISTS (
        SELECT 1 FROM public.courses c 
        JOIN public.modules m ON m.course_id = c.id
        JOIN public.module_content_items mci ON mci.module_id = m.id
        WHERE c.coach_id = p_coach_id AND mci.content_id = qs.quiz_id AND mci.content_type = 'quiz'
    );
    UPDATE public.quiz_submissions qs SET coach_cleared_at = NOW()
    WHERE qs.coach_cleared_at IS NULL AND EXISTS (
        SELECT 1 FROM public.courses c
        JOIN public.lesson_content_items lci ON lci.course_id = c.id
        WHERE c.coach_id = p_coach_id AND lci.content_id = qs.quiz_id AND lci.content_type = 'quiz'
    );

    -- Enrollments
    UPDATE public.enrollments e SET coach_cleared_at = NOW() FROM public.courses c
    WHERE e.course_id = c.id AND c.coach_id = p_coach_id AND e.coach_cleared_at IS NULL;
    
    -- Leaves
    UPDATE public.course_leaves cl SET coach_cleared_at = NOW() FROM public.courses c
    WHERE cl.course_id = c.id AND c.coach_id = p_coach_id AND cl.coach_cleared_at IS NULL;
    
    -- System (NEW)
    UPDATE public.coach_system_notifications SET coach_cleared_at = NOW()
    WHERE coach_id = p_coach_id AND coach_cleared_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT ALL ON public.coach_system_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_coach_all_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_specific_coach_notification_read(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_specific_coach_notification(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_coach_notifications_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_all_coach_notifications(UUID) TO authenticated;
