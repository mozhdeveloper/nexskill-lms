-- =====================================================
-- Migration: Migrate from is_published to content_status
-- =====================================================
-- Replaces is_published boolean with content_status enum:
--   'draft', 'published', 'pending_addition', 'pending_deletion'
--
-- Updates all triggers, functions, and RLS policies to use content_status.
-- NOTE: is_published column is KEPT for backward compatibility during migration.
-- Can be dropped later once all code is updated.
-- =====================================================

-- ─────────────────────────────────────────────────────────
-- 1. Update cascade_publish_on_approval trigger
--    Uses content_status instead of is_published
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cascade_publish_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'approved'
     AND (OLD.verification_status IS DISTINCT FROM 'approved') THEN

    -- Set session variable to prevent trigger loops
    PERFORM set_config('app.is_publish_action', 'true', false);

    UPDATE public.modules SET content_status = 'published' WHERE course_id = NEW.id AND content_status = 'draft';
    UPDATE public.lessons SET content_status = 'published' WHERE course_id = NEW.id AND content_status = 'draft';

    UPDATE public.module_content_items mci SET content_status = 'published'
    WHERE mci.content_status = 'draft' AND EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = mci.module_id AND m.course_id = NEW.id
    );

    UPDATE public.lesson_content_items lci SET content_status = 'published'
    WHERE lci.content_status = 'draft' AND EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = lci.module_id AND m.course_id = NEW.id
    );

    UPDATE public.quizzes q SET content_status = 'published'
    WHERE q.content_status = 'draft' AND EXISTS (
      SELECT 1 FROM public.module_content_items mci
      JOIN public.modules m ON m.id = mci.module_id
      WHERE mci.content_id = q.id AND mci.content_type = 'quiz' AND m.course_id = NEW.id
    );

    UPDATE public.quizzes q SET content_status = 'published'
    WHERE q.content_status = 'draft' AND EXISTS (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 2. Update cascade_publish_pending_content trigger
--    Uses content_status instead of is_published
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cascade_publish_pending_content()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pending_content = true AND NEW.pending_content = false
     AND NEW.verification_status = 'approved' THEN

    -- Set session variable to prevent trigger loops
    PERFORM set_config('app.is_publish_action', 'true', false);

    UPDATE public.modules SET content_status = 'published' WHERE course_id = NEW.id AND content_status = 'pending_addition';
    UPDATE public.lessons SET content_status = 'published' WHERE course_id = NEW.id AND content_status = 'pending_addition';

    UPDATE public.module_content_items mci SET content_status = 'published'
    WHERE mci.content_status = 'pending_addition' AND EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = mci.module_id AND m.course_id = NEW.id
    );

    UPDATE public.lesson_content_items lci SET content_status = 'published'
    WHERE lci.content_status = 'pending_addition' AND EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = lci.module_id AND m.course_id = NEW.id
    );

    UPDATE public.quizzes q SET content_status = 'published'
    WHERE q.content_status = 'pending_addition' AND EXISTS (
      SELECT 1 FROM public.module_content_items mci
      JOIN public.modules m ON m.id = mci.module_id
      WHERE mci.content_id = q.id AND mci.content_type = 'quiz' AND m.course_id = NEW.id
    );

    UPDATE public.quizzes q SET content_status = 'published'
    WHERE q.content_status = 'pending_addition' AND EXISTS (
      SELECT 1 FROM public.lesson_content_items lci
      JOIN public.modules m ON m.id = lci.module_id
      WHERE lci.content_id = q.id AND lci.content_type = 'quiz' AND m.course_id = NEW.id
    );

    -- Clear session variable
    PERFORM set_config('app.is_publish_action', 'false', false);

    RAISE NOTICE 'Published all pending content for course %', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────
-- 3. Update update_course_verification_status_on_content_change
--    Sets pending_content when content changes on approved course
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_course_verification_status_on_content_change()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_current_status TEXT;
  v_is_new_record BOOLEAN;
  v_content_status TEXT;
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
    v_content_status := COALESCE(NEW.content_status, 'draft');
  ELSIF TG_TABLE_NAME = 'module_content_items' THEN
    SELECT course_id INTO v_course_id FROM modules WHERE id = COALESCE(NEW.module_id, OLD.module_id);
    v_is_new_record := (TG_OP = 'INSERT');
    v_content_status := COALESCE(NEW.content_status, 'draft');
  ELSIF TG_TABLE_NAME = 'lesson_content_items' THEN
    v_course_id := COALESCE(NEW.course_id, OLD.course_id);
    v_is_new_record := (TG_OP = 'INSERT');
    v_content_status := COALESCE(NEW.content_status, 'draft');
  END IF;

  IF v_course_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  SELECT verification_status INTO v_current_status FROM courses WHERE id = v_course_id;

  -- If course is approved AND content is pending, set pending_content flag
  IF v_current_status = 'approved' AND v_content_status = 'pending_addition' THEN
    UPDATE courses SET pending_content = true, updated_at = timezone('utc'::text, NOW())
    WHERE id = v_course_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 4. Update update_course_verification_on_lesson_change
