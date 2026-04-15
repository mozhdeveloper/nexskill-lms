-- =====================================================
-- Phase 1.5: Pending Content Tracking (FINAL FIX)
-- =====================================================
-- Adds pending_content column to track content changes
-- on approved courses without changing verification_status.
--
-- WORKFLOW:
-- 1. Coach adds content to approved course → verification_status stays 'approved',
--    new content saved as is_published=false, pending_content set to true
-- 2. Students still see the course (verification_status='approved')
--    but new content is hidden (is_published=false)
-- 3. Admin sees courses with pending_content=true in moderation queue
-- 4. Admin approves → cascade publishes new content, sets pending_content=false
--
-- FIX: Uses session variable to prevent trigger loops during admin approval.
-- =====================================================

-- ─────────────────────────────────────────────────────────
-- 1. Add pending_content column to courses
-- ─────────────────────────────────────────────────────────
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS pending_content BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_courses_pending_content ON courses(pending_content);

COMMENT ON COLUMN courses.pending_content IS 'True when a coach has made changes to an approved course that need admin review. Students still see the approved version until admin approves the changes.';

-- ─────────────────────────────────────────────────────────
-- 2. Replace update_course_verification_status_on_content_change
--    with Phase 1.5 logic: sets pending_content instead of
--    resetting verification_status for approved courses
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_course_verification_status_on_content_change()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_current_status TEXT;
  v_is_new_record BOOLEAN;
  v_is_published BOOLEAN;
  v_is_publish_action BOOLEAN;
BEGIN
  -- Check if this is a publish action via session variable
  v_is_publish_action := (current_setting('app.is_publish_action', true) = 'true');
  
  -- Skip ALL logic during publish action to prevent trigger loops
  IF v_is_publish_action THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF TG_TABLE_NAME = 'modules' THEN
    v_course_id := COALESCE(NEW.course_id, OLD.course_id);
    v_is_new_record := (TG_OP = 'INSERT');
    v_is_published := COALESCE(NEW.is_published, false);
  ELSIF TG_TABLE_NAME = 'module_content_items' THEN
    SELECT course_id INTO v_course_id FROM modules WHERE id = COALESCE(NEW.module_id, OLD.module_id);
    v_is_new_record := (TG_OP = 'INSERT');
    v_is_published := COALESCE(NEW.is_published, false);
  ELSIF TG_TABLE_NAME = 'lesson_content_items' THEN
    -- FIX: Use direct course_id column
    v_course_id := COALESCE(NEW.course_id, OLD.course_id);
    v_is_new_record := (TG_OP = 'INSERT');
    v_is_published := COALESCE(NEW.is_published, false);
  END IF;

  IF v_course_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  SELECT verification_status INTO v_current_status FROM courses WHERE id = v_course_id;

  IF v_current_status = 'approved' THEN
    UPDATE courses SET pending_content = true, updated_at = timezone('utc'::text, NOW())
    WHERE id = v_course_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 3. Replace update_course_verification_on_lesson_change
--    with Phase 1.5 logic
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_course_verification_on_lesson_change()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_current_status TEXT;
  v_is_publish_action BOOLEAN;
BEGIN
  -- Check if this is a publish action via session variable
  v_is_publish_action := (current_setting('app.is_publish_action', true) = 'true');
  IF v_is_publish_action THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  SELECT m.course_id INTO v_course_id
  FROM module_content_items mci
  JOIN modules m ON m.id = mci.module_id
  WHERE mci.content_id = COALESCE(NEW.id, OLD.id)
    AND mci.content_type = 'lesson'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  SELECT verification_status INTO v_current_status FROM courses WHERE id = v_course_id;

  IF v_current_status = 'approved' THEN
    UPDATE courses SET pending_content = true, updated_at = timezone('utc'::text, NOW())
    WHERE id = v_course_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 4. Replace update_course_verification_on_quiz_change
--    with Phase 1.5 logic
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_course_verification_on_quiz_change()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_current_status TEXT;
  v_is_publish_action BOOLEAN;
