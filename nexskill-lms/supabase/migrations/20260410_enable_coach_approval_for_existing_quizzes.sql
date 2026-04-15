-- ============================================
-- Enable Coach Approval for Existing Quizzes
-- Created: 2026-04-10
-- Sets requires_coach_approval = true for all existing quizzes
-- ============================================

-- Update all existing quizzes to require coach approval
UPDATE quizzes
SET requires_coach_approval = true
WHERE requires_coach_approval IS NULL OR requires_coach_approval = false;

-- Verify the update
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM quizzes WHERE requires_coach_approval = true;
  RAISE NOTICE 'Updated % quizzes to require coach approval', v_count;
END $$;
