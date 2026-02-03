-- Enforces sequential access to lessons within a module
ALTER TABLE modules ADD COLUMN is_sequential boolean DEFAULT false;

-- Drip settings for modules
ALTER TABLE modules ADD COLUMN drip_mode text DEFAULT 'immediate' CHECK (drip_mode IN ('immediate', 'days-after-enrollment', 'specific-date'));
ALTER TABLE modules ADD COLUMN drip_days integer; -- For 'days-after-enrollment'
ALTER TABLE modules ADD COLUMN drip_date timestamptz; -- For 'specific-date'

-- Defines what constitutes "completion" for a lesson
-- Examples:
-- { "type": "view", "min_time_seconds": 60 }
-- { "type": "quiz", "quiz_id": "uuid", "min_score": 80 }
-- { "type": "manual" }
ALTER TABLE lessons ADD COLUMN completion_criteria jsonb DEFAULT '{"type": "view"}';

-- Stores structured learning goals for a course
CREATE TABLE course_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  description text NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for querying goals efficiently
CREATE INDEX idx_course_goals_course ON course_goals(course_id);
