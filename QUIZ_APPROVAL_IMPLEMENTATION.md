# Quiz Approval & Sequential Lesson Lock - Implementation Guide

## 📋 Overview
This document outlines the implementation of the Quiz Approval & Sequential Lesson Lock system for the NexSkill LMS.

## ✅ Phase 1: Foundation (COMPLETED)

### 1. Database Schema
**File**: `supabase/migrations/20260407_quiz_approval_system.sql`

#### New Tables Created:
1. **`quiz_submissions`**
   - Tracks coach review status of quiz attempts
   - Status: `pending_review` | `passed` | `failed` | `resubmission_required`
   - Links: `user_id`, `quiz_id`, `quiz_attempt_id`
   - Fields: `reviewed_at`, `reviewed_by`, `review_notes`

2. **`quiz_feedback`**
   - Stores coach feedback with media attachments
   - Fields: `comment`, `media_urls` (JSONB array), `is_resubmission_feedback`
   - Links: `quiz_submission_id`, `coach_id`

3. **`lesson_access_status`**
   - Controls which lessons are locked/unlocked for each student
   - Fields: `is_locked`, `unlock_reason`, `unlocked_at`, `unlocked_by`
   - Links: `user_id`, `lesson_id`, `content_item_id`

#### New Columns Added:
- `quizzes.requires_coach_approval` (BOOLEAN) - Flag for quizzes requiring manual review
- `module_content_items.is_sequential` (BOOLEAN) - Mark items requiring sequential access

#### Database Functions:
1. **`check_quiz_requires_approval(p_quiz_id)`** - Returns true if quiz needs coach approval
2. **`get_student_quiz_submission_status(p_user_id, p_quiz_id)`** - Gets latest submission status
3. **`unlock_next_lesson(p_user_id, p_quiz_id)`** - Unlocks next lesson after quiz approval
4. **`is_lesson_locked(p_user_id, p_lesson_id)`** - Checks if lesson is locked for student
5. **`get_course_lesson_access_status(p_user_id, p_course_id)`** - Gets all lesson lock statuses for a course

#### Triggers:
1. **`trg_create_quiz_submission`** - Auto-creates quiz submission when quiz attempt is submitted (only for quizzes with `requires_coach_approval = true`)
2. **`trg_unlock_next_lesson`** - Auto-unlocks next lesson when coach marks submission as "passed"

#### RLS Policies:
- Students can view their own submissions and feedback
- Coaches can view/update submissions for their courses
- System can insert/manage access status

### 2. TypeScript Types
**File**: `src/types/quiz.ts`

Added new interfaces:
```typescript
QuizSubmissionStatus = 'pending_review' | 'passed' | 'failed' | 'resubmission_required'
QuizSubmission
QuizFeedbackMedia
QuizFeedback
LessonAccessStatus
QuizSubmissionStatusResult
```

### 3. React Hooks
**File**: `src/hooks/useQuizSubmission.ts`

Created comprehensive hooks:
- `useQuizSubmission(quizId)` - Fetches student's quiz submission status
- `useLessonAccessStatus(courseId)` - Fetches lesson lock status for all lessons in a course
- `useQuizFeedback(submissionId)` - Fetches coach feedback for a submission
- `useCoachQuizSubmissions(courseId)` - Fetches pending submissions for coach dashboard

Utility functions:
- `updateQuizSubmissionStatus()` - Coach updates submission status
- `createQuizFeedback()` - Coach creates feedback with media
- `checkLessonLocked()` - Checks if a lesson is locked

### 4. UI Updates

#### QuizResult Component (`src/pages/student/QuizResult.tsx`)
✅ Shows "Pending Coach Review" status badge
✅ Displays alert explaining the review process
✅ Shows coach's notes if available
✅ "View Coach Feedback" button when feedback exists
✅ Different action buttons based on status (pending/passed/failed)

#### QuizSession Component (`src/pages/student/QuizSession.tsx`)
✅ Fetches `requires_coach_approval` from quiz
✅ Passes flag to QuizResult via navigation state
✅ Supports the new submission flow

## 🚀 Next Steps (Phase 2)

### 1. Coach Quiz Review Dashboard
**Location**: Create `src/pages/coach/QuizReviewDashboard.tsx`

Features needed:
- List all pending quiz submissions for coach's courses
- Filter by status (pending, passed, failed)
- Student name, quiz title, submission date
- Click to review submission

**Suggested route**: `/coach/courses/:courseId/quiz-reviews`

### 2. Coach Quiz Review Detail
**Location**: Create `src/pages/coach/QuizReviewDetail.tsx`

Features needed:
- View student's quiz attempt and responses
- See score and which questions were correct/incorrect
- Pass/Fail buttons
- Text area for feedback comments
- Media upload button (images/videos)
- Submit review button

**Actions on submit**:
```typescript
// Update quiz submission status
updateQuizSubmissionStatus(submissionId, 'passed' or 'failed', notes)

// Create feedback
createQuizFeedback(submissionId, coachId, comment, mediaUrls)

// Trigger automatically unlocks next lesson via DB trigger
```

**Suggested route**: `/coach/courses/:courseId/quiz-reviews/:submissionId`

### 3. Student Feedback View Page
**Location**: Create `src/pages/student/QuizFeedbackView.tsx`