BEGIN
  -- Check if this is a publish action via session variable
  v_is_publish_action := (current_setting('app.is_publish_action', true) = 'true');
  IF v_is_publish_action THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  SELECT m.course_id INTO v_course_id
  FROM module_content_items mci
  JOIN modules m ON m.id = mci.module_id
  WHERE mci.content_id = COALESCE(NEW.id, OLD.id)
    AND mci.content_type = 'quiz'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    SELECT m.course_id INTO v_course_id
    FROM lesson_content_items lci
    JOIN modules m ON m.id = lci.module_id
    WHERE lci.content_id = COALESCE(NEW.id, OLD.id)
      AND lci.content_type = 'quiz'
    LIMIT 1;
  END IF;

  IF v_course_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  SELECT verification_status INTO v_current_status FROM courses WHERE id = v_course_id;

  IF v_current_status = 'approved' THEN
    UPDATE courses SET pending_content = true, updated_at = timezone('utc'::text, NOW())
    WHERE id = v_course_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 5. Replace cascade_publish_on_course_approval
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cascade_publish_on_course_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'approved'
     AND (OLD.verification_status IS DISTINCT FROM 'approved') THEN

    -- Set session variable to prevent trigger loops
    PERFORM set_config('app.is_publish_action', 'true', false);

    UPDATE public.modules SET is_published = true WHERE course_id = NEW.id AND is_published = false;
    UPDATE public.lessons SET is_published = true WHERE course_id = NEW.id AND is_published = false;
    
    UPDATE public.module_content_items mci SET is_published = true
    WHERE mci.is_published = false AND EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = mci.module_id AND m.course_id = NEW.id
    );

    UPDATE public.lesson_content_items lci SET is_published = true
    WHERE lci.is_published = false AND EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = lci.module_id AND m.course_id = NEW.id
    );

    UPDATE public.quizzes q SET is_published = true
    WHERE q.is_published = false AND EXISTS (
      SELECT 1 FROM public.module_content_items mci
      JOIN public.modules m ON m.id = mci.module_id
      WHERE mci.content_id = q.id AND mci.content_type = 'quiz' AND m.course_id = NEW.id
    );

    UPDATE public.quizzes q SET is_published = true
    WHERE q.is_published = false AND EXISTS (
      SELECT 1 FROM public.lesson_content_items lci
      JOIN public.modules m ON m.id = lci.module_id
      WHERE lci.content_id = q.id AND lci.content_type = 'quiz' AND m.course_id = NEW.id
    );

    -- Clear session variable
    PERFORM set_config('app.is_publish_action', 'false', false);
    NEW.pending_content := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 5b. NEW TRIGGER: cascade_publish_pending_content
--     Fires when pending_content goes from true to false
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cascade_publish_pending_content()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pending_content = true AND NEW.pending_content = false
     AND NEW.verification_status = 'approved' THEN

    -- Set session variable to prevent trigger loops
    PERFORM set_config('app.is_publish_action', 'true', false);

    UPDATE public.modules SET is_published = true WHERE course_id = NEW.id AND is_published = false;
    UPDATE public.lessons SET is_published = true WHERE course_id = NEW.id AND is_published = false;
    
    UPDATE public.module_content_items mci SET is_published = true
    WHERE mci.is_published = false AND EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = mci.module_id AND m.course_id = NEW.id
    );

    UPDATE public.lesson_content_items lci SET is_published = true
    WHERE lci.is_published = false AND EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = lci.module_id AND m.course_id = NEW.id
    );

    UPDATE public.quizzes q SET is_published = true
    WHERE q.is_published = false AND EXISTS (
      SELECT 1 FROM public.module_content_items mci
      JOIN public.modules m ON m.id = mci.module_id
      WHERE mci.content_id = q.id AND mci.content_type = 'quiz' AND m.course_id = NEW.id
    );

    UPDATE public.quizzes q SET is_published = true
    WHERE q.is_published = false AND EXISTS (
      SELECT 1 FROM public.lesson_content_items lci
      JOIN public.modules m ON m.id = lci.module_id
      WHERE lci.content_id = q.id AND lci.content_type = 'quiz' AND m.course_id = NEW.id
    );

    -- Clear session variable
    PERFORM set_config('app.is_publish_action', 'false', false);

    RAISE NOTICE 'Phase 1.5: Published all pending content for course %', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on courses table
DROP TRIGGER IF EXISTS trg_cascade_publish_pending_content ON public.courses;
CREATE TRIGGER trg_cascade_publish_pending_content
  AFTER UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_publish_pending_content();

-- ─────────────────────────────────────────────────────────
-- 6. Update comments
-- ─────────────────────────────────────────────────────────
COMMENT ON COLUMN courses.pending_content IS 'True when a coach has made changes to an approved course that need admin review. Students still see the approved version until admin approves the changes.';

COMMENT ON FUNCTION public.update_course_verification_status_on_content_change() IS
  'Phase 1.5: Sets pending_content=true when content changes on approved course. Skips during publish actions via session variable.';

COMMENT ON FUNCTION public.update_course_verification_on_lesson_change() IS
  'Phase 1.5: Sets pending_content=true when lesson changes on approved course. Skips during publish actions via session variable.';

COMMENT ON FUNCTION public.update_course_verification_on_quiz_change() IS
  'Phase 1.5: Sets pending_content=true when quiz changes on approved course. Skips during publish actions via session variable.';

COMMENT ON FUNCTION public.cascade_publish_on_course_approval() IS
  'Phase 1.5: Publishes all content (including lesson_content_items) and clears pending_content on initial course approval. Uses session variable to prevent trigger loops.';

COMMENT ON FUNCTION public.cascade_publish_pending_content() IS
  'Phase 1.5: Publishes all unpublished content when admin approves pending changes (pending_content true → false) on already-approved course. Uses session variable to prevent trigger loops.';
