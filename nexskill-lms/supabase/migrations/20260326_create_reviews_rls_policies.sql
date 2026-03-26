-- RLS Policies for reviews table
-- Run this migration after creating the reviews table

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view published course reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view own review" ON reviews;
DROP POLICY IF EXISTS "Users can insert own review" ON reviews;
DROP POLICY IF EXISTS "Users can update own review" ON reviews;
DROP POLICY IF EXISTS "Users can delete own review" ON reviews;
DROP POLICY IF EXISTS "Coaches can view reviews for their courses" ON reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;

-- ============================================
-- SELECT POLICIES (Reading Reviews)
-- ============================================

-- Policy 1: Anyone can view reviews for published courses
-- This allows prospective students to read reviews before enrolling
CREATE POLICY "Anyone can view published course reviews"
ON reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = reviews.course_id
    AND c.is_published = true
  )
);

-- Policy 2: Users can always view their own review
CREATE POLICY "Users can view own review"
ON reviews
FOR SELECT
USING (
  auth.uid() = profile_id
);

-- Policy 3: Coaches can view reviews for their courses
CREATE POLICY "Coaches can view reviews for their courses"
ON reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = reviews.course_id
    AND c.coach_id = auth.uid()
  )
);

-- Policy 4: Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- ============================================
-- INSERT POLICIES (Creating Reviews)
-- ============================================

-- Policy 1: Users can insert their own review
-- Only if they are enrolled in the course
CREATE POLICY "Users can insert own review"
ON reviews
FOR INSERT
WITH CHECK (
  auth.uid() = profile_id
  AND EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.profile_id = auth.uid()
    AND e.course_id = reviews.course_id
  )
);

-- Policy 2: Admins can insert reviews (for moderation purposes)
CREATE POLICY "Admins can insert reviews"
ON reviews
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- ============================================
-- UPDATE POLICIES (Editing Reviews)
-- ============================================

-- Policy 1: Users can update their own review
CREATE POLICY "Users can update own review"
ON reviews
FOR UPDATE
USING (
  auth.uid() = profile_id
);

-- Policy 2: Admins can update any review (for moderation)
CREATE POLICY "Admins can update any review"
ON reviews
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- ============================================
-- DELETE POLICIES (Removing Reviews)
-- ============================================

-- Policy 1: Users can delete their own review
CREATE POLICY "Users can delete own review"
ON reviews
FOR DELETE
USING (
  auth.uid() = profile_id
);

-- Policy 2: Admins can delete any review (for moderation)
CREATE POLICY "Admins can delete any review"
ON reviews
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- ============================================
-- HELPER FUNCTIONS FOR COACH ANALYTICS
-- ============================================

-- Function to get review stats for a coach's courses
CREATE OR REPLACE FUNCTION get_coach_review_stats(coach_id UUID)
RETURNS TABLE (
  course_id UUID,
  course_title TEXT,
  average_rating NUMERIC,
  total_reviews BIGINT,
  rating_5 BIGINT,
  rating_4 BIGINT,
  rating_3 BIGINT,
  rating_2 BIGINT,
  rating_1 BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    COALESCE(AVG(r.rating), 0)::NUMERIC(3,2) as average_rating,
    COUNT(r.id) as total_reviews,
    COUNT(CASE WHEN r.rating = 5 THEN 1 END) as rating_5,
    COUNT(CASE WHEN r.rating = 4 THEN 1 END) as rating_4,
    COUNT(CASE WHEN r.rating = 3 THEN 1 END) as rating_3,
    COUNT(CASE WHEN r.rating = 2 THEN 1 END) as rating_2,
    COUNT(CASE WHEN r.rating = 1 THEN 1 END) as rating_1
  FROM courses c
  LEFT JOIN reviews r ON r.course_id = c.id
  WHERE c.coach_id = coach_id
  GROUP BY c.id, c.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent reviews for a coach's courses
CREATE OR REPLACE FUNCTION get_coach_recent_reviews(coach_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  review_id UUID,
  course_id UUID,
  course_title TEXT,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ,
  user_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as review_id,
    r.course_id,
    c.title as course_title,
    r.rating,
    r.comment,
    r.created_at,
    CONCAT(p.first_name, ' ', p.last_name) as user_name
  FROM reviews r
  INNER JOIN courses c ON r.course_id = c.id
  INNER JOIN profiles p ON r.profile_id = p.id
  WHERE c.coach_id = coach_id
  ORDER BY r.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify policies were created:
-- SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'reviews'
-- ORDER BY policyname;

-- ============================================
-- USAGE EXAMPLES FOR COACHES
-- ============================================
-- Get review stats for all your courses:
-- SELECT * FROM get_coach_review_stats(auth.uid());

-- Get recent reviews for your courses:
-- SELECT * FROM get_coach_recent_reviews(auth.uid(), 20);
