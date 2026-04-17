-- ============================================
-- Create Quiz Feedback Storage Bucket
-- ============================================

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-feedback', 'quiz-feedback', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (usually enabled by default in Supabase)

-- 3. Policy: Allow public to view feedback media (required for getPublicUrl to work)
CREATE POLICY "Public Access to Quiz Feedback"
ON storage.objects FOR SELECT
USING (bucket_id = 'quiz-feedback');

-- 4. Policy: Allow authenticated users (coaches) to upload feedback media
CREATE POLICY "Coaches can upload quiz feedback"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quiz-feedback');

-- 5. Policy: Allow coaches to delete/update feedback media
CREATE POLICY "Coaches can manage quiz feedback"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'quiz-feedback')
WITH CHECK (bucket_id = 'quiz-feedback');
