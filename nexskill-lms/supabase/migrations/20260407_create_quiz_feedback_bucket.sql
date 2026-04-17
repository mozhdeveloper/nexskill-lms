-- ============================================
-- Create Quiz Feedback Storage Bucket
-- ============================================

-- 1. Create the quiz-feedback bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-feedback', 'quiz-feedback', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view feedback media
DROP POLICY IF EXISTS "Public Access to Quiz Feedback" ON storage.objects;
CREATE POLICY "Public Access to Quiz Feedback"
ON storage.objects FOR SELECT
USING (bucket_id = 'quiz-feedback');

-- 3. Allow coaches to upload feedback media
DROP POLICY IF EXISTS "Coaches can upload quiz feedback" ON storage.objects;
CREATE POLICY "Coaches can upload quiz feedback"
ON storage.objects FOR INSERT
TO "authenticated"
WITH CHECK (bucket_id = 'quiz-feedback');

-- 4. Allow coaches to manage their feedback media
DROP POLICY IF EXISTS "Coaches can manage quiz feedback" ON storage.objects;
CREATE POLICY "Coaches can manage quiz feedback"
ON storage.objects FOR ALL
TO "authenticated"
USING (bucket_id = 'quiz-feedback')
WITH CHECK (bucket_id = 'quiz-feedback');

-- ============================================
-- Create Course Thumbnails Storage Bucket
-- ============================================

-- 1. Create the course-thumbnails bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view course thumbnails
DROP POLICY IF EXISTS "Public Access to Course Thumbnails" ON storage.objects;
CREATE POLICY "Public Access to Course Thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

-- 3. Allow authenticated users (coaches) to upload course thumbnails
DROP POLICY IF EXISTS "Coaches can upload course thumbnails" ON storage.objects;
CREATE POLICY "Coaches can upload course thumbnails"
ON storage.objects FOR INSERT
TO "authenticated"
WITH CHECK (bucket_id = 'course-thumbnails');

-- 4. Allow coaches to manage course thumbnails
DROP POLICY IF EXISTS "Coaches can manage course thumbnails" ON storage.objects;
CREATE POLICY "Coaches can manage course thumbnails"
ON storage.objects FOR ALL
TO "authenticated"
USING (bucket_id = 'course-thumbnails')
WITH CHECK (bucket_id = 'course-thumbnails');
