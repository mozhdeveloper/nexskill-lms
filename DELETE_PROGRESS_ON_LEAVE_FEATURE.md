# Feature: Delete All Student Progress When Leaving Course

## What Was Added

When a student leaves/unenrolls from a course, **ALL their progress is now automatically deleted**:

### What Gets Deleted:
1. ✅ **Quiz responses** (all answers to quiz questions)
2. ✅ **Quiz submissions** (pending coach reviews)
3. ✅ **Quiz feedback** (coach feedback records)
4. ✅ **Quiz attempts** (all quiz attempt history, scores, grades)
5. ✅ **Lesson progress** (completed lessons, time spent)
6. ✅ **Module progress** (module completion percentages)
7. ✅ **Lesson access status** (lock/unlock records)
8. ✅ **Enrollment** (the course enrollment record)

## Files Changed

### 1. Database Function (SQL)
**File:** `CREATE_DELETE_PROGRESS_ON_LEAVE.sql`

Created a PostgreSQL function `delete_student_course_progress(p_user_id, p_course_id)` that:
- Deletes all progress data for the user in that specific course
- Returns a JSON summary of what was deleted
- Uses `SECURITY DEFINER` to run with elevated privileges
- Safely handles all dependencies (deletes in correct order)

### 2. Frontend Hook
**File:** `src/hooks/useEnrollment.ts`

Updated the `unenroll()` function to:
- Call the cleanup RPC function **before** deleting enrollment
- Check for errors and show appropriate messages
- Log cleanup results for debugging

### 3. UI Updates
**Files:** 
- `src/pages/student/CourseDetailRefactored.tsx`
- `src/pages/student/CourseDetail.tsx`

Updated the "Leave Course" confirmation to:
- Show clear **WARNING** message with ⚠️ icon
- List exactly what will be deleted
- Warn that action CANNOT be undone
- Inform students they'll start from scratch if they re-enroll

## How to Deploy

### Step 1: Run the SQL Script

1. Open **Supabase SQL Editor**
2. Open `CREATE_DELETE_PROGRESS_ON_LEAVE.sql`
3. Run the entire script

This will:
- Create the `delete_student_course_progress` function
- Show verification that function exists

### Step 2: Test It

1. **As a student:**
   - Enroll in a test course
   - Complete some lessons
   - Take a quiz (answer questions)
   - Go to course page
   - Click **"Leave Course"**
   - Read the warning dialog
   - Confirm

2. **Verify:**
   - Check browser console for: `[useEnrollment] Progress cleanup complete: {...}`
   - You should see counts like:
     ```json
     {
       "success": true,
       "quiz_responses_deleted": 5,
       "quiz_attempts_deleted": 2,
       "lesson_progress_deleted": 3,
       "module_progress_deleted": 1,
       "enrollment_deleted": true
     }
     ```

3. **Re-enroll in the same course:**
   - All progress should be gone
   - Quizzes should be untouched (you can retake)
   - Lessons should show as not completed

## User Experience

### Before Leaving:
```
[Student clicks "Leave Course"]
   ↓
[Confirmation dialog appears:]
⚠️ WARNING: Leave Course Name?

By leaving this course, you will:
• Lose ALL your progress (lessons completed, quiz attempts, scores)
• Lose all your quiz answers and submissions
• Lose access to Course Circle discussions
• Lose all feedback and coach review history

This action CANNOT be undone. If you re-enroll later, you'll start from scratch.

Are you sure you want to continue?

[Cancel]  [OK]
```

### After Confirming:
```
[Progress is deleted in database]
   ↓
[Enrollment is deleted]
   ↓
[Success message:]
"You have left Course Name. All your progress has been removed."
```

## Database Function Details

### Function Signature:
```sql
delete_student_course_progress(
  p_user_id UUID,
  p_course_id UUID
) RETURNS JSONB
```

### Return Value:
```json
{
  "success": true,
  "quiz_responses_deleted": 10,
  "quiz_feedback_deleted": 2,
  "quiz_submissions_deleted": 2,
  "quiz_attempts_deleted": 3,
  "lesson_progress_deleted": 5,
  "module_progress_deleted": 2,
  "lesson_access_deleted": 5,
  "enrollment_deleted": true
}
```

### Execution Order:
1. Quiz responses (depends on quiz_attempts)
2. Quiz feedback (depends on quiz_submissions)
3. Quiz submissions (depends on quiz_attempts)
4. Quiz attempts
5. Lesson progress
6. Module progress
7. Lesson access status
8. Enrollment (last, as safety check)

## Error Handling

If the cleanup fails:
- Enrollment is **NOT deleted** (safe failure)
- Error is shown to user
- Console logs the error for debugging
- Student can retry

If cleanup succeeds but enrollment delete fails:
- Progress is already deleted
- Error is shown
- Student can retry (will show 0 items deleted for progress, but enrollment will delete)

## Testing Queries

Run these in Supabase SQL Editor to verify:

```sql
-- Check function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'delete_student_course_progress';

-- Test the function (replace IDs)
SELECT delete_student_course_progress(
  'YOUR_USER_ID'::uuid,
  'YOUR_COURSE_ID'::uuid
);

-- Verify progress was deleted
SELECT 
  'quiz_attempts' as table_name,
  COUNT(*) as count
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
JOIN module_content_items mci ON mci.content_id = q.id
JOIN modules m ON m.id = mci.module_id
WHERE qa.user_id = 'YOUR_USER_ID'
  AND m.course_id = 'YOUR_COURSE_ID'
UNION ALL
SELECT 
  'lesson_progress',
  COUNT(*)
FROM user_lesson_progress ulp
JOIN lessons l ON l.id = ulp.lesson_id
JOIN modules m ON m.id = l.module_id
WHERE ulp.user_id = 'YOUR_USER_ID'
  AND m.course_id = 'YOUR_COURSE_ID';
```

## Important Notes

1. **Irreversible:** Once progress is deleted, it's gone forever
2. **Course-specific:** Only deletes progress for the specific course being left
3. **Other courses unaffected:** Student's progress in other courses remains intact
4. **Re-enrollment:** If student re-enrolls, they start completely from scratch
5. **Coach data:** Coach feedback and review history for that student is also deleted

## Related Features

- Quiz Review System (coach approval workflow)
- Lesson Progress Tracking
- Module Completion System
- Course Enrollment

## Future Enhancements

Possible improvements:
- Add a "pause" option instead of full deletion
- Export progress before leaving (certificate, transcript)
- Soft delete with 30-day grace period
- Admin override to restore deleted progress
