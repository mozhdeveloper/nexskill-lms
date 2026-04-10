# Quiz Approval System - Setup Instructions

## 🚨 IMPORTANT: Required Setup Steps

### Step 1: Run Database Migration

You MUST run the database migration before the quiz approval system will work.

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/20260407_quiz_approval_system.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute the migration

**Option B: Using Supabase CLI**
```bash
cd "C:\Users\John Marco\Desktop\nex skill\nexskill-lms\nexskill-lms"
npx supabase db push
```

### Step 2: Create Supabase Storage Bucket for Feedback Media

The coach feedback system allows uploading images, videos, and documents. You need to create a storage bucket.

**Using Supabase Dashboard:**
1. Go to your Supabase project dashboard
2. Navigate to **Storage**
3. Click **New bucket**
4. Bucket name: `quiz-feedback`
5. Toggle **Public bucket** to **ON** (this allows students to view feedback media)
6. Click **Create bucket**

**Using SQL:**
```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-feedback', 'quiz-feedback', true);

-- Set up RLS policies for the bucket
CREATE POLICY "Students can view quiz feedback media"
ON storage.objects FOR SELECT
USING (bucket_id = 'quiz-feedback');

CREATE POLICY "Coaches can upload quiz feedback media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'quiz-feedback' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Coaches can update their own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'quiz-feedback' AND owner = auth.uid());

CREATE POLICY "Coaches can delete their own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'quiz-feedback' AND owner = auth.uid());
```

### Step 3: Update Quiz Configuration (Optional)

By default, existing quizzes have `requires_coach_approval = false`. To enable the approval system for specific quizzes:

**Update a specific quiz:**
```sql
UPDATE quizzes 
SET requires_coach_approval = true 
WHERE id = 'your-quiz-id-here';
```

**Update all quizzes in a course:**
```sql
UPDATE quizzes
SET requires_coach_approval = true
WHERE id IN (
  SELECT mci.content_id
  FROM module_content_items mci
  INNER JOIN modules m ON m.id = mci.module_id
  WHERE m.course_id = 'your-course-id-here'
    AND mci.content_type = 'quiz'
);
```

## ✅ Verification Checklist

After completing the setup, verify everything works:

### Database Verification
- [ ] Run this query in Supabase SQL Editor to verify tables exist:
  ```sql
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('quiz_submissions', 'quiz_feedback', 'lesson_access_status');
  ```
  Should return 3 rows.

- [ ] Verify new columns exist on quizzes table:
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'quizzes' 
    AND column_name = 'requires_coach_approval';
  ```
  Should return 1 row with `boolean` type.

- [ ] Verify triggers are active:
  ```sql
  SELECT trigger_name, event_manipulation, event_object_table
  FROM information_schema.triggers
  WHERE trigger_name IN ('trg_create_quiz_submission', 'trg_unlock_next_lesson');
  ```
  Should return 2 rows.

### Storage Verification
- [ ] Check bucket exists:
  ```sql
  SELECT id, name, public 
  FROM storage.buckets 
  WHERE id = 'quiz-feedback';
  ```
  Should return 1 row with `public = true`.

### Frontend Verification
- [ ] Start the development server
- [ ] Check browser console for any errors
- [ ] Verify new routes are accessible:
  - `/student/courses/:courseId/quizzes/:quizId/feedback` (Student feedback view)
  - `/coach/courses/:courseId/quiz-reviews` (Coach review dashboard)
  - `/coach/courses/:courseId/quiz-reviews/:submissionId` (Coach review detail)

## 🎯 Quick Test Flow

### Test the Complete Flow:

1. **Create a Test Quiz:**
   - As a coach, create a quiz in a course
   - Update the quiz to require approval:
     ```sql
     UPDATE quizzes SET requires_coach_approval = true WHERE id = 'quiz-id';
     ```

2. **Student Takes Quiz:**
   - Log in as a student
   - Enroll in the course
   - Take the quiz and submit it
   - Verify "Pending Coach Review" status appears

3. **Coach Reviews Quiz:**
   - Log in as the coach
   - Navigate to `/coach/courses/:courseId/quiz-reviews`
   - Click on the pending submission
   - Review responses and add feedback
   - Mark as "Pass" or "Fail"

4. **Verify Lesson Unlock:**
   - As the student, check if the next lesson unlocked (if passed)
   - View the coach feedback at `/student/courses/:courseId/quizzes/:quizId/feedback`

## 🐛 Troubleshooting

### Error: "relation quiz_submissions does not exist"
- **Cause:** Migration hasn't been run
- **Solution:** Run the database migration (Step 1)

### Error: "Bucket quiz-feedback not found"
- **Cause:** Storage bucket hasn't been created
- **Solution:** Create the bucket (Step 2)

### Error: "Permission denied" when uploading media
- **Cause:** Storage policies not set up correctly
- **Solution:** Run the SQL policies from Step 2

### Lessons not unlocking automatically
- **Cause:** Trigger might not be active
- **Solution:** Verify triggers are active and check `lesson_access_status` table for updates

### Student can't see feedback
- **Cause:** RLS policy issue
- **Solution:** Verify the RLS policies in the migration file were applied correctly

## 📚 Additional Resources

- Full implementation details: `QUIZ_APPROVAL_IMPLEMENTATION.md`
- Database migration file: `supabase/migrations/20260407_quiz_approval_system.sql`
- TypeScript types: `src/types/quiz.ts`
- Custom hooks: `src/hooks/useQuizSubmission.ts`

## 🎉 You're All Set!

Once you've completed these steps, the Quiz Approval & Sequential Lesson Lock system will be fully operational. Coaches can review student quizzes and provide rich feedback with media attachments, while students progress through courses in a controlled, sequential manner.
