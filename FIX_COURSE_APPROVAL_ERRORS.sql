-- =====================================================
-- FIX: Course Approval "status" and "course_id" Errors
-- =====================================================
-- This script fixes the "column status does not exist" error during course approval
-- and corrects triggers that try to use non-existent columns.

BEGIN;

-- 1. Fix the Enrollments table
-- Add the missing status column that the notification trigger expects
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped'));

-- 2. Fix handle_student_course_update_notification_trigger
-- Make it more robust and ensure it uses the correct columns
CREATE OR REPLACE FUNCTION public.handle_student_course_update_notification_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- When admin approves pending changes (pending_content true -> false)
    IF (OLD.pending_content = true AND NEW.pending_content = false) 
       AND NEW.verification_status = 'approved' THEN
        
        -- Insert a notification for every student enrolled in this course
        INSERT INTO public.student_system_notifications (student_id, course_id, notif_type)
        SELECT profile_id, NEW.id, 'new_content'
        FROM public.enrollments
        WHERE course_id = NEW.id 
          AND (status = 'active' OR status IS NULL); -- Handle nulls gracefully
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix cascade_publish_on_approval
-- Lessons and Quizzes DO NOT have course_id. We must join through modules.
CREATE OR REPLACE FUNCTION public.cascade_publish_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'approved'
     AND (OLD.verification_status IS DISTINCT FROM 'approved') THEN

    -- Set session variable to prevent trigger loops
    PERFORM set_config('app.is_publish_action', 'true', false);

    -- 1. Modules (has course_id)
    UPDATE public.modules SET content_status = 'published' WHERE course_id = NEW.id AND content_status = 'draft';
    
    -- 2. Lessons (no course_id, must join)
    UPDATE public.lessons SET content_status = 'published' 
    WHERE id IN (
        SELECT lci.content_id 
        FROM public.lesson_content_items lci
        WHERE lci.course_id = NEW.id AND lci.content_type = 'lesson'
    ) AND content_status = 'draft';

    -- 3. Module Content Items
    UPDATE public.module_content_items mci SET content_status = 'published'
    WHERE mci.content_status = 'draft' AND EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = mci.module_id AND m.course_id = NEW.id
    );

    -- 4. Lesson Content Items
    UPDATE public.lesson_content_items lci SET content_status = 'published'
    WHERE lci.content_status = 'draft' AND lci.course_id = NEW.id;

    -- 5. Quizzes (no course_id, must join)
    UPDATE public.quizzes q SET content_status = 'published'
    WHERE id IN (
        SELECT lci.content_id 
        FROM public.lesson_content_items lci
        WHERE lci.course_id = NEW.id AND lci.content_type = 'quiz'
    ) AND content_status = 'draft';

    -- Clear session variable
    PERFORM set_config('app.is_publish_action', 'false', false);
    NEW.pending_content := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix cascade_publish_pending_content
-- Same fix: lessons and quizzes don't have course_id
CREATE OR REPLACE FUNCTION public.cascade_publish_pending_content()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pending_content = true AND NEW.pending_content = false
     AND NEW.verification_status = 'approved' THEN

    -- Set session variable to prevent trigger loops
    PERFORM set_config('app.is_publish_action', 'true', false);

    UPDATE public.modules SET content_status = 'published' WHERE course_id = NEW.id AND content_status = 'pending_addition';
    
    UPDATE public.lessons SET content_status = 'published' 
    WHERE id IN (
        SELECT lci.content_id 
        FROM public.lesson_content_items lci
        WHERE lci.course_id = NEW.id AND lci.content_type = 'lesson'
    ) AND content_status = 'pending_addition';

    UPDATE public.module_content_items mci SET content_status = 'published'
    WHERE mci.content_status = 'pending_addition' AND EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = mci.module_id AND m.course_id = NEW.id
    );

    UPDATE public.lesson_content_items lci SET content_status = 'published'
    WHERE lci.content_status = 'pending_addition' AND lci.course_id = NEW.id;

    UPDATE public.quizzes q SET content_status = 'published'
    WHERE id IN (
        SELECT lci.content_id 
        FROM public.lesson_content_items lci
        WHERE lci.course_id = NEW.id AND lci.content_type = 'quiz'
    ) AND content_status = 'pending_addition';

    -- Clear session variable
    PERFORM set_config('app.is_publish_action', 'false', false);

    RAISE NOTICE 'Published all pending content for course %', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
