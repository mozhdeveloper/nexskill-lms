# Course Versioning Implementation Plan

## The Problem

1. **Coach adds content** → entire approved course becomes invisible → needs admin re-approval
2. **Coach deletes content** → deletion goes live immediately → no admin review

### Root Cause

The `update_course_verification_status_on_content_change` trigger fires on any INSERT/UPDATE/DELETE to `modules`, `lessons`, `module_content_items`, `lesson_content_items` — and resets `verification_status = 'pending_review'` for approved courses. This, combined with the RLS policy `verification_status = 'approved'`, immediately hides the course from students.

---

## The Goal

### Phase 1: Additions (Do This First)
- Coach adds new lesson/module/content → course **stays visible** to students
- New content is **hidden** from students (`is_published = false`)
- Admin sees there are pending changes
- Admin approves → new content becomes visible

### Phase 2: Deletions (Do This Later)
- Coach deletes lesson/module/content → deletion is **NOT immediate**
- Deleted content stays visible to students until admin approves
- Admin approves → content actually deleted
- Admin rejects → content stays visible

---

## Database Changes Required

### Phase 1 (Additions): **NO new tables or columns needed**

- `is_published = false` already exists → acts as "draft/pending" flag
- `cascade_publish_on_course_approval` already exists → publishes all unpublished content on approval
- RLS policies already filter by `is_published = true` → students won't see new content
- The **only change needed**: modify the trigger to NOT reset `verification_status`

### Phase 2 (Deletions): **Minimal DB change needed**

Add `pending_deletion` boolean to:
- `modules.pending_deletion` (boolean, default false)
- `lessons.pending_deletion` (boolean, default false)
- `module_content_items.pending_deletion` (boolean, default false)
- `lesson_content_items.pending_deletion` (boolean, default false)

When coach "deletes" → set `pending_deletion = true` AND `is_published = false`
Admin approves → actual `DELETE` statement executes
Admin rejects → set `is_published = true`, `pending_deletion = false`

---

## How It Works (End-to-End)

### Phase 1: Additions

1. **Modify Trigger**
   - BEFORE: Content change → `verification_status = 'pending_review'` → course invisible
   - AFTER: Content change → `verification_status` stays `'approved'` → course stays visible
   - New content saved with `is_published = false`

2. **Admin Sees Pending Changes**
   - Admin dashboard queries: "Show courses where `verification_status = 'approved'` AND there exist items with `is_published = false`"
   - Display badge: "⚠️ 3 pending changes"
   - Admin clicks → sees what's new

3. **Admin Approves**
   - Runs `cascade_publish_on_course_approval`
   - All `is_published = false` → `is_published = true`
   - Students see updated course

### Phase 2: Deletions

1. **Add `pending_deletion` Columns** (see above)

2. **Modify Delete Handler**
   - BEFORE: Coach deletes → DELETE statement → gone immediately
   - AFTER: Coach deletes → UPDATE SET `pending_deletion = true`, `is_published = false`
   - Content hidden from students but still in DB

3. **Admin Sees Pending Deletions**
   - Admin sees: "⚠️ 2 items marked for deletion"
   - Can view what will be deleted

4. **Admin Approves**
   - Runs actual `DELETE` statements on items where `pending_deletion = true`

5. **Admin Rejects**
   - Sets `is_published = true`, `pending_deletion = false`
   - Content visible again

---

## Key Database Functions & Tables (From Live Schema)

### Critical Trigger
- `update_course_verification_status_on_content_change` — fires on INSERT/UPDATE/DELETE to `modules`, `lessons`, `module_content_items`, `lesson_content_items` — **THE ROOT CAUSE**

### Critical Function
- `cascade_publish_on_course_approval` — fires when `verification_status` changes to `'approved'` — publishes ALL unpublished modules/lessons/content_items/quizzes

### RLS Policies
- `anyone_view_approved_courses` — filters `courses` WHERE `verification_status = 'approved'`
- Multiple policies filter by `is_published = true` for modules, lessons, content items

---

## Conflicts To Flag

1. **`CourseBuilder.tsx`** already handles `isCoursePublished` — saves new content as `is_published = false`. The trigger is what breaks this by resetting the whole course status.
2. **`CourseModerationPage.tsx`** has `handleApprove()` — already publishes all modules/content/lessons/quizzes, then sets `verification_status = 'approved'`. Works perfectly for our approach.
3. **`CurriculumEditor.tsx`** handles CRUD — delete handlers will need modification for Phase 2 to set `pending_deletion` instead of actual DELETE.
4. **RLS policies already filter by `is_published = true`** — students won't see pending content. No changes needed.
5. **Approval is ALL-OR-NOTHING** — admin approves/rejects entire course update batch, not individual items.

---

## Implementation Order

```
PHASE 1 (Additions - Quick Win):
  1. Modify trigger to NOT reset verification_status for approved courses
  2. Test: Add lesson to approved course → course stays visible, new lesson hidden
  3. Add admin UI badge showing "pending changes" count
  4. Test: Admin approves → new content visible

PHASE 2 (Deletions - Slightly More Work):
  5. Add pending_deletion boolean to 4 tables
  6. Modify delete handlers to soft-delete instead of hard-delete
  7. Add admin UI for pending deletions
  8. Test: Delete lesson → stays visible, admin approves → actually deleted
```

---

## Constraints

- Do NOT break existing features
- UI changes must be consistent with existing UI
- Chunk work into small, verifiable steps
- Handle additions first, verify, then deletions
- NO full versioning system — keep it simple, use existing `is_published` flags
- Admin approves changes in batches (not individual items)

---

**Created:** 2026-04-07
**Status:** Plan approved, awaiting implementation