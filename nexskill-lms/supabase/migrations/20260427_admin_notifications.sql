-- Migration: Admin Notifications for Course Approvals and Updates
-- Created: 2026-04-27

-- 1. Create table for persistent admin notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notif_type TEXT NOT NULL, -- 'new_course' or 'course_update'
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    admin_read_at TIMESTAMPTZ,
    admin_cleared_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage all admin notifications" ON public.admin_notifications;
CREATE POLICY "Admins can manage all admin notifications"
    ON public.admin_notifications FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2. Trigger function to create notifications
CREATE OR REPLACE FUNCTION public.handle_admin_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_coach_id UUID;
BEGIN
    -- For NEW courses (pending_review)
    IF TG_TABLE_NAME = 'courses' THEN
        IF (TG_OP = 'INSERT' AND NEW.verification_status = 'pending_review') OR
           (TG_OP = 'UPDATE' AND OLD.verification_status != 'pending_review' AND NEW.verification_status = 'pending_review') THEN
            
            INSERT INTO public.admin_notifications (notif_type, course_id, coach_id)
            VALUES ('new_course', NEW.id, NEW.coach_id);
            
        -- For COURSE UPDATES (pending_content flag set on approved course)
        ELSIF (TG_OP = 'UPDATE' AND OLD.pending_content = false AND NEW.pending_content = true AND NEW.verification_status = 'approved') THEN
            
            INSERT INTO public.admin_notifications (notif_type, course_id, coach_id)
            VALUES ('course_update', NEW.id, NEW.coach_id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to courses table
DROP TRIGGER IF EXISTS trg_admin_notifications ON public.courses;
CREATE TRIGGER trg_admin_notifications
AFTER INSERT OR UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.handle_admin_notification_trigger();

-- 4. Unified function to get admin notifications
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
        TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''))::TEXT as coach_name,
        an.created_at,
        (an.admin_read_at IS NOT NULL) as is_read
    FROM public.admin_notifications an
    JOIN public.courses c ON c.id = an.course_id
    JOIN public.profiles p ON p.id = an.coach_id
    WHERE an.admin_cleared_at IS NULL
    ORDER BY an.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Management functions
CREATE OR REPLACE FUNCTION public.mark_admin_notification_read(p_notif_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.admin_notifications SET admin_read_at = NOW() WHERE id = p_notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.clear_admin_notification(p_notif_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.admin_notifications SET admin_cleared_at = NOW() WHERE id = p_notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_all_admin_notifications_read()
RETURNS VOID AS $$
BEGIN
    UPDATE public.admin_notifications SET admin_read_at = NOW() WHERE admin_read_at IS NULL AND admin_cleared_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.clear_all_admin_notifications()
RETURNS VOID AS $$
BEGIN
    UPDATE public.admin_notifications SET admin_cleared_at = NOW() WHERE admin_cleared_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT ALL ON public.admin_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_admin_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_admin_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_admin_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_all_admin_notifications() TO authenticated;
