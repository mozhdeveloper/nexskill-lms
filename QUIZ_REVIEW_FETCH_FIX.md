# Quiz Review Fetch Fix

## Problem
The quiz review functionality was not fetching properly due to **inner join failures** in Supabase queries. When related data (quiz_attempts or quiz_questions) was missing or deleted, the queries would return null, causing the review page to fail with "Submission Not Found".

## Root Cause
The code was using `!inner` joins in Supabase queries:
- `quiz_attempts!inner()` - Would fail if the quiz attempt was missing
- `quiz_questions!inner()` - Would fail if any question was deleted

Inner joins require the related record to exist. If it doesn't, the entire query returns null.

## Files Fixed

### 1. `src/pages/coach/QuizReviewDetail.tsx`
**Changes:**
- **Lines 103-129**: Removed `quiz_attempts!inner()` join and replaced with a separate query to fetch quiz attempt scores
- **Lines 133-145**: Updated to use the separately fetched score values
- **Lines 163-187**: Changed `quiz_questions!inner()` to a regular join (left join) and added fallback text for missing questions

**Before:**
```typescript
const { data: subData, error: subError } = await supabase
  .from('quiz_submissions')
  .select(`
    *,
    quiz_attempts!inner(
      score,
      max_score
    )
  `)
  .eq('id', submissionId)
  .single();
```

**After:**
```typescript
const { data: subData, error: subError } = await supabase
  .from('quiz_submissions')
  .select('*')
  .eq('id', submissionId)
  .single();

// Fetch quiz attempt scores separately
let quizScore = null;
let quizMaxScore = null;

if (subData.quiz_attempt_id) {
  const { data: attemptData } = await supabase
    .from('quiz_attempts')
    .select('score, max_score')
    .eq('id', subData.quiz_attempt_id)
    .single();
  
  if (attemptData) {
    quizScore = attemptData.score;
    quizMaxScore = attemptData.max_score;
  }
}
```

### 2. `src/pages/student/QuizSession.tsx`
**Changes:**
- **Lines 450-478**: Changed `quiz_questions!inner()` to a regular join and added fallback values

**Before:**
```typescript
const { data: prevResponses } = await supabase
  .from('quiz_responses')
  .select(`
    *,
    quiz_questions!inner(
      question_content,
      question_type
    )
  `)
  .eq('attempt_id', submission.latest_attempt_id);
```

**After:**
```typescript
const { data: prevResponses } = await supabase
  .from('quiz_responses')
  .select(`
    *,
    quiz_questions(
      question_content,
      question_type
    )
  `)
  .eq('attempt_id', submission.latest_attempt_id);
```

### 3. `src/pages/coach/QuizReviewDetail.tsx` (TypeScript Fix)
**Changes:**
- **Line 437**: Fixed TypeScript null check for `quiz_score` calculation

**Before:**
```typescript
const scorePercent = submission.quiz_max_score
  ? Math.round((submission.quiz_score / submission.quiz_max_score) * 100)
  : 0;
```

**After:**
```typescript
const scorePercent = submission.quiz_max_score && submission.quiz_score !== null
  ? Math.round((submission.quiz_score / submission.quiz_max_score) * 100)
  : 0;
```

## Benefits of These Fixes

1. **Resilient to Missing Data**: Queries now work even if related records are missing
2. **Better Error Handling**: Separate queries allow partial success (e.g., show submission even if attempt is missing)
3. **Graceful Degradation**: Missing questions show "Question not found" instead of failing entirely
4. **Type Safety**: Fixed TypeScript null checks to prevent runtime errors
5. **Maintainability**: Clearer separation of concerns with individual queries

## Testing Recommendations

1. Test reviewing a normal quiz submission (all data present)
2. Test reviewing a submission where some questions were deleted
3. Test reviewing a submission where the quiz attempt might have issues
4. Verify student can still see their previous attempts in pending review mode
5. Check that error messages are helpful when data is missing

## Additional Notes

The `useCoachQuizSubmissions` hook in `useQuizSubmission.ts` was already implemented correctly with batched queries to avoid join-related timeouts. No changes were needed there.

## Related Issues

This fix addresses the same inner join pattern that could affect:
- Quiz feedback views
- Student quiz result pages
- Any code joining quiz_responses to quiz_questions or quiz_submissions to quiz_attempts

Monitor browser console for any remaining fetch errors after deployment.
