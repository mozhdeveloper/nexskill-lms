-- =====================================================
-- RPC: create_quiz_with_content_item
-- Purpose: Atomically creates a quiz and its corresponding
-- lesson_content_item to prevent orphaned items.
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_quiz_with_content_item(
  p_quiz_id uuid,
  p_quiz_title text,
  p_course_id uuid,
  p_module_id uuid,
  p_lesson_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_quiz_type text DEFAULT 'standard'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_position integer;
  v_content_status text;
  v_course_status text;
BEGIN
  -- 1. Determine position (at the end of current items for this lesson)
  SELECT COALESCE(MAX(position), -1) + 1
  INTO v_position
  FROM public.lesson_content_items
  WHERE lesson_id = p_lesson_id;

  -- 2. Determine course status
  SELECT verification_status INTO v_course_status
  FROM public.courses
  WHERE id = p_course_id;

  -- 3. Determine content status (Phase 1 logic: approved courses get pending_addition)
  IF v_course_status = 'approved' THEN
    v_content_status := 'pending_addition';
    
    -- Also ensure course has pending_content flag set
    UPDATE public.courses 
    SET pending_content = true, updated_at = NOW()
    WHERE id = p_course_id AND (pending_content = false OR pending_content IS NULL);
  ELSE
    v_content_status := 'published';
  END IF;

  -- 4. Insert into quizzes
  INSERT INTO public.quizzes (
    id,
    title,
    lesson_id,
    quiz_type,
    content_status,
    passing_score,
    time_limit_minutes,
    max_attempts,
    is_published,
    requires_coach_approval,
    requires_manual_grading
  ) VALUES (
    p_quiz_id,
    p_quiz_title,
    p_lesson_id,
    p_quiz_type,
    v_content_status,
    70, -- Default passing score
    30, -- Default time limit
    3,  -- Default max attempts
    (v_content_status = 'published'), -- is_published is legacy but kept for compatibility
    (p_quiz_type = 'coach_reviewed'), -- Auto-enable if type is coach_reviewed
    (p_quiz_type = 'coach_reviewed')  -- Usually requires manual grading if reviewed
  );

  -- 5. Insert into lesson_content_items
  INSERT INTO public.lesson_content_items (
    lesson_id,
    course_id,
    module_id,
    content_type,
    content_id,
    metadata,
    position,
    content_status
  ) VALUES (
    p_lesson_id,
    p_course_id,
    p_module_id,
    'quiz',
    p_quiz_id,
    p_metadata || jsonb_build_object('title', p_quiz_title),
    v_position,
    v_content_status
  );

  RETURN p_quiz_id;
END;
$$;

COMMENT ON FUNCTION public.create_quiz_with_content_item IS 
  'Atomically creates a quiz and its link in lesson_content_items. Handles Course Versioning status automatically.';
