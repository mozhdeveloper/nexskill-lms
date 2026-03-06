-- Create sub_coach_assignments table
CREATE TABLE IF NOT EXISTS public.sub_coach_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,          -- The primary coach who owns the course
  sub_coach_id uuid NOT NULL,      -- The student/user being assigned as sub-coach
  course_id uuid NOT NULL,         -- The course they are assigned to
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sub_coach_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT fk_coach FOREIGN KEY (coach_id) REFERENCES public.profiles(id),
  CONSTRAINT fk_sub_coach FOREIGN KEY (sub_coach_id) REFERENCES public.profiles(id),
  CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES public.courses(id)
);

-- Add RLS Policies (Optional but recommended)
ALTER TABLE public.sub_coach_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can view their own assignments
CREATE POLICY "Coaches can view their own assignments" ON public.sub_coach_assignments
  FOR SELECT USING (auth.uid() = coach_id);

-- Policy: Coaches can insert assignments for themselves
CREATE POLICY "Coaches can insert assignments" ON public.sub_coach_assignments
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

-- Policy: Coaches can update their own assignments
CREATE POLICY "Coaches can update assignments" ON public.sub_coach_assignments
  FOR UPDATE USING (auth.uid() = coach_id);

-- Policy: Coaches can delete their own assignments
CREATE POLICY "Coaches can delete assignments" ON public.sub_coach_assignments
  FOR DELETE USING (auth.uid() = coach_id);
