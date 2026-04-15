-- =====================================================
-- Phase 1: Content Additions Versioning (FIXED)
-- =====================================================
-- MODIFIES triggers to NOT reset verification_status when
-- coaches add new content to approved courses.
--
-- NEW content is saved with is_published = false, so it
-- stays hidden from students until admin approves.
--
-- COURSE STAYS VISIBLE to students while new content is pending.
-- =====================================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS trg_modules_content_change ON public.modules;
DROP TRIGGER IF EXISTS trg_module_content_items_change ON public.module_content_items;
DROP TRIGGER IF EXISTS trg_lessons_change ON public.lessons;
DROP TRIGGER IF EXISTS trg_quizzes_change ON public.quizzes;
DROP TRIGGER IF EXISTS trg_lesson_content_items_change ON public.lesson_content_items;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.update_course_verification_status_on_content_change();
DROP FUNCTION IF EXISTS public.update_course_verification_on_lesson_change();
DROP FUNCTION IF EXISTS public.update_course_verification_on_quiz_change();

-- =====================================================
-- TRIGGER FUNCTION: Handles modules, module_content_items, lesson_content_items
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_course_verification_status_on_content_change()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_current_status TEXT;
  v_is_new_record BOOLEAN;
  v_is_published BOOLEAN;
BEGIN
  -- Determine the course_id based on which table triggered this
  IF TG_TABLE_NAME = 'modules' THEN
    v_course_id := COALESCE(NEW.course_id, OLD.course_id);
    v_is_new_record := (TG_OP = 'INSERT');
    v_is_published := COALESCE(NEW.is_published, false);
  ELSIF TG_TABLE_NAME = 'module_content_items' THEN
    SELECT course_id INTO v_course_id FROM modules WHERE id = COALESCE(NEW.module_id, OLD.module_id);
    v_is_new_record := (TG_OP = 'INSERT');
    v_is_published := COALESCE(NEW.is_published, false);
  ELSIF TG_TABLE_NAME = 'lesson_content_items' THEN
    -- Find course via: lesson_content_items → lessons → module_content_items → modules
    SELECT m.course_id INTO v_course_id
    FROM lessons l
    JOIN module_content_items mci ON mci.content_id = l.id AND mci.content_type = 'lesson'
    JOIN modules m ON m.id = mci.module_id
    WHERE l.id = COALESCE(NEW.lesson_id, OLD.lesson_id)
    LIMIT 1;
    v_is_new_record := (TG_OP = 'INSERT');
    v_is_published := COALESCE(NEW.is_published, false);
  END IF;

  -- If we couldn't determine course_id, exit
  IF v_course_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Get current verification status
  SELECT verification_status INTO v_current_status FROM courses WHERE id = v_course_id;

  -- PHASE 1 LOGIC:
  -- If course is approved AND we're adding NEW unpublished content:
  --   → Keep course as 'approved' (stays visible)
  --   → New content stays hidden (is_published = false)
  -- If course is approved AND we're UPDATING/DELETING:
  --   → Mark as 'pending_review' (Phase 2 will handle deletions differently)
  
  IF v_current_status = 'approved' THEN
    -- Only skip reset if this is a NEW INSERT AND it's explicitly unpublished
    IF v_is_new_record AND v_is_published = false THEN
      -- NEW content being added → course stays approved & visible
      RAISE NOTICE 'Phase 1: Course % stays approved - new content added (is_published=%)', v_course_id, v_is_published;
    ELSE
      -- UPDATE or DELETE → mark as pending review
      UPDATE courses
      SET
        verification_status = 'pending_review',
        updated_at = timezone('utc'::text, NOW())
      WHERE id = v_course_id
        AND verification_status = 'approved'; -- prevent race conditions

      RAISE NOTICE 'Phase 1: Course % marked as pending_review (op=%, is_published=%)', v_course_id, TG_OP, v_is_published;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER FUNCTION: Handles lessons (finds course via module_content_items)
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_course_verification_on_lesson_change()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_current_status TEXT;
  v_is_new_record BOOLEAN;
  v_is_published BOOLEAN;
BEGIN
  v_is_new_record := (TG_OP = 'INSERT');
  v_is_published := COALESCE(NEW.is_published, false);

  -- Find course via: lessons → module_content_items → modules
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
    IF v_is_new_record AND v_is_published = false THEN
      -- NEW lesson added → course stays approved (new content is hidden)
      RAISE NOTICE 'Phase 1: Course % stays approved - new lesson added (is_published=%)', v_course_id, v_is_published;
    ELSIF TG_OP = 'UPDATE' THEN
      -- PHASE 1 FIX: Do NOT reset course for lesson updates (content_blocks, metadata, descriptions, etc.)
      -- Coaches need to be able to edit lessons without taking the whole course offline.
      -- Phase 2 will handle structural changes and deletions properly.
      RAISE NOTICE 'Phase 1: Course % stays approved - lesson updated (content_blocks/metadata changed)', v_course_id;
    ELSE
      -- DELETE → mark as pending review (will be improved in Phase 2 with soft-delete)
      UPDATE courses
      SET
        verification_status = 'pending_review',
        updated_at = timezone('utc'::text, NOW())
      WHERE id = v_course_id
        AND verification_status = 'approved';

      RAISE NOTICE 'Phase 1: Course % marked as pending_review (lesson deleted)', v_course_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER FUNCTION: Handles quizzes (finds course via module_content_items or lesson_content_items)
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_course_verification_on_quiz_change()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_current_status TEXT;
  v_is_new_record BOOLEAN;
  v_is_published BOOLEAN;
BEGIN
  v_is_new_record := (TG_OP = 'INSERT');
  v_is_published := COALESCE(NEW.is_published, false);

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
    IF v_is_new_record AND v_is_published = false THEN
      RAISE NOTICE 'Phase 1: Course % stays approved - new quiz added (is_published=%)', v_course_id, v_is_published;
    ELSE
      UPDATE courses
      SET
        verification_status = 'pending_review',
        updated_at = timezone('utc'::text, NOW())
      WHERE id = v_course_id
        AND verification_status = 'approved';

      RAISE NOTICE 'Phase 1: Course % marked as pending_review (op=%, is_published=%)', v_course_id, TG_OP, v_is_published;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Recreate triggers
-- =====================================================
CREATE TRIGGER trg_modules_content_change
  AFTER INSERT OR UPDATE OR DELETE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_verification_status_on_content_change();

CREATE TRIGGER trg_module_content_items_change
  AFTER INSERT OR UPDATE OR DELETE ON public.module_content_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_verification_status_on_content_change();

CREATE TRIGGER trg_lesson_content_items_change
  AFTER INSERT OR UPDATE OR DELETE ON public.lesson_content_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_verification_status_on_content_change();

CREATE TRIGGER trg_lessons_change
  AFTER INSERT OR UPDATE OR DELETE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_verification_on_lesson_change();

CREATE TRIGGER trg_quizzes_change
  AFTER INSERT OR UPDATE OR DELETE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_verification_on_quiz_change();

-- =====================================================
-- Update comments
-- =====================================================
COMMENT ON FUNCTION public.update_course_verification_status_on_content_change() IS 
  'Phase 1 (FIXED): Keeps course approved when adding new unpublished content. Marks pending_review for updates/deletes.';

COMMENT ON FUNCTION public.update_course_verification_on_lesson_change() IS 
  'Phase 1 (FIXED): Handles lesson changes - keeps course approved for new unpublished lessons.';

COMMENT ON FUNCTION public.update_course_verification_on_quiz_change() IS 
  'Phase 1 (FIXED): Handles quiz changes - keeps course approved for new unpublished quizzes.';
