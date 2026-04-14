# Quiz Review Not Appearing in Coach Dashboard - Complete Fix

## Problem Description

When a coach enables "Coach Review" on a quiz in the Quiz Builder, students can complete the quiz and see "Waiting for Review" message. However, **the submission does NOT appear in the coach's Quiz Review Dashboard**, making it impossible for coaches to review and approve student submissions.

## Root Cause Analysis

### CRITICAL BUG: Wrong Status for Coach-Reviewed Quizzes

**The Main Problem:** When a student completes a coach-reviewed quiz, the frontend code was setting `quiz_attempts.status = 'graded'` instead of `'submitted'`.

**Why This Happened:**

In `QuizSession.tsx` (line 913), the code determined the status like this:
```typescript
let finalStatus: 'submitted' | 'graded' = requiresManualGrading ? 'submitted' : 'graded';
```

This meant:
- If quiz has file-upload/video questions → `requiresManualGrading = true` → status = `'submitted'` ✅
- If quiz has ONLY multiple-choice/true-false questions → `requiresManualGrading = false` → status = `'graded'` ❌

**The Database Trigger Only Fires on `'submitted'`:**
```sql
CREATE TRIGGER trg_create_quiz_submission_enhanced
  AFTER UPDATE OF status ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION create_quiz_submission_on_submit_enhanced();
```

The trigger checks:
```sql
IF NEW.status != 'submitted' OR (OLD.status IS NOT NULL AND OLD.status = 'submitted') THEN
  RETURN NEW;  -- Early exit, does nothing
END IF;
```

**Result:** Coach-reviewed quizzes with only multiple-choice/true-false questions:
1. Student completes quiz
2. Frontend sets status = `'graded'` (wrong!)
3. Database trigger fires but exits immediately (status != 'submitted')
4. **NO quiz_submissions record is created**
5. Coach never sees the submission ❌

### Secondary Issue: Missing `quiz_type` Field in Save Logic

The quiz settings UI (`QuizSettings.tsx`) correctly sets both:
- `quiz_type: "coach_reviewed"` 
- `requires_coach_approval: true`

However, when the coach saves the quiz in `CourseBuilder.tsx`, the `safeQuizData` object **only saved `requires_coach_approval`** but **did NOT save `quiz_type`** to the database.

**What happened:**
1. Coach opens quiz settings
2. Coach toggles "Coach-Reviewed" mode
3. UI sets `quiz_type: "coach_reviewed"` + `requires_coach_approval: true`
4. Coach saves quiz
5. **BUG:** `CourseBuilder.tsx` only saved `requires_coach_approval: true`
6. **BUG:** `quiz_type` was **NOT saved** (remained NULL or old value)
7. Database trigger checks `quiz_type` OR `requires_coach_approval` (works due to OR condition)
8. **BUT:** Any code that relies solely on `quiz_type` would fail

### Why This Caused Problems

The database trigger `create_quiz_submission_on_submit_enhanced()` checks:
```sql
v_coach_review_quiz := v_quiz_config.quiz_type = 'coach_reviewed'
                       OR v_quiz_config.requires_coach_approval = true;
```

While this should work with just `requires_coach_approval = true`, there are potential issues:
- Inconsistent data state (two fields out of sync)
- Future code might rely only on `quiz_type`
- Existing quizzes might have NULL `quiz_type` values
- Debugging becomes confusing

### Secondary Issue: Existing Quizzes Not Updated

When the migration `20260413_quiz_system_enhancements.sql` was run, it attempted to sync existing quizzes:
```sql
UPDATE quizzes
SET quiz_type = CASE
  WHEN requires_coach_approval = true THEN 'coach_reviewed'
  ELSE 'standard'
END
WHERE quiz_type IS NULL OR quiz_type = 'standard';
```

However, this migration might not have run successfully, or new quizzes created before the fix had inconsistent states.

## Files Fixed

### 1. `src/pages/student/QuizSession.tsx` (CRITICAL FIX)

#### Change: Quiz Submission Status Logic (Line 911-917)

**Before:**
```typescript
const scorePercent = totalPoints > 0 ? Math.round((finalScore / totalPoints) * 100) : 0;
const passed = scorePercent >= quizMeta.passing_score;

let finalStatus: 'submitted' | 'graded' = requiresManualGrading ? 'submitted' : 'graded';
```

**After:**
```typescript
const scorePercent = totalPoints > 0 ? Math.round((finalScore / totalPoints) * 100) : 0;
const passed = scorePercent >= quizMeta.passing_score;

// CRITICAL: For coach-reviewed quizzes, ALWAYS use 'submitted' status
// so the database trigger creates a quiz_submissions record for coach review.
// Standard quizzes without coach approval use 'graded' for auto-grading.
const isCoachReviewed = quizMeta.requires_coach_approval;
let finalStatus: 'submitted' | 'graded' = requiresManualGrading || isCoachReviewed ? 'submitted' : 'graded';
```

