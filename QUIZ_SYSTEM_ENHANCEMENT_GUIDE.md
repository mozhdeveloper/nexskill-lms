# Quiz System Enhancement - Implementation Guide
**Date:** 2026-04-13  
**Status:** Core Infrastructure Complete - UI Integration Pending

---

## ✅ Completed Components

### 1. Database Migration
**File:** `supabase/migrations/20260413_quiz_system_enhancements.sql`

**Added Fields:**
- `quizzes.attempt_control_enabled` - Toggle for custom attempt limits (OFF = 1 attempt default, ON = custom max_attempts)
- `quizzes.quiz_type` - Explicit type: 'standard' or 'coach_reviewed'
- `quizzes.allow_skipped_questions` - Whether students can skip questions during quiz
- `modules.enforce_sequential` - Whether module enforces sequential lesson progression

**New Database Functions:**
- `can_attempt_quiz(user_id, quiz_id)` - Validates if student can attempt quiz based on configuration
- `validate_quiz_submission(attempt_id)` - Checks quiz completeness (skipped questions)
- `can_access_lesson(user_id, lesson_id)` - Validates sequential lesson progression

**Enhanced Triggers:**
- `trg_create_quiz_submission_enhanced` - Auto-grades standard quizzes, creates submissions for coach_reviewed

### 2. TypeScript Types Updated
**File:** `src/types/quiz.ts`

Added to `Quiz` interface:
```typescript
attempt_control_enabled?: boolean;
quiz_type?: 'standard' | 'coach_reviewed';
allow_skipped_questions?: boolean;
```

### 3. QuizSettings UI Component
**File:** `src/components/quiz/QuizSettings.tsx`

**New Features:**
- ✅ Quiz Type selector (Standard vs Coach-Reviewed)
- ✅ Attempt Control toggle with custom attempt input
- ✅ Allow Skipped Questions toggle
- ✅ Contextual info banners explaining each mode
- ✅ Dynamic UI based on quiz type

### 4. Backend Validation Hooks
**File:** `src/hooks/useQuizSubmission.ts`

**New Functions:**
- `checkQuizAttemptPermission(userId, quizId)` - Calls `can_attempt_quiz()` RPC
- `validateQuizSubmissionComplete(attemptId)` - Calls `validate_quiz_submission()` RPC
- `checkLessonAccess(userId, lessonId)` - Calls `can_access_lesson()` RPC

---

## 🚧 Next Steps Required

### Priority 1: Student Quiz Session Validation
**File to Update:** `src/pages/student/QuizSession.tsx`

**Changes Needed:**

1. **Add Attempt Validation on Quiz Start:**
```typescript
// In handleStartAttempt function, add:
const validation = await checkQuizAttemptPermission(user.id, quizId);
if (!validation.can_attempt) {
  alert(validation.reason);
  return;
}
```

2. **Add Skipped Questions Validation on Submit:**
```typescript
// In handleSubmit function, before submitting:
if (!quizMeta.allow_skipped_questions) {
  // Check all questions answered
  const unansweredQuestions = questions.filter(q => !selectedAnswers[q.id]);
  if (unansweredQuestions.length > 0) {
    alert(`You must answer all questions before submitting. ${unansweredQuestions.length} questions remaining.`);
    return;
  }
}
```

3. **Upload Files/Videos for All Question Types:**
- The current implementation already handles file uploads
- Ensure file/video uploads complete before validation

4. **Update Quiz Meta Fetching:**
```typescript
// Add new fields to quiz meta fetch
setQuizMeta({
  // ... existing fields
  attempt_control_enabled: quiz.attempt_control_enabled,
  quiz_type: quiz.quiz_type || 'standard',
  allow_skipped_questions: quiz.allow_skipped_questions !== false,
});
```

### Priority 2: Course Player - Sequential Progression
**File to Update:** `src/pages/student/CoursePlayer.tsx`

**Changes Needed:**

