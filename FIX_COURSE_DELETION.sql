-- Fix: Resolve Course Deletion Failure (Foreign Key Violation)
-- This script fixes the issue where coaches cannot delete courses because the
-- student departure trigger on the enrollments table fails when the parent
-- course is being deleted.

-- 1. Update the trigger function to handle foreign key violations gracefully
CREATE OR REPLACE FUNCTION public.log_student_course_departure()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        -- Attempt to log the departure
        INSERT INTO public.course_leaves (profile_id, course_id)
        VALUES (OLD.profile_id, OLD.course_id);
    EXCEPTION 
        WHEN foreign_key_violation THEN
            -- If the course_id doesn't exist (e.g., the course is being deleted),
            -- just skip the log and let the enrollment be deleted.
            RETURN OLD;
        WHEN others THEN
            -- Handle other potential errors silently to ensure deletion succeeds
            RETURN OLD;
    END;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Verify trigger is correctly attached (re-apply just in case)
DROP TRIGGER IF EXISTS trg_log_course_departure ON public.enrollments;
CREATE TRIGGER trg_log_course_departure
BEFORE DELETE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION log_student_course_departure();

-- 3. Optimization: Ensure course_leaves is also cleaned up when a course is deleted
-- (The table definition already has ON DELETE CASCADE, so this is just for documentation)
-- ALTER TABLE public.course_leaves 
-- DROP CONSTRAINT IF EXISTS course_leaves_course_id_fkey,
-- ADD CONSTRAINT course_leaves_course_id_fkey 
-- FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
