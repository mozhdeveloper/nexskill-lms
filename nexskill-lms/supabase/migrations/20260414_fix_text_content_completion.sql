-- =====================================================
-- Migration: Fix lesson completion for lessons with text content
-- =====================================================
-- ISSUE: check_lesson_all_content_completed excludes 'notes' but NOT 'text'.
-- Text content items have no progress tracking, so lessons with text + video
-- will NEVER auto-complete because text is counted as "required" but can never
-- be marked completed.
--
-- FIX: Exclude both 'notes' AND 'text' from the completion check.
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_lesson_all_content_completed(p_user_id uuid, p_lesson_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  total_items     integer;
  completed_items integer;
BEGIN
  -- Count only REQUIRED items — exclude notes AND text
  -- (text has no progress tracking, notes are optional)
  SELECT COUNT(*) INTO total_items
  FROM public.lesson_content_items
  WHERE lesson_id    = p_lesson_id
    AND content_type NOT IN ('notes', 'text')
    AND content_status = 'published';

  -- No required items (note/text-only lesson) → auto-complete
  IF total_items = 0 THEN
    RETURN true;
  END IF;

  -- Count completed required items for this user
  SELECT COUNT(*) INTO completed_items
  FROM public.lesson_content_item_progress lcip
  JOIN public.lesson_content_items lci
    ON lci.id           = lcip.content_item_id
   AND lci.lesson_id    = p_lesson_id
   AND lci.content_type NOT IN ('notes', 'text')
   AND lci.content_status = 'published'
  WHERE lcip.user_id      = p_user_id
    AND lcip.lesson_id    = p_lesson_id
    AND lcip.is_completed = true;

  RETURN total_items = completed_items;
END;
$function$;

-- Also fix the mark_lesson_complete trigger function to skip text
CREATE OR REPLACE FUNCTION public.mark_lesson_complete_if_all_content_done()
RETURNS TRIGGER AS $$
DECLARE
  all_completed     boolean;
  item_content_type text;
BEGIN
  -- Only check when a content item is marked as completed
  IF NEW.is_completed = true THEN

    -- Resolve the content_type of the item that just changed
    SELECT lci.content_type INTO item_content_type
    FROM public.lesson_content_items lci
    WHERE lci.id = NEW.content_item_id;

    -- Notes and text never contribute to completion — skip entirely
    IF item_content_type IN ('notes', 'text') THEN
      RETURN NEW;
    END IF;

    -- Check whether ALL required items are now complete
    SELECT public.check_lesson_all_content_completed(NEW.user_id, NEW.lesson_id)
    INTO all_completed;

    IF all_completed THEN
      INSERT INTO public.user_lesson_progress (user_id, lesson_id, is_completed, completed_at)
      VALUES (NEW.user_id, NEW.lesson_id, true, now())
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET
        is_completed = true,
        completed_at = now();
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_lesson_all_content_completed(uuid, uuid) IS
  'FIXED: Excludes both notes AND text from completion check. Text has no progress tracking.';
