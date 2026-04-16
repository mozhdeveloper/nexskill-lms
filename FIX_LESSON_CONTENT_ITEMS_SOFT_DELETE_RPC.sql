-- Reliable fallback for lesson_content_items soft-delete when UPDATE RLS is brittle
-- Run this in Supabase SQL Editor

BEGIN;

CREATE OR REPLACE FUNCTION public.coach_mark_lesson_content_item_pending_deletion(
  p_content_item_id UUID,
  p_course_id UUID,
  p_module_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_item RECORD;
  v_effective_module_id UUID;
  v_rows INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT id, course_id, module_id, content_status
  INTO v_item
  FROM public.lesson_content_items
  WHERE id = p_content_item_id;

  IF v_item.id IS NULL THEN
    RAISE EXCEPTION 'Content item not found' USING ERRCODE = 'P0002';
  END IF;

  v_effective_module_id := COALESCE(p_module_id, v_item.module_id);

  -- Coach ownership via course_id OR module->course path
  IF NOT EXISTS (
    SELECT 1
    FROM public.courses c
    WHERE c.id = COALESCE(p_course_id, v_item.course_id)
      AND c.coach_id = v_user_id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = v_effective_module_id
      AND c.coach_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized for this content item' USING ERRCODE = '42501';
  END IF;

  UPDATE public.lesson_content_items
  SET content_status = 'pending_deletion',
      deleted_at = timezone('utc'::text, NOW()),
      updated_at = timezone('utc'::text, NOW())
  WHERE id = p_content_item_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'updated_rows', v_rows,
    'content_item_id', p_content_item_id,
    'status', 'pending_deletion'
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.coach_mark_lesson_content_item_pending_deletion(UUID, UUID, UUID) TO authenticated;

COMMIT;

-- Verify function is available
SELECT routine_schema, routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'coach_mark_lesson_content_item_pending_deletion';
