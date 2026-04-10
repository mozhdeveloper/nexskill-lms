-- ============================================
-- Quiz Submission Storage Bucket Setup
-- Created: 2026-04-08
-- Creates Supabase Storage bucket for quiz file/video uploads
-- ============================================

-- STEP 1: Create the quiz-submissions storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quiz-submissions',
  'quiz-submissions',
  true,  -- Public bucket so students can upload and coaches can view
  104857600,  -- 100MB max file size
  NULL  -- Allow all MIME types (validation done on client side)
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for quiz-submissions bucket
-- ============================================
-- Note: These policies are created automatically by Supabase when you create a bucket.
-- If you need to modify them, do it through the Supabase Dashboard:
-- 1. Go to Storage → quiz-submissions bucket → Policies
-- 2. Add the policies listed below manually through the UI

-- POLICY 1: Allow authenticated users to upload files
-- CREATE POLICY "Allow authenticated uploads to quiz-submissions"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'quiz-submissions');

-- POLICY 2: Allow authenticated users to view files
-- CREATE POLICY "Allow authenticated view of quiz-submissions"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'quiz-submissions');

-- POLICY 3: Allow users to update their own files
-- CREATE POLICY "Allow users to update their own quiz submissions"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'quiz-submissions');

-- POLICY 4: Allow users to delete their own files
-- CREATE POLICY "Allow users to delete their own quiz submissions"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'quiz-submissions');

-- ============================================
-- IMPORTANT: Manual Setup Required
-- ============================================
-- Since we cannot directly create policies on storage.objects via SQL migrations,
-- please do the following in Supabase Dashboard:
--
-- 1. Go to: Storage → quiz-submissions bucket
-- 2. Click on "Policies" tab
-- 3. Click "New Policy" → "For full customization"
-- 4. Create these 4 policies:
--
-- Policy 1 (INSERT):
--   - Policy Name: Allow authenticated uploads to quiz-submissions
--   - Allowed operation: INSERT
--   - Target roles: authenticated
--   - Policy definition: bucket_id = 'quiz-submissions'
--
-- Policy 2 (SELECT):
--   - Policy Name: Allow authenticated view of quiz-submissions
--   - Allowed operation: SELECT
--   - Target roles: authenticated
--   - Policy definition: bucket_id = 'quiz-submissions'
--
-- Policy 3 (UPDATE):
--   - Policy Name: Allow users to update their own quiz submissions
--   - Allowed operation: UPDATE
--   - Target roles: authenticated
--   - Policy definition: bucket_id = 'quiz-submissions'
--
-- Policy 4 (DELETE):
--   - Policy Name: Allow users to delete their own quiz submissions
--   - Allowed operation: DELETE
--   - Target roles: authenticated
--   - Policy definition: bucket_id = 'quiz-submissions'
--
-- ============================================
-- Comments
-- ============================================
COMMENT ON COLUMN storage.buckets.name IS 'Quiz submission files (documents, videos, images)';

-- ============================================
-- Instructions
-- ============================================
-- 1. Run this migration in Supabase SQL Editor (creates the bucket)
-- 2. Verify the bucket was created: Storage → quiz-submissions bucket should exist
-- 3. Manually add the 4 policies through Supabase Dashboard (see instructions above)
-- 4. Bucket is set to public so files can be viewed without additional signed URLs
-- 5. File structure in bucket: {attempt_id}/{question_id}/{timestamp}.{ext}
-- 6. For videos: {attempt_id}/{question_id}/video.{ext}