Features needed:
- Display coach's feedback comment
- Show attached media (images with viewer, videos with player)
- Show submission status
- If failed: "Retake Quiz" button
- If passed: "Continue to Next Lesson" button

**Suggested route**: `/student/courses/:courseId/quizzes/:quizId/feedback`

**Add to QuizResult.tsx**:
```typescript
const handleViewFeedback = () => {
  navigate(`/student/courses/${courseId}/quizzes/${quizId}/feedback`);
};
```

### 4. Sequential Lesson Lock in Curriculum
**Location**: Update `src/components/learning/LessonSidebar.tsx`

Changes needed:
```typescript
// Import hook
import { useLessonAccessStatus } from '../../hooks/useQuizSubmission';

// Inside component
const { isLessonLocked, loading } = useLessonAccessStatus(courseId);

// When rendering lesson item
const locked = isLessonLocked(lesson.id);

if (locked) {
  return (
    <div className="opacity-50 cursor-not-allowed">
      <Lock className="w-4 h-4" />
      <span>{lesson.title}</span>
      <span className="text-xs">Complete previous quiz to unlock</span>
    </div>
  );
}
```

**Also update**: `CoursePlayer.tsx` to prevent navigation to locked lessons

### 5. Coach Quiz Creation UI Update
**Location**: Wherever coaches create/edit quizzes

Add checkbox:
```typescript
<label>
  <input type="checkbox" {...register('requires_coach_approval')} />
  Require coach approval before students can proceed
</label>
```

This sets `requires_coach_approval = true` in the `quizzes` table.

## 📊 Data Flow

### Student Submits Quiz:
```
1. Student completes quiz → QuizSession.tsx
2. Creates quiz_attempt in quiz_attempts table
3. Trigger detects status = 'submitted'
4. If quiz.requires_coach_approval = true:
   - Creates quiz_submission with status = 'pending_review'
5. Navigates to QuizResult.tsx
6. Shows "Pending Coach Review" status
```

### Coach Reviews Quiz:
```
1. Coach opens QuizReviewDashboard
2. Selects pending submission
3. Opens QuizReviewDetail
4. Reviews student responses
5. Adds feedback comment + media (optional)
6. Marks as Pass or Fail
7. Updates quiz_submissions.status
8. If passed:
   - Trigger calls unlock_next_lesson()
   - Updates lesson_access_status.is_locked = false
   - Student can now access next lesson
```

### Student Checks Progress:
```
1. Student opens CoursePlayer or LessonSidebar
2. useLessonAccessStatus hook fetches lock status
3. Locked lessons show with lock icon
4. Clicking locked lesson shows "Complete previous quiz first"
5. If feedback available, student can view it
```

## 🔧 Database Migration Instructions

Run this SQL in your Supabase SQL Editor:

```bash
# Navigate to Supabase Dashboard > SQL Editor
# Copy and paste the contents of:
supabase/migrations/20260407_quiz_approval_system.sql
```

Or via CLI:
```bash
cd C:\Users\John Marco\Desktop\nex skill\nexskill-lms\nexskill-lms
npx supabase db push
```

## 🧪 Testing Checklist

### Student Flow:
- [ ] Student takes quiz with `requires_coach_approval = true`
- [ ] Quiz result shows "Pending Coach Review"
- [ ] Next lesson is locked in sidebar
- [ ] Student cannot navigate to locked lesson
- [ ] Student receives notification when coach reviews
- [ ] Student can view coach feedback
- [ ] If failed, student can retake quiz
- [ ] If passed, next lesson unlocks

### Coach Flow:
- [ ] Coach creates quiz with "Requires Approval" checkbox
- [ ] Coach sees pending submissions in dashboard
- [ ] Coach can view student responses
- [ ] Coach can add text feedback
- [ ] Coach can upload media feedback
- [ ] Coach marks quiz as Pass/Fail
- [ ] Next lesson unlocks automatically on Pass

## 📝 Notes

- The system is backward compatible - existing quizzes without `requires_coach_approval` work as before
- Lesson locking is per-student, not global
- First lesson in each module is auto-unlocked
- Media uploads use the existing Cloudinary setup
- All database functions use `SECURITY DEFINER` for proper permissions

## 🎯 Priority Implementation Order

1. **Run database migration** (CRITICAL - blocks everything else)
2. **Create student feedback view page** (students need to see feedback)
3. **Update LessonSidebar to show lock status** (visual indicator)
4. **Create coach review dashboard** (coaches need to review)
5. **Create coach review detail page** (actual review interface)
6. **Add media upload to feedback** (enhanced feedback)
7. **Test end-to-end flow** (verify everything works)

## 📚 Files Created/Modified

### Created:
- `supabase/migrations/20260407_quiz_approval_system.sql`
- `src/hooks/useQuizSubmission.ts`

### Modified:
- `src/types/quiz.ts` - Added new types
- `src/pages/student/QuizResult.tsx` - Pending review status
- `src/pages/student/QuizSession.tsx` - Passes approval flag

### To Be Created (Phase 2):
- `src/pages/coach/QuizReviewDashboard.tsx`
- `src/pages/coach/QuizReviewDetail.tsx`
- `src/pages/student/QuizFeedbackView.tsx`
- Update `src/components/learning/LessonSidebar.tsx`
- Update quiz creation form
