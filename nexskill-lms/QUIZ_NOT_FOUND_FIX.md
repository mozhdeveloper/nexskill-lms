# Quiz Not Found - Complete Fix Guide

## Problem

The quiz session shows "Quiz Not Available" and the console logs:
```
QuizSession: Quiz not found in database: 3918a3b8-a14d-483d-b206-43ddf85c8eda
```

## Root Cause

The quiz ID `3918a3b8-a14d-483d-b206-43ddf85c8eda` exists in `lesson_content_items` or `module_content_items` but the actual quiz row in the `quizzes` table is **missing**.

This happens when:
1. Quiz creation partially failed (content item was created but quiz row wasn't)
2. Database transaction error during quiz creation
3. Race condition during concurrent quiz creation
4. Manual deletion of quiz row without removing content item

## Quick Fix (5 minutes)

### Step 1: Run the Fix SQL

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `FIX_MISSING_QUIZ.sql` (in the project root)
4. Copy ALL content and paste into SQL Editor
5. Click **Run**

### Step 2: Check the Results

After running the SQL, check the output panel at the bottom:

**If you see "✅ COMPLETE - Quiz is ready":**
- ✅ The quiz has been created/fixed
- ✅ RLS policies are updated
- Go back to your app and refresh
- The quiz should now work!

**If you see "⚠️ Quiz has NO questions":**
- ✅ The quiz row now exists
- ⚠️ You need to add questions through the Coach Quiz Editor
- Log in as coach → Go to course → Edit quiz → Add questions

### Step 3: Verify the Fix

1. Refresh your browser (hard refresh: Ctrl+Shift+R)
2. Navigate to the course again
3. Click on the quiz
4. Check browser console - you should see:
   ```
   QuizSession: Successfully fetched quiz: [Quiz Title] [quiz-id]
   ```

## What the Fix SQL Does

1. **Diagnoses** the problem - checks if content item exists but quiz doesn't
2. **Finds orphaned content items** - shows all quiz content items without quiz rows
3. **Creates the missing quiz** - inserts the quiz with the correct ID, title, and settings
4. **Fixes RLS policies** - removes conflicting policies and creates clean ones
5. **Verifies everything** - confirms quiz exists and is accessible

## Manual Alternative Fix

If you prefer to fix it manually through the Coach interface:

### Option A: Delete and Recreate the Quiz

1. **Log in as Coach/Admin**
2. Go to **Course Builder** for the course
3. Find the lesson that contains the quiz
4. Delete the quiz content item
5. Create a new quiz (this will create both the quiz row and content item properly)
6. Add questions to the new quiz
7. Publish the quiz

### Option B: Create Quiz via SQL Manually

```sql
-- Create the missing quiz
INSERT INTO quizzes (
    id,
    title,
    description,
    lesson_id,
    passing_score,
    time_limit_minutes,
    max_attempts,
    is_published,
    requires_coach_approval,
    requires_manual_grading,
    late_submission_allowed,
    late_penalty_percent,
    created_at,
    updated_at
) VALUES (
    '3918a3b8-a14d-483d-b206-43ddf85c8eda',
    'Your Quiz Title',  -- CHANGE THIS
    'Quiz description',  -- CHANGE THIS
    (SELECT lesson_id FROM lesson_content_items WHERE content_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda' LIMIT 1),
    70,
    NULL,
    NULL,
    true,
    true,
    false,
    false,
    0,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    lesson_id = EXCLUDED.lesson_id,
    updated_at = NOW();
```

## Understanding the Database Structure

### How Quizzes Should Be Created

```
Step 1: Create quiz row in "quizzes" table
   ↓
Step 2: Create content item in "lesson_content_items" or "module_content_items"
   ↓
Step 3: Link them via content_id = quiz.id
```

### What Went Wrong

```
Step 1: ❌ FAILED - Quiz row not created
   ↓
Step 2: ✅ SUCCESS - Content item created
   ↓
Result: Orphaned content item pointing to non-existent quiz
```

## Prevention

To prevent this issue in the future, the code now:

1. ✅ **Detects orphaned content items** - Logs helpful error messages
2. ✅ **Better error messages** - Shows exactly what's wrong
3. ✅ **Provides fix instructions** - Tells you which SQL file to run

### Code Changes Made

**File: `QuizSession.tsx`**
- Added detection of orphaned content items
- Logs detailed diagnostic information
- Shows helpful error messages to admins/coaches

**File: `FIX_MISSING_QUIZ.sql`**
- One-click fix for missing quizzes
- Creates quiz with correct metadata
- Fixes RLS policies
- Verifies the fix worked

## Troubleshooting

### "Quiz still not found after running SQL"

1. Check if the SQL ran successfully (look for errors in Supabase)
2. Hard refresh your browser (Ctrl+Shift+R)
3. Clear browser cache
4. Check browser console for new error messages

### "Permission denied" when running SQL

- Make sure you're in **Supabase SQL Editor** (not your app code)
- You need to be logged into Supabase as a project admin

### "Quiz has no questions"

- The quiz row now exists, but you need to add questions
- Go to Coach interface → Course Builder → Edit the quiz
- Add questions and save

### Multiple orphaned quizzes

The SQL will show you ALL orphaned content items. You can fix them all at once by running the INSERT statements for each one.

## Next Steps After Fix

1. ✅ Verify quiz works for students
2. ✅ Add questions if quiz doesn't have any
3. ✅ Test quiz submission flow
4. ✅ Check that scores are calculated correctly
5. ✅ Verify coach approval flow (if enabled)

## Files Created for This Fix

| File | Purpose |
|------|---------|
| `FIX_MISSING_QUIZ.sql` | One-click fix for missing quiz |
| `COMPLETE_QUIZ_FIX.sql` | Comprehensive RLS policy fix |
| `HOW_TO_FIX_QUIZ_ERROR.md` | Step-by-step guide |
| `QUIZ_NOT_FOUND_FIX.md` | This file |

## Developer Notes

### Why This Happened

Looking at the quiz creation flow in `CourseBuilder.tsx` and `CurriculumEditor.tsx`:

```typescript
// CourseBuilder.tsx line 947
const quizId = uuidv4();

// Insert quiz
const { error: quizError } = await supabase
  .from("quizzes")
  .insert([{ ...newQuiz, lesson_id: lessonId }]);

// If quiz insert fails but content item insert succeeds → orphaned content item
```

The creation is **not wrapped in a transaction**, so if the quiz insert fails but the content item insert succeeds, you get an orphaned content item.

### Future Prevention

Consider wrapping quiz creation in a transaction:

```typescript
const { error } = await supabase.rpc('create_quiz_with_content_item', {
  p_quiz_id: quizId,
  p_quiz_title: title,
  p_lesson_id: lessonId,
  // ... other params
});
```

This ensures atomicity - either both rows are created or neither is.
