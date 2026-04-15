# Phase 1: Course Versioning - Implementation Status

**Date:** 2026-04-08
**Status:** ⚠️ INCOMPLETE - Triggers still resetting course status despite fixes

---

## Goal
When a coach adds/edits content on an **already approved course**, the course should **stay visible** to students (`verification_status = 'approved'`) while new content remains hidden (`is_published = false`) until admin approval.

---

## What We Changed

### 1. Database Migration File
**File:** `nexskill-lms/supabase/migrations/20260408_phase1_content_additions.sql`

**Purpose:** Replace all existing verification triggers with Phase 1 versions that don't reset course status when content is added to approved courses.

**Key Changes:**
- Dropped all old triggers and functions
- Created 3 new trigger functions with Phase 1 logic:
  - `update_course_verification_status_on_content_change()` - handles `modules`, `module_content_items`, `lesson_content_items`
  - `update_course_verification_on_lesson_change()` - handles `lessons` table
  - `update_course_verification_on_quiz_change()` - handles `quizzes` table
- Created 5 triggers on respective tables (AFTER INSERT OR UPDATE OR DELETE)

**Phase 1 Logic:**
- `INSERT` with `is_published = false` → course **stays approved**
- `UPDATE` on lessons → course **stays approved** (skip reset for content_blocks changes)
- `UPDATE` on other tables → course goes to `pending_review`
- `DELETE` → course goes to `pending_review` (Phase 2 will fix with soft-delete)

**CRITICAL BUG DISCOVERED:** The `trg_lessons_change` function (`update_course_verification_on_lesson_change`) kept deploying without the `ELSIF TG_OP = 'UPDATE' THEN` skip block. Even after multiple migration runs, the database had the OLD version. Had to run the function creation SQL directly in Supabase SQL Editor to force the correct version.

---

### 2. Frontend Code Changes

#### A. `lesson-content.queries.ts`
**File:** `nexskill-lms/src/lib/supabase/lesson-content.queries.ts`

**Change:** Modified `createContentItem()` function to auto-detect course status before inserting:

```typescript
// Phase 1: Determine publish status
let isPublished: boolean;
if (options?.is_published !== undefined) {
    isPublished = options.is_published;
} else {
    // Auto-detect: check if course is approved
    const { data: course } = await supabase
        .from('courses')
        .select('verification_status')
        .eq('id', course_id)
        .single();
    
    // If course is approved, save as unpublished (pending review)
    // Otherwise, save as published (normal course building)
    isPublished = course?.verification_status !== 'approved';
}
```

**Issue:** The function checks course status at insertion time. If the course is `pending_review` (from a previous trigger reset), it saves as `is_published: true`, which keeps the cycle going.

**Debug logging added:**
```typescript
console.log('[createContentItem] Checking course status for course_id:', course_id);
console.log('[createContentItem] Course verification_status:', course?.verification_status);
console.log('[createContentItem] isPublished will be:', isPublished);
```

#### B. `LessonSidebar.tsx`
**File:** `nexskill-lms/src/components/learning/LessonSidebar.tsx`

**Change:** Fixed lesson duration calculation to sum ALL video durations in a lesson AND add quiz durations from `quizzes.time_limit_minutes`.

- Added query for `lesson_content_items` to get all videos and quizzes per lesson
- Added query for `quizzes` table to get `time_limit_minutes`
- Calculated total duration per lesson: `videoSeconds + quizSeconds`
- **Root cause of duration bug:** Quizzes were storing `time_limit_minutes = 30` (not 15 as expected), so durations were inflated
- **Resolution:** Keep actual quiz settings (30 min) instead of forcing 15 min

---

## Diagnostic Findings

