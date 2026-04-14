-- ============================================
-- URGENT FIX: Add Missing quiz_type Column
-- Run this FIRST before any other diagnostic
-- ============================================

-- This adds the quiz_type column that the migration 20260413 creates
-- Run this in your Supabase SQL Editor

-- STEP 1: Add the quiz_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'quiz_type'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN quiz_type TEXT CHECK (quiz_type IN ('standard', 'coach_reviewed')) DEFAULT 'standard';
    RAISE NOTICE 'Added quiz_type column to quizzes table';
  ELSE
    RAISE NOTICE 'quiz_type column already exists';
  END IF;
END $$;

-- STEP 2: Add attempt_control_enabled if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'attempt_control_enabled'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN attempt_control_enabled BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added attempt_control_enabled column to quizzes table';
  ELSE
    RAISE NOTICE 'attempt_control_enabled column already exists';
  END IF;
END $$;

-- STEP 3: Add allow_skipped_questions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'allow_skipped_questions'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN allow_skipped_questions BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added allow_skipped_questions column to quizzes table';
  ELSE
    RAISE NOTICE 'allow_skipped_questions column already exists';
  END IF;
END $$;

-- STEP 4: Update existing quizzes to set quiz_type based on requires_coach_approval
UPDATE quizzes
SET quiz_type = CASE
  WHEN requires_coach_approval = true THEN 'coach_reviewed'
  ELSE 'standard'
END
WHERE quiz_type IS NULL;

-- STEP 5: Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'quizzes'
  AND column_name IN ('quiz_type', 'attempt_control_enabled', 'allow_skipped_questions', 'requires_coach_approval')
ORDER BY column_name;

-- STEP 6: Check your quizzes now have quiz_type set
SELECT 
    id,
    title,
    requires_coach_approval,
    quiz_type,
    updated_at
FROM quizzes
ORDER BY updated_at DESC
LIMIT 20;

-- ============================================
-- AFTER RUNNING THIS:
-- 1. Check STEP 5 output to confirm columns exist
-- 2. Check STEP 6 output to see quiz_type values
-- 3. Then run FIX_QUIZ_REVIEW_NOT_APPEARING.sql
-- 4. Then run DIAGNOSE_QUIZ_REVIEW_FETCH.sql if needed
-- ============================================
