-- Migration: Add New User and Coach Review Notifications
-- Phase 1 of Implementation Plan

-- 1. Extend admin_notifications table to handle generic users
-- We keep coach_id for course-related notifications and add user_id for registration alerts
ALTER TABLE public.admin_notifications 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Update the notification retrieval function
-- We use LEFT JOINs to ensure notifications show up even if they don't have a course linked
-- We maintain the signature for backward compatibility but improve name resolution
CREATE OR REPLACE FUNCTION public.get_admin_notifications()
RETURNS TABLE (
    notif_id UUID,
    notif_type TEXT,
    course_id UUID,
    course_title TEXT,
    coach_id UUID,
    coach_name TEXT,
    created_at TIMESTAMPTZ,
    is_read BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        an.id as notif_id,
        an.notif_type,
        an.course_id,
        c.title as course_title,
        an.coach_id,
        TRIM(COALESCE(
            NULLIF(COALESCE(p_coach.first_name, '') || ' ' || COALESCE(p_coach.last_name, ''), ' '),
            NULLIF(COALESCE(p_user.first_name, '') || ' ' || COALESCE(p_user.last_name, ''), ' '),
            'System User'
        ))::TEXT as coach_name,
        an.created_at,
        (an.admin_read_at IS NOT NULL) as is_read
    FROM public.admin_notifications an
    LEFT JOIN public.courses c ON c.id = an.course_id
    LEFT JOIN public.profiles p_coach ON p_coach.id = an.coach_id
    LEFT JOIN public.profiles p_user ON p_user.id = an.user_id
    WHERE an.admin_cleared_at IS NULL
    ORDER BY an.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for New User Registrations
-- Detects when a new student or unassigned user joins the platform
CREATE OR REPLACE FUNCTION public.handle_new_user_admin_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify for students or unassigned users (coaches are handled when they apply)
    IF NEW.role IN ('student', 'unassigned') THEN
        INSERT INTO public.admin_notifications (notif_type, user_id)
        VALUES ('new_user', NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_user_admin_notification ON public.profiles;
CREATE TRIGGER trg_new_user_admin_notification
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin_notification();

-- 4. Trigger for New Coach Applications
-- Detects when a coach profile is created or updated to 'pending' status
CREATE OR REPLACE FUNCTION public.handle_new_coach_admin_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.verification_status = 'pending') OR
       (TG_OP = 'UPDATE' AND OLD.verification_status != 'pending' AND NEW.verification_status = 'pending') THEN
        
        INSERT INTO public.admin_notifications (notif_type, coach_id)
        VALUES ('new_coach_review', NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_coach_admin_notification ON public.coach_profiles;
CREATE TRIGGER trg_new_coach_admin_notification
AFTER INSERT OR UPDATE ON public.coach_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_coach_admin_notification();
