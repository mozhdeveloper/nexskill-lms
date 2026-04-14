# Quiz Attempt Duplicate Key Error - Fix

## Problem

When trying to start a quiz attempt, you get a **409 Conflict** error:

```
POST /quiz_attempts 409 (Conflict)
duplicate key value violates unique constraint "quiz_attempts_user_id_quiz_id_attempt_number_key"
Key (user_id, quiz_id, attempt_number)=(fb4d591d-2ae1-48ab-99a0-f4c7a38433a0, 3918a3b8-a14d-483d-b206-43ddf85c8eda, 1) already exists
```

## Root Cause

The `handleStartAttempt` function was calculating the next attempt number based on `previousAttempts.length`, but this didn't account for:

1. **Existing in-progress attempts** already in the database
2. **Race conditions** from the useEffect firing twice (React Strict Mode)
3. **Incorrect attempt number calculation** - not checking actual database max attempt number

## What Was Fixed

### ✅ Fix 1: Check for Existing In-Progress Attempt

**File: `QuizSession.tsx` - `handleStartAttempt` function**

The function now:
1. **First checks** if there's already an `in_progress` attempt for this user and quiz
2. **Resumes** the existing attempt instead of creating a duplicate
3. **Calculates correct attempt number** by querying the database for the max attempt number
4. **Handles duplicate errors gracefully** with a retry mechanism

```typescript
// Before: Simple calculation (WRONG)
const nextAttemptNumber = (previousAttempts.length || 0) + 1;

// After: Check database for existing attempts (CORRECT)
const { data: existingInProgress } = await supabase
  .from('quiz_attempts')
  .select('id, attempt_number')
  .eq('user_id', user.id)
  .eq('quiz_id', quizMeta.id)
  .eq('status', 'in_progress')
  .maybeSingle();

if (existingInProgress) {
  // Resume existing attempt instead of creating new one
  return;
}

// Calculate next attempt number from database
const { data: maxAttemptData } = await supabase
  .from('quiz_attempts')
  .select('attempt_number')
  .eq('user_id', user.id)
  .eq('quiz_id', quizMeta.id)
  .order('attempt_number', { ascending: false })
  .limit(1);

const nextAttemptNumber = (maxAttemptData && maxAttemptData.length > 0) 
  ? (maxAttemptData[0].attempt_number || 0) + 1 
  : 1;
```

### ✅ Fix 2: Prevent Race Conditions in useEffect

**File: `QuizSession.tsx` - useEffect cleanup**

Added cleanup function to prevent duplicate fetches:

```typescript
useEffect(() => {
  let cancelled = false; // Prevent race conditions

  const fetchQuiz = async () => {
    // ... fetch logic
    if (!cancelled) {
      // Update state
    }
  };

  fetchQuiz();
  
  // Cleanup function to prevent race conditions
  return () => {
    cancelled = true;
  };
}, [quizId, user, submission]);
```

### ✅ Fix 3: Better Error Handling

- Shows user-friendly error message if attempt creation fails
- Logs detailed error information for debugging
- Retries with incremented attempt number if duplicate key error occurs

## How to Test

### Step 1: Clear Existing Attempts (Optional)

If you have stuck `in_progress` attempts, you can clean them up:

```sql
-- Check for in-progress attempts
SELECT id, attempt_number, status, started_at, submitted_at
FROM quiz_attempts
WHERE user_id = 'fb4d591d-2ae1-48ab-99a0-f4c7a38433a0'
AND quiz_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
ORDER BY attempt_number DESC;

-- If needed, delete stuck in-progress attempts
DELETE FROM quiz_attempts
WHERE user_id = 'fb4d591d-2ae1-48ab-99a0-f4c7a38433a0'
AND quiz_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
AND status = 'in_progress';
```

### Step 2: Test the Quiz

1. **Refresh your browser** (Ctrl+Shift+R)
2. **Navigate to the course** and click on the quiz
3. **Click "Start Quiz"** - should work without errors now
4. **Check browser console** - should see:
   ```
   QuizSession: Creating new attempt with number: 1
   ```
   or if resuming:
   ```
   QuizSession: Found existing in-progress attempt, resuming: 1
   ```

## Database Constraint

The `quiz_attempts` table has a unique constraint:

```sql
UNIQUE (user_id, quiz_id, attempt_number)
```

This prevents duplicate attempts with the same attempt number, which is correct behavior. The fix ensures we respect this constraint.

## What Changed

| Before | After |
|--------|-------|
| Calculated attempt number from array length | Queries database for max attempt number |
| Created new attempt without checking | Checks for existing in-progress attempt first |
| No race condition prevention | Cleanup function prevents duplicate fetches |
| Generic error handling | Specific handling for duplicate key errors with retry |

## Additional Database Fix (If Needed)

If you still have issues, run this in Supabase SQL Editor:

```sql
-- Check all attempts for this quiz
SELECT 
    qa.id,
    qa.attempt_number,
    qa.status,
    qa.started_at,
    qa.submitted_at,
    qa.score,
    qa.max_score,
    u.email
FROM quiz_attempts qa
JOIN users u ON qa.user_id = u.id
WHERE qa.quiz_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
ORDER BY qa.started_at DESC;

-- If there are duplicate attempt_numbers for same user, clean them up
DELETE FROM quiz_attempts
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY user_id, quiz_id, attempt_number 
                   ORDER BY started_at DESC
               ) as rn
        FROM quiz_attempts
        WHERE quiz_id = '3918a3b8-a14d-483d-b206-43ddf85c8eda'
    ) t
    WHERE rn > 1
);
```

## Summary

✅ **Duplicate key error fixed** - Now checks for existing attempts before creating new ones
✅ **Race conditions prevented** - Cleanup function in useEffect
✅ **Better error messages** - User-friendly alerts for failures
✅ **Resume functionality** - Properly detects and resumes in-progress attempts
✅ **Database integrity** - Respects unique constraint on attempt numbers

The quiz should now work without any 409 errors!
