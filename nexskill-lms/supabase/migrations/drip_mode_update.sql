-- Add 'after-previous' to the drip_mode check constraint
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_drip_mode_check;

ALTER TABLE modules ADD CONSTRAINT modules_drip_mode_check 
  CHECK (drip_mode IN ('immediate', 'days-after-enrollment', 'specific-date', 'after-previous'));