### Triggers Currently Installed
| Trigger | Table | Events | Function |
|---------|-------|--------|----------|
| `trg_lessons_change` | `lessons` | INSERT, UPDATE, DELETE | `update_course_verification_on_lesson_change()` |
| `trg_lesson_content_items_change` | `lesson_content_items` | INSERT, UPDATE, DELETE | `update_course_verification_status_on_content_change()` |
| `trg_module_content_items_change` | `module_content_items` | INSERT, UPDATE, DELETE | `update_course_verification_status_on_content_change()` |
| `trg_modules_content_change` | `modules` | INSERT, UPDATE, DELETE | `update_course_verification_status_on_content_change()` |
| `trg_quizzes_change` | `quizzes` | INSERT, UPDATE, DELETE | `update_course_verification_on_quiz_change()` |

### Functions Currently Installed
| Function | Has is_published check | Phase 1 version | Length |
|----------|----------------------|-----------------|--------|
| `update_course_verification_status_on_content_change` | ✅ | ✅ | 2686 |
| `update_course_verification_on_lesson_change` | ✅ | ✅ | 1364 |
| `update_course_verification_on_quiz_change` | ✅ | ✅ | 1658 |
| `cascade_publish_on_course_approval` | ✅ | ❌ (unchanged) | 1679 |

---

## Root Cause Analysis

**The Problem:** Despite the correct function code being deployed (confirmed via `pg_proc` query showing the `ELSIF TG_OP = 'UPDATE'` block exists), the course STILL resets to `pending_review` when a video is added.

**Possible Reasons (unresolved):**
1. **Multiple triggers firing** - There might be other triggers not found by our diagnostic query that are also resetting the status
2. **`lesson_content_items` insert with `is_published = true`** - If the frontend is somehow still saving with `is_published: true` (due to timing/race condition where the course is already `pending_review` when the check runs), the `update_course_verification_status_on_content_change` trigger will reset it
3. **Trigger not actually updated** - Even though `pg_proc` shows correct code, the actual execution might be using cached/old version

**Race Condition Identified:**
```
1. Coach opens course page (course is 'approved', isCoursePublished = true)
2. Coach adds video
3. Frontend calls CourseBuilder.handleSaveVideoBlock → updates lessons.content_blocks
4. This fires trg_lessons_change → triggers reset to pending_review
5. THEN frontend calls createContentItem → course is already 'pending_review'
6. createContentItem saves as is_published = true (because course is pending_review)
7. This fires trg_lesson_content_items_change → triggers ANOTHER reset
```

---

## Files Modified
- `nexskill-lms/supabase/migrations/20260408_phase1_content_additions.sql` (migration file)
- `nexskill-lms/supabase/migrations/phase1_diagnostic_query.sql` (diagnostic query)
- `nexskill-lms/src/lib/supabase/lesson-content.queries.ts` (createContentItem auto-detect)
- `nexskill-lms/src/components/learning/LessonSidebar.tsx` (duration calculation fix)

---

## Next Steps (For Tomorrow)
1. **Identify ALL triggers** - Run comprehensive trigger audit to find EVERY trigger that modifies `courses.verification_status`
2. **Fix the race condition** - Either:
   - Make `handleSaveVideoBlock` in `CourseBuilder.tsx` skip the `lessons.content_blocks` update when course is approved, OR
   - Add a flag/session variable to tell triggers "this is an approved-course content add, don't reset"
3. **Ensure `is_published: false`** - Verify that ALL code paths inserting into `lesson_content_items` use `is_published: false` when course is approved
4. **Test thoroughly** - Add video → check status → add another video → check status → edit lesson → check status

---

## Key SQL Commands for Tomorrow

### Check all triggers
```sql
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('courses', 'modules', 'lessons', 'module_content_items', 'lesson_content_items', 'quizzes')
ORDER BY event_object_table, trigger_name;
```

### Check function source code
```sql
SELECT proname, prosrc FROM pg_proc 
WHERE proname IN (
  'update_course_verification_status_on_content_change',
  'update_course_verification_on_lesson_change',
  'update_course_verification_on_quiz_change'
);
```

### Approve course for testing
```sql
UPDATE courses SET verification_status = 'approved', updated_at = NOW()
WHERE id = 'YOUR_COURSE_ID';
```

### Check course status
```sql
SELECT verification_status, updated_at FROM courses WHERE id = 'YOUR_COURSE_ID';
```