**What This Fixes:**
- Coach-reviewed quizzes now ALWAYS get status `'submitted'` (not `'graded'`)
- This ensures the database trigger creates a `quiz_submissions` record
- Coach can now see the submission in their dashboard
- Standard quizzes still use `'graded'` for auto-grading (unchanged behavior)

### 2. `src/pages/coach/CourseBuilder.tsx`

#### Change 1: Initial Quiz Creation (Line 937-948)
**Before:**
```typescript
const newQuiz: Quiz = {
  id: quizId, title: quizTitle, description: "", instructions: "",
  passing_score: 70, time_limit_minutes: 30, max_attempts: 3,
  requires_manual_grading: false, requires_coach_approval: false,
  is_published: false,
  late_submission_allowed: true, late_penalty_percent: 10,
};
```

**After:**
```typescript
const newQuiz: Quiz = {
  id: quizId, title: quizTitle, description: "", instructions: "",
  passing_score: 70, time_limit_minutes: 30, max_attempts: 3,
  requires_manual_grading: false, requires_coach_approval: false,
  quiz_type: 'standard',  // ← ADDED: Explicit quiz_type
  is_published: false,
  late_submission_allowed: true, late_penalty_percent: 10,
};
```

#### Change 2: Quiz Save/Update (Line 963-977)
**Before:**
```typescript
const safeQuizData = {
  id: quizDataToSave.id,
  title: quizDataToSave.title,
  description: quizDataToSave.description || null,
  instructions: quizDataToSave.instructions || null,
  passing_score: quizDataToSave.passing_score || 70,
  time_limit_minutes: quizDataToSave.time_limit_minutes || null,
  max_attempts: quizDataToSave.max_attempts || null,
  requires_manual_grading: quizDataToSave.requires_manual_grading || false,
  requires_coach_approval: quizDataToSave.requires_coach_approval || false,
  is_published: quizDataToSave.is_published || false,
  updated_at: new Date().toISOString(),
};
```

**After:**
```typescript
const safeQuizData = {
  id: quizDataToSave.id,
  title: quizDataToSave.title,
  description: quizDataToSave.description || null,
  instructions: quizDataToSave.instructions || null,
  passing_score: quizDataToSave.passing_score || 70,
  time_limit_minutes: quizDataToSave.time_limit_minutes || null,
  max_attempts: quizDataToSave.max_attempts || null,
  requires_manual_grading: quizDataToSave.requires_manual_grading || false,
  requires_coach_approval: quizDataToSave.requires_coach_approval || false,
  quiz_type: quizDataToSave.quiz_type || (quizDataToSave.requires_coach_approval ? 'coach_reviewed' : 'standard'),  // ← ADDED
  attempt_control_enabled: quizDataToSave.attempt_control_enabled || false,  // ← ADDED
  allow_skipped_questions: quizDataToSave.allow_skipped_questions || false,  // ← ADDED
  is_published: quizDataToSave.is_published || false,
  updated_at: new Date().toISOString(),
};
```

## Database Fix Scripts

### Diagnostic Script: `DIAGNOSE_QUIZ_REVIEW_FETCH.sql`
Run this first to identify the issue. It checks:
1. Which quizzes have coach review enabled
2. Which quiz attempts were submitted
3. Which quiz_submissions are missing
4. If the trigger exists and is active
5. Course-coach relationships

### Fix Script: `FIX_QUIZ_REVIEW_NOT_APPEARING.sql`
Run this to fix existing data. It:
1. Updates all `quiz_type` values to match `requires_coach_approval`
2. Verifies the trigger function exists
3. Manually creates missing `quiz_submissions` for existing attempts
4. Provides verification queries

## How to Fix Your Existing Data

### Step 1: Run the Diagnostic
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open `DIAGNOSE_QUIZ_REVIEW_FETCH.sql`
4. Run it and review the results

### Step 2: Run the Fix
1. Open `FIX_QUIZ_REVIEW_NOT_APPEARING.sql` in Supabase SQL Editor
2. Run **STEP 1** (updates quiz_type for all quizzes)
3. Run **STEP 2** (verify the update worked)
4. Run **STEP 7** (check if submissions now exist)

### Step 3: If Submissions Still Missing
If STEP 7 shows no submissions for your attempts:
1. Uncomment **STEP 6** in the fix script
2. Run it to manually create missing submissions
3. Run **STEP 7** again to verify

### Step 4: Test the Flow
1. As a **coach**: Edit a quiz → Enable "Coach Review" → Save
2. As a **student**: Complete the quiz → Submit
3. As a **coach**: Go to Quiz Reviews → Should see the submission

