-- ========================================
-- SUB-COACH FEATURE: NEW TABLES
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Sub-Coach Assignments Table
-- Tracks which students are assigned as sub-coaches for which courses
CREATE TABLE IF NOT EXISTS public.sub_coach_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sub_coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate assignments (same student can't be sub-coach for same course twice)
  UNIQUE(sub_coach_id, course_id)
);

-- 2. Sub-Coach Requirements Table (Optional feature)
-- Stores prerequisite courses needed to qualify as sub-coach for an assignment
CREATE TABLE IF NOT EXISTS public.sub_coach_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.sub_coach_assignments(id) ON DELETE CASCADE,
  required_course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate requirements
  UNIQUE(assignment_id, required_course_id)
);

-- 3. Sub-Coach Student Allocations Table
-- Tracks which enrolled students are managed by which sub-coach
CREATE TABLE IF NOT EXISTS public.sub_coach_student_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.sub_coach_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate allocations (same student can't be assigned to same sub-coach assignment twice)
  UNIQUE(assignment_id, student_id)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_sca_coach_id ON public.sub_coach_assignments(coach_id);
CREATE INDEX IF NOT EXISTS idx_sca_sub_coach_id ON public.sub_coach_assignments(sub_coach_id);
CREATE INDEX IF NOT EXISTS idx_sca_course_id ON public.sub_coach_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_scr_assignment_id ON public.sub_coach_requirements(assignment_id);
CREATE INDEX IF NOT EXISTS idx_scsa_assignment_id ON public.sub_coach_student_allocations(assignment_id);
CREATE INDEX IF NOT EXISTS idx_scsa_student_id ON public.sub_coach_student_allocations(student_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE public.sub_coach_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_coach_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_coach_student_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sub_coach_assignments
CREATE POLICY "Coaches can view their own sub-coach assignments"
  ON public.sub_coach_assignments FOR SELECT
  USING (coach_id = auth.uid() OR sub_coach_id = auth.uid());

CREATE POLICY "Coaches can insert sub-coach assignments"
  ON public.sub_coach_assignments FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own sub-coach assignments"
  ON public.sub_coach_assignments FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own sub-coach assignments"
  ON public.sub_coach_assignments FOR DELETE
  USING (coach_id = auth.uid());

-- RLS Policies for sub_coach_requirements
CREATE POLICY "Users can view requirements for their assignments"
  ON public.sub_coach_requirements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sub_coach_assignments sca
      WHERE sca.id = assignment_id
      AND (sca.coach_id = auth.uid() OR sca.sub_coach_id = auth.uid())
    )
  );

CREATE POLICY "Coaches can insert requirements"
  ON public.sub_coach_requirements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sub_coach_assignments sca
      WHERE sca.id = assignment_id AND sca.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete requirements"
  ON public.sub_coach_requirements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sub_coach_assignments sca
      WHERE sca.id = assignment_id AND sca.coach_id = auth.uid()
    )
  );

-- RLS Policies for sub_coach_student_allocations  
CREATE POLICY "Users can view allocations for their assignments"
  ON public.sub_coach_student_allocations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sub_coach_assignments sca
      WHERE sca.id = assignment_id
      AND (sca.coach_id = auth.uid() OR sca.sub_coach_id = auth.uid())
    )
    OR student_id = auth.uid()
  );

CREATE POLICY "Coaches can insert student allocations"
  ON public.sub_coach_student_allocations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sub_coach_assignments sca
      WHERE sca.id = assignment_id AND sca.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete student allocations"
  ON public.sub_coach_student_allocations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sub_coach_assignments sca
      WHERE sca.id = assignment_id AND sca.coach_id = auth.uid()
    )
  );

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
-- If you see this without errors, the migration was successful!
-- Tables created:
--   1. sub_coach_assignments
--   2. sub_coach_requirements  
--   3. sub_coach_student_allocations