--    Handles lesson changes on approved courses
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
    -- Check if lesson is pending addition
    IF TG_OP = 'INSERT' AND COALESCE(NEW.content_status, 'draft') = 'pending_addition' THEN
      UPDATE courses SET pending_content = true, updated_at = timezone('utc'::text, NOW())
      WHERE id = v_course_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 5. Update update_course_verification_on_quiz_change
--    Handles quiz changes on approved courses
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

  -- Try finding via module_content_items first
  SELECT m.course_id INTO v_course_id
  FROM module_content_items mci
  JOIN modules m ON m.id = mci.module_id
  WHERE mci.content_id = COALESCE(NEW.id, OLD.id)
    AND mci.content_type = 'quiz'
  LIMIT 1;

  -- If not found, try lesson_content_items
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
    IF TG_OP = 'INSERT' AND COALESCE(NEW.content_status, 'draft') = 'pending_addition' THEN
      UPDATE courses SET pending_content = true, updated_at = timezone('utc'::text, NOW())
      WHERE id = v_course_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 6. Update reset_lesson_completion_on_content_change
--    Only reset on INSERT, not DELETE
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reset_lesson_completion_on_content_change()
RETURNS TRIGGER AS $$
DECLARE
  target_lesson_id UUID;
  v_is_publish_action BOOLEAN;
  v_content_status TEXT;
BEGIN
  -- Skip during admin approval publish cycle
  v_is_publish_action := (current_setting('app.is_publish_action', true) = 'true');
  IF v_is_publish_action THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    target_lesson_id := OLD.lesson_id;
  ELSE
    target_lesson_id := NEW.lesson_id;
    v_content_status := COALESCE(NEW.content_status, 'published');
  END IF;

  IF target_lesson_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- FIX: Only reset progress when content is ADDED (INSERT), not when DELETED
  IF TG_OP = 'INSERT' THEN
    -- Only reset if the content is (or will be) visible to students
    -- Skip reset for pending_addition content
    IF v_content_status = 'pending_addition' OR v_content_status = 'draft' THEN
      RETURN NEW;
    END IF;

    -- Reset lesson-level completion
    DELETE FROM user_lesson_progress
    WHERE lesson_id = target_lesson_id;

    -- Reset item-level progress
    DELETE FROM lesson_content_item_progress
    WHERE lesson_id = target_lesson_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- DO NOT reset progress when content is deleted
    NULL;

  ELSIF TG_OP = 'UPDATE' THEN
    -- On update, only reset if content_status changed to published
    IF OLD.content_status IN ('draft', 'pending_addition') AND NEW.content_status = 'published' THEN
      DELETE FROM user_lesson_progress
      WHERE lesson_id = target_lesson_id;

      DELETE FROM lesson_content_item_progress
      WHERE lesson_id = target_lesson_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 7. Update comments
-- ─────────────────────────────────────────────────────────
COMMENT ON FUNCTION public.cascade_publish_on_approval() IS
  'Publishes all content on initial course approval. Uses content_status instead of is_published.';

COMMENT ON FUNCTION public.cascade_publish_pending_content() IS
  'Publishes pending content when admin approves changes. Uses content_status instead of is_published.';

COMMENT ON FUNCTION public.update_course_verification_status_on_content_change() IS
  'Sets pending_content=true when content changes on approved course. Uses content_status.';

COMMENT ON FUNCTION public.update_course_verification_on_lesson_change() IS
  'Sets pending_content=true when lesson changes on approved course. Uses content_status.';

COMMENT ON FUNCTION public.update_course_verification_on_quiz_change() IS
  'Sets pending_content=true when quiz changes on approved course. Uses content_status.';

COMMENT ON FUNCTION public.reset_lesson_completion_on_content_change() IS
  'Only resets lesson completion when content is ADDED (INSERT), not when deleted. Uses content_status.';