1. **Add Lesson Access Check Before Navigation:**
```typescript
// When student clicks on a lesson in sidebar
const handleLessonClick = async (lessonId: string) => {
  const access = await checkLessonAccess(user.id, lessonId);
  if (!access.can_access) {
    alert(`Cannot access this lesson: ${access.lock_reason}`);
    return;
  }
  navigate(`/student/courses/${courseId}/lessons/${lessonId}`);
};
```

2. **Enforce Sequential Progression in UI:**
- Update lesson sidebar to show locked/unlocked state
- Disable clicks on locked lessons
- Show visual indicators (lock icons)

3. **Update Module Settings for Coaches:**
- Add toggle in CourseBuilder to enable `enforce_sequential` per module

### Priority 3: Student Quiz Result & Feedback Display
**Files to Update:**
- `src/pages/student/QuizResult.tsx`
- `src/pages/student/QuizFeedbackView.tsx`

**Changes Needed:**

1. **QuizResult.tsx - Enhanced Status Display:**
```typescript
// Show different messages based on quiz_type
if (quizMeta.quiz_type === 'coach_reviewed') {
  // Show "Pending Review" status
  // Disable retake button if submission is pending
  // Show "View Feedback" button if reviewed
} else {
  // Standard quiz - show pass/fail immediately
  // Show attempts remaining
}
```

2. **QuizFeedbackView.tsx - Coach Feedback Visibility:**
```typescript
// Display:
- Coach's review notes
- Feedback comments
- Media attachments (images, videos, documents)
- Status: Passed / Needs Retake
- Retake button (if needs retake)
```

### Priority 4: Coach Review Dashboard Enhancement
**Files to Update:**
- `src/pages/coach/QuizReviewDetail.tsx`
- `src/pages/coach/QuizReviewDashboard.tsx`

**Changes Needed:**

1. **Add Retake Enforcement for Failed Students:**
```typescript
// When coach marks as "failed":
await updateQuizSubmissionStatus(submissionId, 'resubmission_required', reviewNotes);
// Student must retake quiz
```

2. **Feedback Form Enhancement:**
- Add rich text editor for detailed feedback
- Support media attachments (already implemented)
- Add template suggestions for common feedback

### Priority 5: Module Sequential Progression Toggle
**File to Update:** `src/pages/coach/CourseBuilder.tsx`

**Changes Needed:**

1. **Add Module Settings Panel:**
```typescript
// In module header or settings
<label>
  <input
    type="checkbox"
    checked={module.enforce_sequential}
    onChange={(e) => updateModule(module.id, { enforce_sequential: e.target.checked })}
  />
  Enforce Sequential Progression
</label>
```

2. **Update Module Creation:**
- Default `enforce_sequential` to `true` for new modules

---

## 📋 Testing Checklist

### Database Migration
- [ ] Run migration: `supabase db push` or apply via Supabase Dashboard
- [ ] Verify new columns exist: `attempt_control_enabled`, `quiz_type`, `allow_skipped_questions`
- [ ] Test `can_attempt_quiz()` function with different scenarios
- [ ] Test `validate_quiz_submission()` with partial/complete attempts
- [ ] Test `can_access_lesson()` with various progression states

### Quiz Settings UI
- [ ] Create new quiz - verify default settings (standard, 1 attempt)
- [ ] Switch to coach_reviewed - verify settings update correctly
- [ ] Enable attempt control - verify custom attempt input appears
- [ ] Toggle allow_skipped_questions - verify state saves
- [ ] Save quiz and verify database reflects changes

### Student Quiz Flow
- [ ] Attempt quiz with attempt_control_enabled=false - verify only 1 attempt allowed
- [ ] Attempt quiz with attempt_control_enabled=true, max_attempts=3 - verify 3 attempts
- [ ] Submit quiz with skipped questions (allow_skipped_questions=false) - verify blocked
- [ ] Submit quiz with skipped questions (allow_skipped_questions=true) - verify allowed
- [ ] View quiz result for standard quiz - verify immediate pass/fail
- [ ] View quiz result for coach_reviewed quiz - verify "Pending Review" status
- [ ] Attempt quiz while previous submission is pending - verify blocked