## How the Complete Flow Works

### Quiz Creation (Coach)
1. Coach creates quiz in Course Builder
2. Quiz defaults to `quiz_type: 'standard'`, `requires_coach_approval: false`
3. Coach edits quiz settings → Toggles "Coach-Reviewed"
4. System sets `quiz_type: 'coach_reviewed'`, `requires_coach_approval: true`
5. Coach saves → **Both fields now saved to database** ✅

### Quiz Submission (Student)
1. Student opens coach-reviewed quiz
2. Student answers questions and clicks Submit
3. `quiz_attempts` status changes to `'submitted'`
4. **Database trigger fires:** `create_quiz_submission_on_submit_enhanced()`
5. Trigger checks: `quiz_type = 'coach_reviewed'` OR `requires_coach_approval = true`
6. Trigger creates `quiz_submissions` record with status `'pending_review'`
7. Student sees "Waiting for Coach Review" message

### Review Process (Coach)
1. Coach opens **Quiz Reviews** dashboard
2. `useCoachQuizSubmissions` hook fetches submissions:
   - Queries `quiz_submissions` WHERE status IN ('pending_review', 'failed', 'resubmission_required')
   - Joins through courses → modules → content_items → quizzes
   - Only shows submissions for coach's own courses
3. Coach clicks on submission
4. `QuizReviewDetail` loads the submission with student answers
5. Coach reviews and clicks "Approve" or "Request Resubmission"
6. Student gets feedback and notification

## Database Trigger Logic

```sql
CREATE TRIGGER trg_create_quiz_submission_enhanced
  AFTER UPDATE OF status ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION create_quiz_submission_on_submit_enhanced();
```

**Trigger checks:**
1. Did status change to 'submitted'? (not already submitted)
2. Is `quiz_type = 'coach_reviewed'` OR `requires_coach_approval = true`?
3. If YES → Create `quiz_submissions` record with status `'pending_review'`
4. If NO → Auto-grade based on passing score, no submission created

## RLS Policy for Coach Access

Coaches can only view submissions for their own courses:

```sql
CREATE POLICY "Coaches can view submissions for their quizzes"
  ON quiz_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_submissions.quiz_id
        AND EXISTS (
          SELECT 1 FROM module_content_items mci
          INNER JOIN modules m ON m.id = mci.module_id
          INNER JOIN courses c ON c.id = m.course_id
          WHERE mci.content_id = q.id
            AND mci.content_type = 'quiz'
            AND c.coach_id = auth.uid()
        )
    )
  );
```

**This means:**
- Quiz must be in a module
- Module must belong to a course
- Course must have `coach_id` matching the logged-in coach

## Testing Checklist

After applying fixes:

- [ ] Create new quiz (should have `quiz_type: 'standard'`)
- [ ] Edit quiz settings → Enable "Coach Review"
- [ ] Save quiz (check database: both fields should be set)
- [ ] As student: Complete and submit quiz
- [ ] Check database: `quiz_submissions` should be created
- [ ] As coach: Open Quiz Reviews dashboard
- [ ] Submission should appear in the list
- [ ] Click submission → Review detail loads
- [ ] Approve or reject submission
- [ ] Student receives feedback

## Common Issues & Solutions

### Issue: Submission still not appearing
**Solution:** 
1. Run diagnostic SQL to check if `quiz_submissions` exists
2. If missing, run STEP 6 of fix SQL to create manually
3. Verify coach owns the course (check `courses.coach_id`)

### Issue: "Submission Not Found" on review page
**Solution:**
- This was fixed in `QUIZ_REVIEW_FETCH_FIX.md` (inner join issue)
- Make sure that fix is also applied

### Issue: Student sees "Waiting for Review" but coach sees nothing
**Solution:**
1. Check `quiz_attempts.status` = 'submitted'
2. Check `quiz_submissions` exists for that attempt
3. Check coach owns the course
4. Check RLS policy is active

### Issue: Trigger not firing
**Solution:**
```sql
-- Recreate the trigger
DROP TRIGGER IF EXISTS trg_create_quiz_submission ON quiz_attempts;
DROP TRIGGER IF EXISTS trg_create_quiz_submission_enhanced ON quiz_attempts;

CREATE TRIGGER trg_create_quiz_submission_enhanced
  AFTER UPDATE OF status ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION create_quiz_submission_on_submit_enhanced();
```

## Related Fixes

- `QUIZ_REVIEW_FETCH_FIX.md` - Fixed inner join failures in review detail page
- `QUIZ_APPROVAL_IMPLEMENTATION.md` - Original quiz approval system
- `QUIZ_SYSTEM_IMPLEMENTATION_SUMMARY.md` - Complete quiz system overview
