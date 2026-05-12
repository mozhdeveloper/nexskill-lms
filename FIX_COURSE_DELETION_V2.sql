-- Fix: Resolve Course Deletion Failure (Defensive Trigger)
-- This script ensures that deleting a course (and its cascading enrollments) 
-- does not trigger a foreign key violation in the notification system.

-- 1. Ensure enrollments and course_leaves have proper CASCADE behavior
DO $$ 
BEGIN
    -- Fix enrollments FK if needed
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'enrollments_course_id_fkey') THEN
        ALTER TABLE public.enrollments DROP CONSTRAINT enrollments_course_id_fkey;
    END IF;
    ALTER TABLE public.enrollments 
    ADD CONSTRAINT enrollments_course_id_fkey 
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

    -- Fix course_leaves FK if needed
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'course_leaves_course_id_fkey') THEN
        ALTER TABLE public.course_leaves DROP CONSTRAINT course_leaves_course_id_fkey;
    END IF;
    ALTER TABLE public.course_leaves 
    ADD CONSTRAINT course_leaves_course_id_fkey 
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
END $$;

-- 2. Update the trigger function to be extremely defensive
CREATE OR REPLACE FUNCTION public.log_student_course_departure()
RETURNS TRIGGER AS $$
BEGIN
    -- Only attempt to log if the course still exists and is not being deleted.
    -- In a cascading delete, the parent row might still be visible but referencing it 
    -- in a new INSERT can cause a 409/FK violation.
    
    -- We check if the course exists. If it's being deleted, this might still return true,
    -- so we rely on the EXCEPTION block.
    BEGIN
        IF EXISTS (SELECT 1 FROM public.courses WHERE id = OLD.course_id) THEN
            INSERT INTO public.course_leaves (profile_id, course_id)
            VALUES (OLD.profile_id, OLD.course_id);
        END IF;
    EXCEPTION 
        WHEN foreign_key_violation THEN
            -- Catch specifically the FK violation that happens during course deletion
            RETURN OLD;
        WHEN others THEN
            -- Catch everything else to ensure the course deletion itself is NEVER blocked
            RETURN OLD;
    END;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-apply the trigger
DROP TRIGGER IF EXISTS trg_log_course_departure ON public.enrollments;
CREATE TRIGGER trg_log_course_departure
BEFORE DELETE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION log_student_course_departure();