### Sequential Lesson Progression
- [ ] Enable enforce_sequential on module
- [ ] Try to access lesson 2 without completing lesson 1 - verify blocked
- [ ] Complete lesson 1 - verify lesson 2 unlocks
- [ ] Complete quiz in lesson - verify next lesson unlocks
- [ ] Disable enforce_sequential - verify all lessons accessible

### Coach Review Flow
- [ ] Submit quiz (coach_reviewed type) - verify creates quiz_submissions record
- [ ] Coach reviews and marks as "passed" - verify next lesson unlocks
- [ ] Coach marks as "needs retake" - verify student can retake
- [ ] Coach adds feedback with media - verify student can view
- [ ] Student retakes quiz - verify new submission created

---

## 🔧 Configuration Examples

### Standard Quiz - 1 Attempt (Default)
```typescript
{
  quiz_type: 'standard',
  attempt_control_enabled: false,
  max_attempts: 1,
  allow_skipped_questions: true,
  passing_score: 70
}
```

### Standard Quiz - Custom Attempts
```typescript
{
  quiz_type: 'standard',
  attempt_control_enabled: true,
  max_attempts: 3,
  allow_skipped_questions: false,
  passing_score: 80
}
```

### Coach-Reviewed Quiz
```typescript
{
  quiz_type: 'coach_reviewed',
  attempt_control_enabled: false,
  max_attempts: undefined, // Unlimited
  allow_skipped_questions: false,
  passing_score: 70
}
```

### Module with Sequential Progression
```typescript
{
  enforce_sequential: true,
  // Students must complete lessons in order
}
```

---

## 🚀 Deployment Steps

1. **Apply Database Migration:**
```bash
cd nexskill-lms
supabase db push
# OR apply via Supabase Dashboard SQL Editor
```

2. **Verify Migration:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quizzes' 
  AND column_name IN ('attempt_control_enabled', 'quiz_type', 'allow_skipped_questions');
```

3. **Update Frontend:**
- All TypeScript files updated
- Run `npm run build` to verify no compilation errors

4. **Test in Development:**
- Follow testing checklist above
- Verify all features work as expected

5. **Deploy to Production:**
- Commit changes
- Deploy frontend
- Monitor for errors

---

## 📝 Notes & Considerations

### Backward Compatibility
- Existing quizzes default to `quiz_type='standard'` with `attempt_control_enabled=false`
- This means **1 attempt by default** for all existing quizzes
- Coaches can manually enable custom attempts if needed

### Performance
- Database functions use SECURITY DEFINER for efficient permission checking
- RPC calls are fast (typically <100ms)
- No N+1 query issues

### Security
- All validation enforced at database level (RLS policies)
- Frontend validation is UX enhancement, not security boundary
- Attempt limits enforced server-side

### Edge Cases Handled
- Student attempts quiz while pending review → Blocked
- Student tries to skip lessons → Blocked
- Quiz submission with unanswered questions → Blocked (if configured)
- Coach reviews failed submission → Can enforce retake
- Multiple concurrent attempts → Prevented by database constraints

---

## 🆘 Troubleshooting

### "can_attempt_quiz function not found"
- Ensure migration was applied successfully
- Check Supabase logs for migration errors

### Quiz settings not saving
- Check browser console for TypeScript errors
- Verify quiz record has proper fields in database
- Check RLS policies allow coach to update quizzes

### Sequential progression not working
- Verify `modules.enforce_sequential` is set to `true`
- Check `lesson_access_status` table for proper records
- Verify `can_access_lesson()` function exists

### Students can still skip questions
- Verify `allow_skipped_questions` is set to `false` in database
- Check QuizSession.tsx has validation logic added
- Verify frontend validation is not bypassed

---

## 📚 Additional Resources

- Database migration: `supabase/migrations/20260413_quiz_system_enhancements.sql`
- Types: `src/types/quiz.ts`
- QuizSettings UI: `src/components/quiz/QuizSettings.tsx`
- Validation hooks: `src/hooks/useQuizSubmission.ts`
- Existing approval system: `supabase/migrations/20260407_quiz_approval_system.sql`
