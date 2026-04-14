# Quick Fix Guide: Quiz Review Not Appearing

## What Was Wrong

**CRITICAL BUG FOUND:** When students completed a coach-reviewed quiz, the system was setting the status to `'graded'` instead of `'submitted'`. The database trigger that creates quiz submissions only fires when status = `'submitted'`, so **no submission record was being created**.

This happened for coach-reviewed quizzes that only had multiple-choice or true-false questions (no file uploads or video submissions).

## What I Fixed

### 1. **QuizSession.tsx** (Main Fix)
Changed the logic to ALWAYS use `'submitted'` status for coach-reviewed quizzes:
```typescript
// OLD (WRONG):
let finalStatus = requiresManualGrading ? 'submitted' : 'graded';

// NEW (CORRECT):
const isCoachReviewed = quizMeta.requires_coach_approval;
let finalStatus = requiresManualGrading || isCoachReviewed ? 'submitted' : 'graded';
```

### 2. **CourseBuilder.tsx** (Supporting Fix)
Added missing `quiz_type` field to quiz save logic to ensure data consistency.

## What You Need to Do NOW

### Step 1: Fix Existing Data in Supabase

**⚠️ IMPORTANT: Run this script FIRST!**

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: **`RUN_THIS_FIRST_QUIZ_REVIEW_FIX.sql`**
4. Run the entire script

This script will:
- ✅ Add the missing `quiz_type` column to your database
- ✅ Set up the enhanced database trigger
- ✅ Create missing quiz_submissions for your existing student attempts
- ✅ Fix any attempts that have wrong status ('graded' instead of 'submitted')
- ✅ Show you verification queries to confirm everything works

### Step 2: Test the Fix

1. **As Coach:**
   - Edit one of your quizzes
   - Make sure "Coach Review" is enabled
   - Save the quiz

2. **As Student:**
   - Open that quiz
   - Answer the questions
   - Click Submit
   - You should see "Waiting for Coach Review"

3. **As Coach:**
   - Go to "Quiz Reviews" in the sidebar
   - You should now see the student's submission!
   - Click to review it
   - Approve or request changes

## How to Verify It Worked

Run this query in Supabase SQL Editor:

```sql
-- Check if coach-reviewed quizzes now have submissions
SELECT 
    qs.id as submission_id,
    qs.status,
    qs.submitted_at,
    q.title as quiz_title,
    q.requires_coach_approval,
    q.quiz_type,
    p.email as student_email
FROM quiz_submissions qs
JOIN quizzes q ON q.id = qs.quiz_id
JOIN profiles p ON p.id = qs.user_id
WHERE q.requires_coach_approval = true OR q.quiz_type = 'coach_reviewed'
ORDER BY qs.submitted_at DESC
LIMIT 10;
```

You should see your quiz submissions listed here!

## Why This Happened

The original code only set status to `'submitted'` if the quiz had:
- File upload questions, OR
- Video submission questions, OR
- Manual grading flag enabled

For a coach-reviewed quiz with only multiple-choice questions, none of these were true, so it got status `'graded'` instead. The database trigger ignores `'graded'` status (it's meant for auto-graded standard quizzes), so no submission was created.

## The Complete Flow Now

```
Student opens coach-reviewed quiz
  ↓
Student answers questions and clicks Submit
  ↓
Frontend checks: requires_coach_approval = true?
  ↓ YES
Sets status = 'submitted' ✅
  ↓
Database trigger fires (checks status = 'submitted')
  ↓
Creates quiz_submissions record with status 'pending_review' ✅
  ↓
Student sees "Waiting for Coach Review"
  ↓
Coach opens Quiz Reviews dashboard
  ↓
Submission appears in the list ✅
  ↓
Coach reviews and approves/rejects
  ↓
Student gets feedback and can proceed
```

## Files Changed

1. `src/pages/student/QuizSession.tsx` - Fixed status logic
2. `src/pages/coach/CourseBuilder.tsx` - Added quiz_type to save logic
3. `FIX_QUIZ_REVIEW_NOT_APPEARING.sql` - SQL script to fix existing data
4. `DIAGNOSE_QUIZ_REVIEW_FETCH.sql` - Diagnostic queries
5. `QUIZ_REVIEW_NOT_APPEARING_FIX.md` - Complete documentation

## Need Help?

If submissions still don't appear after running the SQL fix:

1. Check the diagnostic script: `DIAGNOSE_QUIZ_REVIEW_FETCH.sql`
2. Look at STEP 4 to find attempts without submissions
3. Look at STEP 8 to manually fix quiz_type values
4. Look at STEP 9 to recreate the database trigger if needed
