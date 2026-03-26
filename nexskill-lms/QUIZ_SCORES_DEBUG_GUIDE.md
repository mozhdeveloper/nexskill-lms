# 🔍 Quiz Scores Debugging Guide

## Problem
StudentScoresPanel is not showing quiz data even though students have completed quizzes.

## Root Cause Analysis

The issue is likely one of the following:

### 1. **RLS (Row Level Security) Policy Issue** ⚠️ MOST LIKELY
The coach's account may not have permission to read `quiz_attempts` from students.

**Solution:** Run the SQL in `FIX_QUIZ_RLS.sql` to create proper RLS policies.

### 2. **Quiz Not Linked to Course**
Quizzes must be added through the Course Editor → Curriculum → Add Content → Quiz.
If quizzes were created but not linked via `module_content_items`, they won't appear.

**Check:** Run the diagnostic SQL query in `DEBUG_QUIZ_SCORES.sql`

### 3. **Quiz Status Filter**
The code filters for `status IN ('submitted', 'graded')`. If attempts have status `'in_progress'`, they won't count.

**Check:** Look at browser console logs for attempt details.

### 4. **Quiz Not Published**
Only published quizzes (`is_published = true`) in `module_content_items` are fetched.

## 🛠️ Steps to Diagnose

### Step 1: Open Browser Console
1. Navigate to the Course Students page
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for the `=== QUIZ STATS DEBUG ===` section

### Step 2: Check Console Output

**Expected flow:**
```
📊 Module IDs: [...]
📊 Quiz IDs from module_content_items: [...]
📝 Student IDs: X

=== QUIZ STATS DEBUG ===
🔍 Quiz IDs to fetch: [...]
👥 Student IDs: [...]
📚 Quizzes data: [...]
📊 All quiz attempts fetched: X
```

**If quiz attempts = 0:**
- Quiz attempts exist in database but coach can't read them (RLS issue)
- OR quiz attempts don't exist for these quizzes

### Step 3: Run Diagnostic SQL

1. Go to Supabase Dashboard → SQL Editor
2. Run `DEBUG_QUIZ_SCORES.sql` (replace `YOUR_COURSE_ID_HERE` with actual course ID)
3. Check results:
   - Are quizzes linked to your course?
   - Do quiz attempts exist?
   - What status do the attempts have?

### Step 4: Fix RLS Policies

Run `FIX_QUIZ_RLS.sql` in Supabase SQL Editor to ensure coaches can read student quiz data.

## 📋 Common Issues & Fixes

### Issue: "Quiz IDs from module_content_items: []"
**Cause:** Quizzes not added to course curriculum
**Fix:** 
1. Go to Course Editor
2. Go to Curriculum tab
3. Add Quiz to a module via "Add Content"

### Issue: "All quiz attempts fetched: 0" but SQL shows attempts exist
**Cause:** RLS policy blocking access
**Fix:** Run `FIX_QUIZ_RLS.sql`

### Issue: Attempts have status "in_progress"
**Cause:** Student didn't submit the quiz properly
**Fix:** 
1. Check `QuizSession.tsx` submission logic
2. Ask student to complete the quiz properly
3. Or manually update status in database:
   ```sql
   UPDATE quiz_attempts 
   SET status = 'submitted' 
   WHERE status = 'in_progress' AND quiz_id = 'YOUR_QUIZ_ID';
   ```

### Issue: No quiz_responses for attempts
**Cause:** Quiz responses weren't saved during submission
**Fix:** Check `QuizSession.tsx` - responses should be saved along with attempt

## 🔧 Testing After Fix

1. Refresh the Course Students page
2. Check console for updated quiz stats
3. StudentScoresPanel should now show:
   - Quiz titles
   - Average scores
   - Completion rates
   - Total attempts

## 📝 Database Schema Reference

Key tables:
- `quizzes` - Quiz definitions
- `quiz_questions` - Questions in each quiz
- `quiz_attempts` - Student attempts (one per student per quiz)
- `quiz_responses` - Answers to each question in an attempt
- `module_content_items` - Links quizzes to courses/modules
- `modules` - Course modules
- `courses` - Course definitions
- `enrollments` - Student enrollments in courses
- `profiles` - User profiles

Relationships:
```
courses → modules → module_content_items → quizzes
                                              ↓
students → enrollments                    quiz_questions
    ↓                                          ↓
    └──────────────→ quiz_attempts ←───────────┘
                              ↓
                       quiz_responses
```

## 🎯 Quick Fix Checklist

- [ ] Run `DEBUG_QUIZ_SCORES.sql` to verify data exists
- [ ] Check browser console for debug logs
- [ ] Verify quizzes are linked via `module_content_items`
- [ ] Run `FIX_QUIZ_RLS.sql` to fix permissions
- [ ] Ensure quizzes are published (`is_published = true`)
- [ ] Ensure quiz attempts have status 'submitted' or 'graded'
- [ ] Refresh page and verify data appears
