-- Migration: Track progress per lesson content item (not just per lesson)
-- This allows marking individual videos/quizzes as complete within a lesson
-- Lesson is only marked complete when ALL content items are consumed

-- Create table for tracking individual content item progress
CREATE TABLE IF NOT EXISTS public.lesson_content_item_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content_item_id uuid NOT NULL REFERENCES public.lesson_content_items(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('video', 'quiz', 'text', 'document', 'notes')),
  is_completed boolean NOT NULL DEFAULT false,
  progress_data jsonb NULL, -- For videos: { currentTime, duration, watchTime }
  completed_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id, content_item_id) -- One progress record per user per content item
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_lesson_content_item_progress_user_lesson 
  ON public.lesson_content_item_progress(user_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_lesson_content_item_progress_content_item 
  ON public.lesson_content_item_progress(content_item_id);

-- Enable RLS
ALTER TABLE public.lesson_content_item_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and modify their own progress
CREATE POLICY "Users can view own content item progress"
  ON public.lesson_content_item_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content item progress"
  ON public.lesson_content_item_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content item progress"
  ON public.lesson_content_item_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content item progress"
  ON public.lesson_content_item_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to check if all content items in a lesson are completed
CREATE OR REPLACE FUNCTION public.check_lesson_all_content_completed(
  p_user_id uuid,
  p_lesson_id uuid
)
RETURNS boolean AS $$
DECLARE
  total_items integer;
  completed_items integer;
BEGIN
  -- Count total content items for this lesson
  SELECT COUNT(*) INTO total_items
  FROM public.lesson_content_items
  WHERE lesson_id = p_lesson_id;

  -- Count completed content items for this user
  SELECT COUNT(*) INTO completed_items
  FROM public.lesson_content_item_progress
  WHERE user_id = p_user_id
    AND lesson_id = p_lesson_id
    AND is_completed = true;

  -- Return true if all items are completed
  RETURN total_items > 0 AND total_items = completed_items;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark lesson as complete when all content items are done
CREATE OR REPLACE FUNCTION public.mark_lesson_complete_if_all_content_done()
RETURNS TRIGGER AS $$
DECLARE
  all_completed boolean;
BEGIN
  -- Only check when a content item is marked as completed
  IF NEW.is_completed = true THEN
    -- Check if all content items in this lesson are completed
    SELECT public.check_lesson_all_content_completed(NEW.user_id, NEW.lesson_id) INTO all_completed;

    -- If all content is completed, mark the lesson as complete
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

-- Trigger to auto-mark lesson complete when all content items are done
DROP TRIGGER IF EXISTS trg_mark_lesson_complete_on_content_done ON public.lesson_content_item_progress;
CREATE TRIGGER trg_mark_lesson_complete_on_content_done
  AFTER INSERT OR UPDATE ON public.lesson_content_item_progress
  FOR EACH ROW
  WHEN (NEW.is_completed = true)
  EXECUTE FUNCTION public.mark_lesson_complete_if_all_content_done();

-- Comment
COMMENT ON TABLE public.lesson_content_item_progress IS 'Tracks completion of individual content items (videos, quizzes, text) within lessons. Lesson is marked complete only when ALL content items are consumed.';
