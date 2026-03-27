-- Migration: Auto-set course to pending_review when curriculum is modified
-- Run this in your Supabase SQL Editor at: https://app.supabase.com/project/_/sql

-- This trigger function checks if a course was approved and marks it as pending_review
-- when modules, lessons, quizzes, or module_content_items are modified

-- Function to update course verification status
CREATE OR REPLACE FUNCTION public.update_course_verification_status_on_content_change()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_current_status TEXT;
BEGIN
  -- Determine the course_id based on which table triggered this
  IF TG_TABLE_NAME = 'modules' THEN
    v_course_id := NEW.course_id;
  ELSIF TG_TABLE_NAME = 'module_content_items' THEN
    SELECT course_id INTO v_course_id FROM modules WHERE id = NEW.module_id;
  ELSIF TG_TABLE_NAME IN ('lessons', 'quizzes') THEN
    -- For lessons/quizzes, we need to find the module first
    SELECT module_id INTO v_course_id FROM module_content_items WHERE content_id = NEW.id;
    -- If not in module_content_items, it's a new item, course_id will be set by the calling trigger
  END IF;

  -- If we couldn't determine course_id, exit
  IF v_course_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get current verification status
  SELECT verification_status INTO v_current_status FROM courses WHERE id = v_course_id;

  -- Only update if course was approved
  IF v_current_status = 'approved' THEN
    UPDATE courses 
    SET 
      verification_status = 'pending_review',
      updated_at = NOW()
    WHERE id = v_course_id;
    
    -- Log the change (optional, for audit trail)
    RAISE NOTICE 'Course % marked as pending_review due to content modification', v_course_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for modules table
DROP TRIGGER IF EXISTS trg_modules_content_change ON public.modules;
CREATE TRIGGER trg_modules_content_change
  AFTER INSERT OR UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_verification_status_on_content_change();

-- Create triggers for module_content_items table
DROP TRIGGER IF EXISTS trg_module_content_items_change ON public.module_content_items;
CREATE TRIGGER trg_module_content_items_change
  AFTER INSERT OR UPDATE ON public.module_content_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_verification_status_on_content_change();

-- Function for lessons table (needs to find course via module_content_items)
CREATE OR REPLACE FUNCTION public.update_course_verification_on_lesson_change()
RETURNS TRIGGER AS $$
DECLARE
  v_module_id UUID;
  v_course_id UUID;
  v_current_status TEXT;
BEGIN
  -- Find the module(s) this lesson is linked to
  SELECT module_id INTO v_module_id FROM module_content_items 
  WHERE content_id = NEW.id AND content_type = 'lesson' LIMIT 1;

  IF v_module_id IS NOT NULL THEN
    SELECT course_id INTO v_course_id FROM modules WHERE id = v_module_id;
    
    IF v_course_id IS NOT NULL THEN
      SELECT verification_status INTO v_current_status FROM courses WHERE id = v_course_id;
      
      IF v_current_status = 'approved' THEN
        UPDATE courses 
        SET 
          verification_status = 'pending_review',
          updated_at = NOW()
        WHERE id = v_course_id;
        
        RAISE NOTICE 'Course % marked as pending_review due to lesson modification', v_course_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for quizzes table (needs to find course via module_content_items)
CREATE OR REPLACE FUNCTION public.update_course_verification_on_quiz_change()
RETURNS TRIGGER AS $$
DECLARE
  v_module_id UUID;
  v_course_id UUID;
  v_current_status TEXT;
BEGIN
  -- Find the module(s) this quiz is linked to
  SELECT module_id INTO v_module_id FROM module_content_items 
  WHERE content_id = NEW.id AND content_type = 'quiz' LIMIT 1;

  IF v_module_id IS NOT NULL THEN
    SELECT course_id INTO v_course_id FROM modules WHERE id = v_module_id;
    
    IF v_course_id IS NOT NULL THEN
      SELECT verification_status INTO v_current_status FROM courses WHERE id = v_course_id;
      
      IF v_current_status = 'approved' THEN
        UPDATE courses 
        SET 
          verification_status = 'pending_review',
          updated_at = NOW()
        WHERE id = v_course_id;
        
        RAISE NOTICE 'Course % marked as pending_review due to quiz modification', v_course_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for lessons table
DROP TRIGGER IF EXISTS trg_lessons_change ON public.lessons;
CREATE TRIGGER trg_lessons_change
  AFTER INSERT OR UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_verification_on_lesson_change();

-- Create triggers for quizzes table
DROP TRIGGER IF EXISTS trg_quizzes_change ON public.quizzes;
CREATE TRIGGER trg_quizzes_change
  AFTER INSERT OR UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_verification_on_quiz_change();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_verification_status ON courses(verification_status);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_module_content_items_module_id ON module_content_items(module_id);
CREATE INDEX IF NOT EXISTS idx_module_content_items_content_id ON module_content_items(content_id);

COMMENT ON FUNCTION public.update_course_verification_status_on_content_change() IS 
  'Automatically sets course verification_status to pending_review when curriculum content is modified';
COMMENT ON FUNCTION public.update_course_verification_on_lesson_change() IS 
  'Automatically sets course verification_status to pending_review when lessons are modified';
COMMENT ON FUNCTION public.update_course_verification_on_quiz_change() IS 
  'Automatically sets course verification_status to pending_review when quizzes are modified';
